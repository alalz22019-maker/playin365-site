-- PlayIn365 — coach-scoped periodic report demo
begin;
do $seed$
declare
  v_org uuid:='22b027e1-c13e-4bd9-9e8e-e7b42200dc8f';
  v_coach uuid:='70080a99-1a96-43d1-8a53-75a9efe10ae4';
  v_team uuid:='39e4cb3e-4c42-4695-8b01-feda25206121';
  v_schedule uuid;
begin
  if private.communication_actor_scope(v_org,v_coach)<>'coach' then return; end if;
  select id into v_schedule from public.organization_report_schedules
  where organization_id=v_org and created_by_user_id=v_coach and metadata->>'seed_key'='coach_weekly_team_summary_v1'
  limit 1;
  if v_schedule is null then
    insert into public.organization_report_schedules(
      organization_id,created_by_user_id,actor_scope,name,report_type,audience,channels,frequency,day_of_week,send_time,timezone,status,next_run_at,metadata,is_demo
    ) values(
      v_org,v_coach,'coach','ملخص فريق U18 الأسبوعي','weekly_team_summary',
      jsonb_build_object('roles',jsonb_build_array('players','guardians'),'team_ids',jsonb_build_array(v_team::text)),
      array['in_app']::text[],'weekly',4,'19:00','Asia/Riyadh','active',
      private.communication_next_run('weekly',4,null,'19:00','Asia/Riyadh',now()),
      '{"seed_key":"coach_weekly_team_summary_v1","source":"demo_seed"}'::jsonb,true
    ) returning id into v_schedule;
    perform private.generate_organization_report_run(v_schedule,now());
  end if;
end
$seed$;
commit;
