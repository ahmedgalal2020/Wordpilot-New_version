alter table public.usage_events enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;

drop policy if exists "users manage own usage_events" on public.usage_events;
drop policy if exists "users can read own usage_events" on public.usage_events;
create policy "users can read own usage_events"
on public.usage_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own usage_events" on public.usage_events;
create policy "users can insert own usage_events"
on public.usage_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users manage own subscriptions" on public.user_subscriptions;
drop policy if exists "users can read own subscriptions" on public.user_subscriptions;
create policy "users can read own subscriptions"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users manage own invoices" on public.billing_invoices;
drop policy if exists "users can read own invoices" on public.billing_invoices;
create policy "users can read own invoices"
on public.billing_invoices
for select
to authenticated
using (auth.uid() = user_id);
