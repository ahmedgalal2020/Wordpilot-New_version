-- Tighten client-role grants so RLS policies are the second line of defense,
-- not the only one. Server-only tables keep no anon/authenticated grants.

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.billing_invoices from anon, authenticated;
revoke all on table public.certificates from anon, authenticated;
revoke all on table public.curriculum_exercise_attempts from anon, authenticated;
revoke all on table public.curriculum_lesson_progress from anon, authenticated;
revoke all on table public.curriculum_placement_results from anon, authenticated;
revoke all on table public.curriculum_review_queue from anon, authenticated;
revoke all on table public.dictation_mistakes from anon, authenticated;
revoke all on table public.dictation_sessions from anon, authenticated;
revoke all on table public.generated_texts from anon, authenticated;
revoke all on table public.practice_progress from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.saved_texts from anon, authenticated;
revoke all on table public.shadowing_attempts from anon, authenticated;
revoke all on table public.shadowing_sessions from anon, authenticated;
revoke all on table public.usage_events from anon, authenticated;
revoke all on table public.user_subscriptions from anon, authenticated;
revoke all on table public.youtube_transcript_cache from anon, authenticated;

grant select on table public.admin_users to authenticated;
grant select on table public.billing_invoices to authenticated;
grant select on table public.user_subscriptions to authenticated;
grant select on table public.usage_events to authenticated;

grant select, insert, update on table public.profiles to authenticated;

grant select, insert, update, delete on table public.certificates to authenticated;
grant select, insert, update, delete on table public.curriculum_exercise_attempts to authenticated;
grant select, insert, update, delete on table public.curriculum_lesson_progress to authenticated;
grant select, insert, update, delete on table public.curriculum_placement_results to authenticated;
grant select, insert, update, delete on table public.curriculum_review_queue to authenticated;
grant select, insert, update, delete on table public.dictation_mistakes to authenticated;
grant select, insert, update, delete on table public.dictation_sessions to authenticated;
grant select, insert, update, delete on table public.generated_texts to authenticated;
grant select, insert, update, delete on table public.practice_progress to authenticated;
grant select, insert, update, delete on table public.saved_texts to authenticated;
grant select, insert, update, delete on table public.shadowing_attempts to authenticated;
grant select, insert, update, delete on table public.shadowing_sessions to authenticated;
