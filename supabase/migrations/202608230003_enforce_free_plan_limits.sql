-- Enforce WordPilot free-plan write limits at the database boundary.
-- Client-side checks remain for UX, but these triggers are the source of truth.

create or replace function public.is_wordpilot_pro(p_user_id uuid)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions
    where user_id = p_user_id
      and lower(coalesce(plan_name, '')) like '%pro%'
      and lower(coalesce(status, '')) not in ('canceled', 'cancelled', 'unpaid', 'past_due', 'incomplete_expired')
      and (
        lower(coalesce(status, '')) in ('active', 'trialing', 'paid', 'complete', 'completed', 'succeeded')
        or lower(coalesce(payment_status, '')) in ('paid', 'complete', 'completed', 'succeeded')
        or coalesce(current_period_end, renewal_date) > now()
        or stripe_subscription_id is not null
        or stripe_checkout_session_id is not null
      )
  )
  or exists (
    select 1
    from public.billing_invoices
    where user_id = p_user_id
      and (
        lower(coalesce(status, '')) in ('paid', 'complete', 'completed', 'succeeded')
        or lower(coalesce(payment_status, '')) in ('paid', 'complete', 'completed', 'succeeded')
        or (paid_at is not null and (stripe_checkout_session_id is not null or stripe_invoice_id is not null))
        or period_end > now()
      )
  );
$$;

create or replace function public.enforce_wordpilot_free_limits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  monthly_ai_count integer;
  saved_text_count integer;
  saved_session_count integer;
begin
  if (select auth.uid()) is null or new.user_id <> (select auth.uid()) then
    raise exception 'Invalid WordPilot user ownership.';
  end if;

  if public.is_wordpilot_pro(new.user_id) then
    return new;
  end if;

  if tg_table_name = 'generated_texts' then
    select count(*) into monthly_ai_count
    from public.generated_texts
    where user_id = new.user_id
      and created_at >= date_trunc('month', now())
      and created_at < date_trunc('month', now()) + interval '1 month';

    if monthly_ai_count >= 3 then
      raise exception 'Free AI generation limit reached.';
    end if;
  elsif tg_table_name = 'saved_texts' then
    select count(*) into saved_text_count
    from public.saved_texts
    where user_id = new.user_id;

    if saved_text_count >= 3 then
      raise exception 'Free saved text limit reached.';
    end if;
  elsif tg_table_name in ('dictation_sessions', 'shadowing_sessions') then
    select
      (select count(*) from public.dictation_sessions where user_id = new.user_id)
      + (select count(*) from public.shadowing_sessions where user_id = new.user_id)
    into saved_session_count;

    if saved_session_count >= 5 then
      raise exception 'Free saved session limit reached.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_generated_texts on public.generated_texts;
create trigger enforce_free_generated_texts
before insert on public.generated_texts
for each row execute function public.enforce_wordpilot_free_limits();

drop trigger if exists enforce_free_saved_texts on public.saved_texts;
create trigger enforce_free_saved_texts
before insert on public.saved_texts
for each row execute function public.enforce_wordpilot_free_limits();

drop trigger if exists enforce_free_dictation_sessions on public.dictation_sessions;
create trigger enforce_free_dictation_sessions
before insert on public.dictation_sessions
for each row execute function public.enforce_wordpilot_free_limits();

drop trigger if exists enforce_free_shadowing_sessions on public.shadowing_sessions;
create trigger enforce_free_shadowing_sessions
before insert on public.shadowing_sessions
for each row execute function public.enforce_wordpilot_free_limits();
