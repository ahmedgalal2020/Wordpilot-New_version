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

create index if not exists practice_progress_user_path_idx
on public.practice_progress (user_id, language, cefr_level);

create index if not exists practice_progress_user_status_idx
on public.practice_progress (user_id, status);

alter table public.practice_progress enable row level security;

drop policy if exists "users manage own practice_progress" on public.practice_progress;
create policy "users manage own practice_progress"
on public.practice_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
