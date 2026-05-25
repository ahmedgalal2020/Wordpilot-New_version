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
