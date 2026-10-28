-- Complete the demo responsibility matrix and credit the academy leader on the shared achievement.
do $$
declare
  v_org uuid:='22b027e1-c13e-4bd9-9e8e-e7b42200dc8f'::uuid;
  v_academy_user uuid;
  v_admin_entity uuid;
  v_org_entity uuid;
  v_event_entity uuid;
  v_achievement uuid:='00000000-0000-4000-8000-00000000a301'::uuid;
begin
  select id into v_academy_user from auth.users where lower(email)='academy@demo.playin365.app' limit 1;
  select id into v_admin_entity from public.entities where profile_id=v_academy_user limit 1;
  select id into v_org_entity from public.entities where organization_id=v_org limit 1;
  select id into v_event_entity from public.entities where sports_event_id='00000000-0000-4000-8000-00000000f301'::uuid limit 1;

  if v_academy_user is null or v_admin_entity is null or v_org_entity is null then
    raise notice 'three_pillars demo completion skipped: demo prerequisites are not present in this environment';
    return;
  end if;

  insert into public.work_items(
    id,organization_id,context_entity_id,event_entity_id,work_type_code,title,description,status,priority,
    requested_by_user_id,assigned_to_user_id,assigned_responsibility_code,decision_required,due_at,action_route,payload
  ) values(
    '00000000-0000-4000-8000-00000000b313'::uuid,v_org,v_org_entity,v_event_entity,'general_task',
    'مراجعة نبض التشغيل اليومي','تأكد من الحصص والحجوزات والحضور والطلبات التي تحتاج تدخل مدير الأكاديمية.',
    'pending','high',v_academy_user,null,'academy_admin',false,'2026-10-30 09:00:00+03','opsHome',
    jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'version','v1')
  ) on conflict(id) do nothing;

  insert into public.achievement_credits(achievement_id,entity_id,credit_role,visibility,display_order,metadata,verified_at)
  select v_achievement,v_admin_entity,'contributor','public',15,
         jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'responsibility','owner'),now()
  where v_admin_entity is not null
  on conflict(achievement_id,entity_id,credit_role) do update set visibility='public',metadata=excluded.metadata,verified_at=now();

  insert into public.entity_activity_events(
    event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,
    title,summary,visibility,verification_status,occurred_at,payload
  )
  select 'achievement_verified',v_org_entity,v_admin_entity,v_org_entity,v_event_entity,'achievement',v_achievement,
         'إنجاز مشترك جديد','اعتمد قائد الجهة رحلة التدريب المترابطة وأصبح الإنجاز جزءًا من مسيرته المهنية.',
         'public','verified','2026-10-28 18:00:00+03',jsonb_build_object('credit_role','contributor','demo_workspace',true)
  where v_admin_entity is not null and not exists(
    select 1 from public.entity_activity_events ae
    where ae.source_type='achievement' and ae.source_id=v_achievement and ae.event_type='achievement_verified' and ae.subject_entity_id=v_admin_entity
  );
end $$;
