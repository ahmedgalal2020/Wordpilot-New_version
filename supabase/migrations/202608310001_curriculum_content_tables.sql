create table if not exists public.curriculum_content_versions (
  id text primary key,
  description text not null,
  checksum text not null,
  lesson_count integer not null check (lesson_count >= 0),
  exercise_count integer not null check (exercise_count >= 0),
  quality_report jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum_content_lessons (
  id text primary key,
  content_version text not null references public.curriculum_content_versions (id) on delete cascade,
  language text not null,
  level_number integer not null check (level_number between 1 and 12),
  cefr_level text not null,
  cefr_sub_level text not null,
  lesson_number integer not null check (lesson_number between 1 and 12),
  title text not null,
  theme text not null,
  objective text not null,
  can_do text not null,
  grammar_focus text not null,
  grammar_focus_id text not null,
  target_sentence text not null,
  reading_text text not null,
  listening_script text not null,
  new_vocabulary jsonb not null default '[]'::jsonb,
  review_vocabulary jsonb not null default '[]'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  chunks jsonb not null default '[]'::jsonb,
  example_sentences jsonb not null default '[]'::jsonb,
  reading_questions jsonb not null default '[]'::jsonb,
  listening_questions jsonb not null default '[]'::jsonb,
  grammar_items jsonb not null default '[]'::jsonb,
  writing_task jsonb not null default '{}'::jsonb,
  speaking_task jsonb not null default '{}'::jsonb,
  roleplay jsonb not null default '{}'::jsonb,
  mastery jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint curriculum_content_lessons_language_level_lesson_key unique (content_version, language, level_number, lesson_number)
);

create table if not exists public.curriculum_content_exercises (
  id text primary key,
  content_version text not null references public.curriculum_content_versions (id) on delete cascade,
  lesson_id text not null references public.curriculum_content_lessons (id) on delete cascade,
  language text not null,
  level_number integer not null check (level_number between 1 and 12),
  skill text not null,
  exercise_type text not null,
  title text not null,
  instruction text not null,
  content jsonb not null default '{}'::jsonb,
  grammar_focus_id text,
  correct_answer jsonb,
  acceptable_answers jsonb,
  scoring_rubric jsonb not null default '{}'::jsonb,
  min_score_to_pass integer not null check (min_score_to_pass between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculum_content_level_exams (
  id text primary key,
  content_version text not null references public.curriculum_content_versions (id) on delete cascade,
  language text not null,
  level_number integer not null check (level_number between 1 and 12),
  cefr_level text not null,
  cefr_sub_level text not null,
  title text not null,
  instruction text not null,
  content jsonb not null default '{}'::jsonb,
  correct_answer jsonb,
  acceptable_answers jsonb,
  scoring_rubric jsonb not null default '{}'::jsonb,
  min_score_to_pass integer not null check (min_score_to_pass between 0 and 100),
  updated_at timestamptz not null default now(),
  constraint curriculum_content_level_exams_version_language_level_key unique (content_version, language, level_number)
);

create index if not exists curriculum_content_versions_active_idx
on public.curriculum_content_versions (is_active, created_at desc);

create index if not exists curriculum_content_lessons_path_idx
on public.curriculum_content_lessons (content_version, language, level_number, lesson_number);

create index if not exists curriculum_content_exercises_lesson_idx
on public.curriculum_content_exercises (content_version, lesson_id);

create index if not exists curriculum_content_level_exams_path_idx
on public.curriculum_content_level_exams (content_version, language, level_number);

alter table public.curriculum_content_versions enable row level security;
alter table public.curriculum_content_lessons enable row level security;
alter table public.curriculum_content_exercises enable row level security;
alter table public.curriculum_content_level_exams enable row level security;

drop policy if exists "public can read curriculum_content_versions" on public.curriculum_content_versions;
create policy "public can read curriculum_content_versions"
on public.curriculum_content_versions
for select
to anon, authenticated
using (true);

drop policy if exists "public can read curriculum_content_lessons" on public.curriculum_content_lessons;
create policy "public can read curriculum_content_lessons"
on public.curriculum_content_lessons
for select
to anon, authenticated
using (true);

drop policy if exists "public can read curriculum_content_exercises" on public.curriculum_content_exercises;
create policy "public can read curriculum_content_exercises"
on public.curriculum_content_exercises
for select
to anon, authenticated
using (true);

drop policy if exists "public can read curriculum_content_level_exams" on public.curriculum_content_level_exams;
create policy "public can read curriculum_content_level_exams"
on public.curriculum_content_level_exams
for select
to anon, authenticated
using (true);

revoke all on table public.curriculum_content_versions from anon, authenticated;
revoke all on table public.curriculum_content_lessons from anon, authenticated;
revoke all on table public.curriculum_content_exercises from anon, authenticated;
revoke all on table public.curriculum_content_level_exams from anon, authenticated;

grant select on table public.curriculum_content_versions to anon, authenticated;
grant select on table public.curriculum_content_lessons to anon, authenticated;
grant select on table public.curriculum_content_exercises to anon, authenticated;
grant select on table public.curriculum_content_level_exams to anon, authenticated;
