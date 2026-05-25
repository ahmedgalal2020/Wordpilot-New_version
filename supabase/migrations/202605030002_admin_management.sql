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

alter table public.profiles
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_reason text,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_by uuid references auth.users (id) on delete set null;

create index if not exists admin_users_email_idx on public.admin_users (lower(email));
create index if not exists admin_users_status_idx on public.admin_users (status);
create index if not exists profiles_is_blocked_idx on public.profiles (is_blocked);

alter table public.admin_users enable row level security;

drop policy if exists "users can read own admin status" on public.admin_users;
create policy "users can read own admin status"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);
