-- Usage events are server-owned accounting records.
-- Users may read their own usage, but only trusted server code writes usage events.

alter table public.usage_events enable row level security;

drop policy if exists "users can insert own usage_events" on public.usage_events;
drop policy if exists "users manage own usage_events" on public.usage_events;

drop policy if exists "users can read own usage_events" on public.usage_events;
create policy "users can read own usage_events"
on public.usage_events
for select
to authenticated
using ((select auth.uid()) = user_id);
