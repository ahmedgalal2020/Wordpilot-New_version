create extension if not exists "pgcrypto";

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature_key text not null,
  event_type text not null default 'used',
  quantity integer not null default 1,
  period_start timestamptz not null,
  period_end timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.usage_events (
  user_id,
  feature_key,
  event_type,
  quantity,
  period_start,
  period_end,
  metadata,
  created_at
)
select
  generated_texts.user_id,
  'ai_generation',
  'used',
  1,
  date_trunc('month', generated_texts.created_at),
  date_trunc('month', generated_texts.created_at) + interval '1 month',
  jsonb_build_object('generated_text_id', generated_texts.id, 'source', 'generated_texts_backfill'),
  generated_texts.created_at
from public.generated_texts
where not exists (
  select 1
  from public.usage_events
  where usage_events.user_id = generated_texts.user_id
    and usage_events.feature_key = 'ai_generation'
    and usage_events.metadata->>'generated_text_id' = generated_texts.id::text
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.dictation_sessions (id) on delete set null,
  title text not null,
  score numeric(5,2) not null default 0,
  language text,
  cefr_level text,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_name text not null default 'WordPilot Pro',
  status text not null default 'active',
  billing_cycle text not null default 'monthly',
  amount_cents integer not null default 1200,
  currency text not null default 'usd',
  payment_status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  renewal_date timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.user_subscriptions (id) on delete set null,
  label text not null,
  amount_cents integer not null default 1200,
  currency text not null default 'usd',
  status text not null default 'paid',
  payment_status text,
  stripe_invoice_id text,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  hosted_invoice_url text,
  invoice_pdf_url text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_subscriptions_stripe_subscription_id_key
on public.user_subscriptions (stripe_subscription_id);

create unique index if not exists user_subscriptions_stripe_checkout_session_id_key
on public.user_subscriptions (stripe_checkout_session_id);

create unique index if not exists billing_invoices_stripe_invoice_id_key
on public.billing_invoices (stripe_invoice_id);

create unique index if not exists billing_invoices_stripe_checkout_session_id_key
on public.billing_invoices (stripe_checkout_session_id);

alter table public.usage_events enable row level security;
alter table public.certificates enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;

drop policy if exists "users manage own usage_events" on public.usage_events;
drop policy if exists "users can read own usage_events" on public.usage_events;
create policy "users can read own usage_events"
on public.usage_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own usage_events" on public.usage_events;
create policy "users can insert own usage_events"
on public.usage_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own certificates" on public.certificates;
create policy "users manage own certificates"
on public.certificates
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own subscriptions" on public.user_subscriptions;
drop policy if exists "users can read own subscriptions" on public.user_subscriptions;
create policy "users can read own subscriptions"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own invoices" on public.billing_invoices;
drop policy if exists "users can read own invoices" on public.billing_invoices;
create policy "users can read own invoices"
on public.billing_invoices
for select
to authenticated
using (auth.uid() = user_id);

-- Optional recovery for a user who already paid before these tables existed:
-- replace USER_ID_HERE with the auth.users id, then run the insert below once.
--
-- insert into public.user_subscriptions (
--   user_id,
--   plan_name,
--   status,
--   billing_cycle,
--   amount_cents,
--   currency,
--   payment_status,
--   current_period_start,
--   current_period_end,
--   renewal_date,
--   metadata
-- )
-- values (
--   'USER_ID_HERE',
--   'WordPilot Pro',
--   'active',
--   'monthly',
--   1200,
--   'usd',
--   'paid',
--   now(),
--   now() + interval '1 month',
--   now() + interval '1 month',
--   '{"source":"manual_recovery_after_missing_billing_tables"}'::jsonb
-- );
