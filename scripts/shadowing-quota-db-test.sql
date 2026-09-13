begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000091','quota-qa-one@example.invalid'),
 ('00000000-0000-4000-8000-000000000092','quota-qa-two@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000091","role":"authenticated"}',true);
do $test$
declare r jsonb; n integer;
begin
 r := public.shadowing_video_access(); if (r->>'used')::int<>0 then raise exception 'Expected zero'; end if;
 for n in 1..3 loop
  r := public.shadowing_video_access('QA_video00'||n::text,true);
  if not (r->>'allowed')::boolean or (r->>'used')::int<>n then raise exception 'Unlock % failed: %',n,r; end if;
 end loop;
 r := public.shadowing_video_access('QA_video004',true);
 if (r->>'allowed')::boolean or (r->>'used')::int<>3 then raise exception 'Fourth allowed'; end if;
 r := public.shadowing_video_access('QA_video001',true);
 if not (r->>'allowed')::boolean or (r->>'used')::int<>3 then raise exception 'Replay failed'; end if;
 begin
  delete from public.usage_events where user_id=auth.uid();
  raise exception 'Client deletion allowed';
 exception when insufficient_privilege then null;
 end;
end;
$test$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000092","role":"authenticated"}',true);
do $test$
begin
 if (public.shadowing_video_access()->>'used')::int<>0 then raise exception 'Shared quota'; end if;
 if exists(select 1 from public.usage_events where user_id='00000000-0000-4000-8000-000000000091') then raise exception 'RLS leaked rows'; end if;
end;
$test$;
reset role;
select 'Quota transaction tests passed; fixture data will be rolled back' as result;
rollback;
