create unique index if not exists user_subscriptions_stripe_subscription_id_key
on public.user_subscriptions (stripe_subscription_id);

create unique index if not exists user_subscriptions_stripe_checkout_session_id_key
on public.user_subscriptions (stripe_checkout_session_id);

create unique index if not exists billing_invoices_stripe_invoice_id_key
on public.billing_invoices (stripe_invoice_id);

create unique index if not exists billing_invoices_stripe_checkout_session_id_key
on public.billing_invoices (stripe_checkout_session_id);

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
