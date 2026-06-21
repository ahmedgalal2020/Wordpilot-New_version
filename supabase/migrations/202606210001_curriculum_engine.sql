create table if not exists public.curriculum_placement_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  recommended_level_number integer not null check (recommended_level_number between 1 and 12),
  cefr_level text not null,
  cefr_sub_level text not null,
  score integer not null check (score between 0 and 100),
  skill_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  level_number integer not null check (level_number between 1 and 12),
  lesson_id text not null,
  status text not null default 'available',
  overall_score integer check (overall_score between 0 and 100),
  skill_scores jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  passed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_lesson_progress_status_check check (status in ('locked', 'available', 'in_progress', 'passed', 'needs_review')),
  constraint curriculum_lesson_progress_user_lesson_key unique (user_id, language, lesson_id)
);

create table if not exists public.curriculum_exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  level_number integer not null check (level_number between 1 and 12),
  lesson_id text not null,
  exercise_id text not null,
  exercise_type text not null,
  skill text not null,
  score integer not null check (score between 0 and 100),
  rubric_scores jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum_review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  level_number integer not null check (level_number between 1 and 12),
  lesson_id text,
  source_exercise_id text,
  item_type text not null,
  item_key text not null,
  reason text not null,
  due_at timestamptz not null default now(),
  interval_days integer not null default 1 check (interval_days >= 1),
  ease numeric(4,2) not null default 2.50 check (ease >= 1.30),
  status text not null default 'due',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_review_queue_item_type_check check (item_type in ('vocabulary', 'grammar', 'listening', 'pronunciation', 'speaking', 'writing', 'dictation', 'sentence_building', 'conversation', 'test')),
  constraint curriculum_review_queue_status_check check (status in ('due', 'snoozed', 'mastered')),
  constraint curriculum_review_queue_user_item_key unique (user_id, language, item_type, item_key)
);

create index if not exists curriculum_placement_results_user_language_idx
on public.curriculum_placement_results (user_id, language, created_at desc);

create index if not exists curriculum_lesson_progress_user_path_idx
on public.curriculum_lesson_progress (user_id, language, level_number, status);

create index if not exists curriculum_exercise_attempts_user_lesson_idx
on public.curriculum_exercise_attempts (user_id, language, lesson_id, created_at desc);

create index if not exists curriculum_review_queue_due_idx
on public.curriculum_review_queue (user_id, language, status, due_at);

alter table public.curriculum_placement_results enable row level security;
alter table public.curriculum_lesson_progress enable row level security;
alter table public.curriculum_exercise_attempts enable row level security;
alter table public.curriculum_review_queue enable row level security;

drop policy if exists "users manage own curriculum_placement_results" on public.curriculum_placement_results;
create policy "users manage own curriculum_placement_results"
on public.curriculum_placement_results
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own curriculum_lesson_progress" on public.curriculum_lesson_progress;
create policy "users manage own curriculum_lesson_progress"
on public.curriculum_lesson_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own curriculum_exercise_attempts" on public.curriculum_exercise_attempts;
create policy "users manage own curriculum_exercise_attempts"
on public.curriculum_exercise_attempts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own curriculum_review_queue" on public.curriculum_review_queue;
create policy "users manage own curriculum_review_queue"
on public.curriculum_review_queue
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
