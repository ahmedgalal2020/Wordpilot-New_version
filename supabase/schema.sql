create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  target_language text default 'English',
  cefr_level text default 'B1',
  is_blocked boolean not null default false,
  blocked_reason text,
  blocked_at timestamptz,
  blocked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  status text not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint admin_users_role_check check (role in ('owner', 'admin')),
  constraint admin_users_status_check check (status in ('active', 'revoked'))
);

create table if not exists public.saved_texts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  level text,
  category text,
  source text,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_texts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  prompt text,
  content text not null,
  level text,
  created_at timestamptz not null default now()
);

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

create table if not exists public.dictation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_text text not null,
  input_text text,
  accuracy numeric(5,2),
  language text,
  cefr_level text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dictation_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.dictation_sessions (id) on delete cascade,
  written_word text,
  correct_word text not null,
  status text not null check (status in ('wrong', 'missing', 'extra')),
  source_index integer,
  input_index integer,
  language text,
  cefr_level text,
  created_at timestamptz not null default now()
);

create table if not exists public.practice_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  cefr_level text not null,
  lesson_id text,
  exercise_id text not null,
  status text not null default 'in_progress',
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_progress_status_check check (status in ('in_progress', 'completed')),
  constraint practice_progress_started_check check (status <> 'in_progress' or started_at is not null),
  constraint practice_progress_completed_check check (status <> 'completed' or completed_at is not null),
  constraint practice_progress_user_exercise_key unique (user_id, exercise_id)
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

alter table public.user_subscriptions
  add column if not exists currency text not null default 'usd',
  add column if not exists payment_status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.billing_invoices
  add column if not exists currency text not null default 'usd',
  add column if not exists payment_status text,
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists hosted_invoice_url text,
  add column if not exists invoice_pdf_url text,
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_reason text,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_by uuid references auth.users (id) on delete set null;

create unique index if not exists user_subscriptions_stripe_subscription_id_key
on public.user_subscriptions (stripe_subscription_id);

create unique index if not exists user_subscriptions_stripe_checkout_session_id_key
on public.user_subscriptions (stripe_checkout_session_id);

create unique index if not exists billing_invoices_stripe_invoice_id_key
on public.billing_invoices (stripe_invoice_id);

create unique index if not exists billing_invoices_stripe_checkout_session_id_key
on public.billing_invoices (stripe_checkout_session_id);

create index if not exists admin_users_email_idx on public.admin_users (lower(email));
create index if not exists admin_users_status_idx on public.admin_users (status);
create index if not exists profiles_is_blocked_idx on public.profiles (is_blocked);
create index if not exists dictation_mistakes_user_created_idx on public.dictation_mistakes (user_id, created_at desc);
create index if not exists dictation_mistakes_user_correct_word_idx on public.dictation_mistakes (user_id, lower(correct_word));
create index if not exists dictation_mistakes_session_idx on public.dictation_mistakes (session_id);
create index if not exists practice_progress_user_path_idx on public.practice_progress (user_id, language, cefr_level);
create index if not exists practice_progress_user_status_idx on public.practice_progress (user_id, status);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.saved_texts enable row level security;
alter table public.generated_texts enable row level security;
alter table public.usage_events enable row level security;
alter table public.dictation_sessions enable row level security;
alter table public.dictation_mistakes enable row level security;
alter table public.practice_progress enable row level security;
alter table public.certificates enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    target_language,
    cefr_level
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    'English',
    'B1'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can read own admin status" on public.admin_users;
create policy "users can read own admin status"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can upsert own profile" on public.profiles;
create policy "users can upsert own profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users manage own saved_texts" on public.saved_texts;
create policy "users manage own saved_texts"
on public.saved_texts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own generated_texts" on public.generated_texts;
create policy "users manage own generated_texts"
on public.generated_texts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "users manage own dictation_sessions" on public.dictation_sessions;
create policy "users manage own dictation_sessions"
on public.dictation_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own dictation_mistakes" on public.dictation_mistakes;
create policy "users manage own dictation_mistakes"
on public.dictation_mistakes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own practice_progress" on public.practice_progress;
create policy "users manage own practice_progress"
on public.practice_progress
for all
to authenticated
using (auth.uid() = user_id)
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
