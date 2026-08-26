create table if not exists public.youtube_transcript_cache (
  video_id text primary key check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  language text not null default 'unknown',
  language_name text not null default 'Captions',
  is_auto_generated boolean not null default false,
  transcript_text text not null check (length(trim(transcript_text)) > 0),
  cues jsonb not null default '[]'::jsonb check (jsonb_typeof(cues) = 'array'),
  source text not null default 'youtube',
  fetch_count integer not null default 1 check (fetch_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now()
);

create index if not exists youtube_transcript_cache_updated_at_idx
on public.youtube_transcript_cache (updated_at desc);

create index if not exists youtube_transcript_cache_language_idx
on public.youtube_transcript_cache (language, updated_at desc);

alter table public.youtube_transcript_cache enable row level security;

comment on table public.youtube_transcript_cache is 'Server-managed cache for public YouTube transcripts used by WordPilot Shadowing Practice.';
comment on column public.youtube_transcript_cache.cues is 'Transcript cue array with text, start, and duration fields.';
