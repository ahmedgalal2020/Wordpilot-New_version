-- Lifetime distinct-video allowance. No curriculum or learner-progress changes.
create schema if not exists wordpilot_private;

create unique index usage_events_shadowing_video_unique
on public.usage_events (user_id, (metadata->>'video_id'))
where feature_key = 'shadowing_video';

insert into public.usage_events(user_id,feature_key,event_type,quantity,period_start,period_end,metadata)
select user_id,'shadowing_video','unlocked',1,min(created_at),'infinity'::timestamptz,jsonb_build_object('video_id',video_id)
from public.shadowing_sessions
where video_id ~ '^[A-Za-z0-9_-]{11}$'
group by user_id,video_id
on conflict do nothing;

create or replace function wordpilot_private.shadowing_video_access(p_video_id text default null,p_consume boolean default false)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_ids text[];
  v_paid boolean;
  v_allowed boolean;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_video_id is not null and p_video_id !~ '^[A-Za-z0-9_-]{11}$' then
    raise exception 'Invalid video ID' using errcode='22023';
  end if;
  if exists(select 1 from public.profiles where id=v_user and is_blocked) then
    raise exception 'Account unavailable' using errcode='42501';
  end if;
  -- All unlock attempts for this account serialize, even for different videos.
  perform pg_advisory_xact_lock(hashtextextended('shadowing-video:' || v_user::text,0));
  v_paid := public.is_wordpilot_pro(v_user);
  select coalesce(array_agg(metadata->>'video_id' order by created_at),array[]::text[])
    into v_ids from public.usage_events where user_id=v_user and feature_key='shadowing_video';
  v_allowed := v_paid or p_video_id is null or p_video_id=any(v_ids) or cardinality(v_ids)<3;
  if p_consume and p_video_id is not null and v_allowed and not v_paid and not p_video_id=any(v_ids) then
    insert into public.usage_events(user_id,feature_key,event_type,quantity,period_start,period_end,metadata)
    values(v_user,'shadowing_video','unlocked',1,now(),'infinity'::timestamptz,jsonb_build_object('video_id',p_video_id));
    v_ids := array_append(v_ids,p_video_id);
  end if;
  return jsonb_build_object('allowed',v_allowed,'used',cardinality(v_ids),'limit',3,'isPro',v_paid,'videoIds',v_ids);
end;
$$;

revoke all on function wordpilot_private.shadowing_video_access(text,boolean) from public,anon;
grant usage on schema wordpilot_private to authenticated;
grant execute on function wordpilot_private.shadowing_video_access(text,boolean) to authenticated;

create or replace function public.shadowing_video_access(p_video_id text default null,p_consume boolean default false)
returns jsonb language sql security invoker set search_path = ''
as $$ select wordpilot_private.shadowing_video_access(p_video_id,p_consume); $$;
revoke all on function public.shadowing_video_access(text,boolean) from public,anon;
grant execute on function public.shadowing_video_access(text,boolean) to authenticated;

-- Existing direct session writes must obey the same allowance, not just React.
create or replace function wordpilot_private.enforce_shadowing_video_access()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_access jsonb;
begin
  if auth.uid() is not null then
    if new.user_id is distinct from auth.uid() then
      raise exception 'Not permitted' using errcode='42501';
    end if;
    v_access := wordpilot_private.shadowing_video_access(new.video_id,true);
    if not (v_access->>'allowed')::boolean then
      raise exception 'Shadowing video allowance reached' using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function wordpilot_private.enforce_shadowing_video_access() from public,anon,authenticated;
create trigger enforce_shadowing_video_access
before insert or update of video_id,user_id on public.shadowing_sessions
for each row execute function wordpilot_private.enforce_shadowing_video_access();
