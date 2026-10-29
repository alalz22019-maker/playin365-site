-- PlayIn365 — demonstrable communications and periodic reports for the approved demo academy
begin;
do $seed$
declare
  v_org uuid;
  v_actor uuid;
  v_broadcast uuid;
  v_schedule uuid;
begin
  select id into v_org from public.organizations where slug='demo-elite-academy' limit 1;
  if v_org is null then return; end if;
  select user_id into v_actor
  from public.organization_access_assignments
  where organization_id=v_org and status='active' and access_role_code in ('owner','admin')
  order by case access_role_code when 'owner' then 1 else 2 end limit 1;
  if v_actor is null then return; end if;

  select id into v_broadcast
  from public.organization_broadcasts
  where organization_id=v_org and metadata->>'seed_key'='communications_welcome_v1'
  limit 1;
  if v_broadcast is null then
    insert into public.organization_broadcasts(
      organization_id,created_by_user_id,actor_scope,message_type,title,body,audience,channels,status,metadata,is_demo
    ) values(
      v_org,v_actor,'organization','announcement',
      'مركز التواصل الجديد في أكاديمية النخبة',
      'أصبحت مواعيد التدريب والمباريات والتنبيهات والتقارير الأسبوعية تصل من خلال مسار واحد موثق. افتح تحديثات الجهة لمتابعة كل جديد.',
      '{"roles":["players","coaches","guardians"]}'::jsonb,
      array['in_app']::text[],'draft',
      '{"seed_key":"communications_welcome_v1","source":"demo_seed"}'::jsonb,true
    ) returning id into v_broadcast;
    perform private.dispatch_organization_broadcast(v_broadcast);
  end if;

  select id into v_schedule
  from public.organization_report_schedules
  where organization_id=v_org and metadata->>'seed_key'='weekly_achievement_v1'
  limit 1;
  if v_schedule is null then
    insert into public.organization_report_schedules(
      organization_id,created_by_user_id,actor_scope,name,report_type,audience,channels,frequency,day_of_week,send_time,timezone,status,next_run_at,metadata,is_demo
    ) values(
      v_org,v_actor,'organization','الإنجاز الأسبوعي لأكاديمية النخبة','weekly_achievement',
      '{"roles":["players","coaches","guardians"]}'::jsonb,array['in_app']::text[],
      'weekly',4,'18:00','Asia/Riyadh','active',
      private.communication_next_run('weekly',4,null,'18:00','Asia/Riyadh',now()),
      '{"seed_key":"weekly_achievement_v1","source":"demo_seed"}'::jsonb,true
    ) returning id into v_schedule;
    perform private.generate_organization_report_run(v_schedule,now());
  end if;
end
$seed$;
commit;
