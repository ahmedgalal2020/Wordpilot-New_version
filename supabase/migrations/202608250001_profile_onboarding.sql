alter table public.profiles
  add column if not exists native_language text default 'English',
  add column if not exists goal_cefr_level text default 'B2',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

create index if not exists profiles_onboarding_completed_idx
on public.profiles (onboarding_completed);

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
    native_language,
    target_language,
    cefr_level,
    goal_cefr_level,
    onboarding_completed
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(nullif(new.raw_user_meta_data->>'native_language', ''), 'English'),
    coalesce(nullif(new.raw_user_meta_data->>'target_language', ''), 'English'),
    coalesce(nullif(new.raw_user_meta_data->>'cefr_level', ''), 'B1'),
    coalesce(nullif(new.raw_user_meta_data->>'goal_cefr_level', ''), 'B2'),
    false
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
