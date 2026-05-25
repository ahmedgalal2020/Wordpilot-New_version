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

create index if not exists dictation_mistakes_user_created_idx
on public.dictation_mistakes (user_id, created_at desc);

create index if not exists dictation_mistakes_user_correct_word_idx
on public.dictation_mistakes (user_id, lower(correct_word));

create index if not exists dictation_mistakes_session_idx
on public.dictation_mistakes (session_id);

alter table public.dictation_mistakes enable row level security;

drop policy if exists "users manage own dictation_mistakes" on public.dictation_mistakes;
create policy "users manage own dictation_mistakes"
on public.dictation_mistakes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
