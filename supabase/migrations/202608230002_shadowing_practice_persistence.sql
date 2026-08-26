create table if not exists public.shadowing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  video_url text not null,
  title text not null default 'Shadowing lesson',
  language text not null default 'English',
  cefr_level text not null default 'A1',
  transcript_source text,
  transcript_text text,
  segments jsonb not null default '[]'::jsonb check (jsonb_typeof(segments) = 'array'),
  current_segment_index integer not null default 0 check (current_segment_index >= 0),
  total_segments integer not null default 0 check (total_segments >= 0),
  completed_segments integer not null default 0 check (completed_segments >= 0),
  average_score integer not null default 0 check (average_score between 0 and 100),
  best_score integer not null default 0 check (best_score between 0 and 100),
  difficult_sentences text[] not null default '{}',
  missed_words text[] not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create table if not exists public.shadowing_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.shadowing_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  segment_id text not null,
  segment_index integer not null check (segment_index >= 0),
  target_text text not null,
  transcript text not null,
  score integer not null check (score between 0 and 100),
  passed boolean not null default false,
  missing_words text[] not null default '{}',
  incorrect_words text[] not null default '{}',
  engine text not null default 'browser',
  model text,
  audio_path text,
  audio_mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists shadowing_sessions_user_updated_idx
on public.shadowing_sessions (user_id, updated_at desc);

create index if not exists shadowing_sessions_user_status_idx
on public.shadowing_sessions (user_id, status, updated_at desc);

create index if not exists shadowing_attempts_session_segment_idx
on public.shadowing_attempts (session_id, segment_index, created_at desc);

create index if not exists shadowing_attempts_user_created_idx
on public.shadowing_attempts (user_id, created_at desc);

alter table public.shadowing_sessions enable row level security;
alter table public.shadowing_attempts enable row level security;

revoke all on table public.shadowing_sessions from anon;
revoke all on table public.shadowing_attempts from anon;
grant select, insert, update, delete on table public.shadowing_sessions to authenticated;
grant select, insert, update, delete on table public.shadowing_attempts to authenticated;

drop policy if exists "users manage own shadowing_sessions" on public.shadowing_sessions;
create policy "users manage own shadowing_sessions"
on public.shadowing_sessions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "users manage own shadowing_attempts" on public.shadowing_attempts;
create policy "users manage own shadowing_attempts"
on public.shadowing_attempts
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.shadowing_sessions
    where shadowing_sessions.id = shadowing_attempts.session_id
      and shadowing_sessions.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shadowing-recordings',
  'shadowing-recordings',
  false,
  10485760,
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users read own shadowing recordings" on storage.objects;
create policy "users read own shadowing recordings"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'shadowing-recordings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users upload own shadowing recordings" on storage.objects;
create policy "users upload own shadowing recordings"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shadowing-recordings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users update own shadowing recordings" on storage.objects;
create policy "users update own shadowing recordings"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shadowing-recordings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'shadowing-recordings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users delete own shadowing recordings" on storage.objects;
create policy "users delete own shadowing recordings"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shadowing-recordings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

comment on table public.shadowing_sessions is 'Per-user Shadowing Practice lessons, progress, transcript, and segment state.';
comment on table public.shadowing_attempts is 'Per-user Shadowing Practice speaking attempts with score, feedback, and optional recording path.';
