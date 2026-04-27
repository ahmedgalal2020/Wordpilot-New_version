create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  target_language text default 'English',
  cefr_level text default 'B1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  plan_name text not null default 'Scholar Pro',
  status text not null default 'active',
  billing_cycle text not null default 'monthly',
  amount_cents integer not null default 1200,
  renewal_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.user_subscriptions (id) on delete set null,
  label text not null,
  amount_cents integer not null default 1200,
  status text not null default 'paid',
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saved_texts enable row level security;
alter table public.generated_texts enable row level security;
alter table public.dictation_sessions enable row level security;
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

drop policy if exists "users manage own dictation_sessions" on public.dictation_sessions;
create policy "users manage own dictation_sessions"
on public.dictation_sessions
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
create policy "users manage own subscriptions"
on public.user_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own invoices" on public.billing_invoices;
create policy "users manage own invoices"
on public.billing_invoices
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
