create or replace function public.prevent_profile_admin_field_client_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  request_role text := coalesce(current_setting('request.jwt.claim.role', true), current_user);
begin
  if request_role in ('anon', 'authenticated') then
    if new.is_blocked is distinct from old.is_blocked
      or new.blocked_reason is distinct from old.blocked_reason
      or new.blocked_at is distinct from old.blocked_at
      or new.blocked_by is distinct from old.blocked_by then
      raise exception 'Profile admin fields can only be changed by server-side admin actions.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields on public.profiles;
create trigger protect_profile_admin_fields
before update on public.profiles
for each row
execute function public.prevent_profile_admin_field_client_update();

revoke execute on function public.prevent_profile_admin_field_client_update() from public;
revoke execute on function public.prevent_profile_admin_field_client_update() from anon;
revoke execute on function public.prevent_profile_admin_field_client_update() from authenticated;
