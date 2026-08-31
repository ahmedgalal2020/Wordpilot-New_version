create index if not exists curriculum_content_exercises_lesson_id_idx
on public.curriculum_content_exercises (lesson_id);

drop policy if exists "service role can manage youtube transcript cache" on public.youtube_transcript_cache;
create policy "service role can manage youtube transcript cache"
on public.youtube_transcript_cache
for all
to service_role
using (true)
with check (true);
