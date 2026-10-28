-- PlayIn365 Three Pillars foundation
-- Individuals × Organizations × Events
-- Additive, idempotent seed for the existing demo workspace only.
do $$
declare
  v_org uuid := '22b027e1-c13e-4bd9-9e8e-e7b42200dc8f'::uuid;
  v_academy_user uuid;
  v_coach_user uuid;
  v_player_user uuid;
  v_org_entity uuid;
  v_admin_entity uuid;
  v_coach_entity uuid;
  v_player_entity uuid;
  v_event uuid := '00000000-0000-4000-8000-00000000f301'::uuid;
  v_event_entity uuid;
  v_achievement uuid := '00000000-0000-4000-8000-00000000a301'::uuid;
begin
  select id into v_academy_user from auth.users where lower(email)='academy@demo.playin365.app' limit 1;
  select id into v_coach_user from auth.users where lower(email)='coach@demo.playin365.app' limit 1;
  select id into v_player_user from auth.users where lower(email)='player@demo.playin365.app' limit 1;
  select id into v_org_entity from public.entities where organization_id=v_org limit 1;
  select id into v_admin_entity from public.entities where profile_id=v_academy_user limit 1;
  select id into v_coach_entity from public.entities where profile_id=v_coach_user limit 1;
  select id into v_player_entity from public.entities where profile_id=v_player_user limit 1;

  if v_academy_user is null or v_coach_user is null or v_player_user is null or v_org_entity is null then
    raise notice 'three_pillars demo seed skipped: demo prerequisites are not present in this environment';
    return;
  end if;

  insert into public.organization_responsibility_assignments(
    organization_id,user_id,responsibility_code,status,scope,starts_at,granted_by_user_id
  )
  select v_org,v_academy_user,x.code,'active',
         jsonb_build_object('source','three_pillars_foundation','workspace','demo','version','v1'),
         now(),v_academy_user
  from unnest(array['executive','academy_admin','finance','hr','operations','registration','marketing','cashier','gate','content']) x(code)
  where not exists(
    select 1 from public.organization_responsibility_assignments r
    where r.organization_id=v_org and r.user_id=v_academy_user and r.responsibility_code=x.code and r.status='active'
  );

  insert into public.organization_responsibility_assignments(
    organization_id,user_id,responsibility_code,status,scope,starts_at,granted_by_user_id
  )
  select v_org,v_coach_user,'coach','active',jsonb_build_object('source','three_pillars_foundation','workspace','demo','version','v1'),now(),v_academy_user
  where not exists(
    select 1 from public.organization_responsibility_assignments r
    where r.organization_id=v_org and r.user_id=v_coach_user and r.responsibility_code='coach' and r.status='active'
  );

  update public.profiles
  set profile_visibility='public',updated_at=now()
  where id in (v_academy_user,v_coach_user,v_player_user);

  update public.organizations
  set public_profile=true,updated_at=now()
  where id=v_org;

  update public.entities
  set visibility='public',status='active',metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('three_pillars_version','v1','demo_workspace',true),updated_at=now()
  where id in (v_org_entity,v_admin_entity,v_coach_entity,v_player_entity);

  update public.identity_pages ip set
    headline_ar=case e.profile_id
      when v_player_user then 'مهاجم شاب يبني مسيرته من كل حصة ومباراة موثقة'
      when v_coach_user then 'مدرب يربط القرار الفني بتطور اللاعب وأثر الفريق'
      when v_academy_user then 'قائد تشغيل رياضي يحول البيانات إلى قرارات ونمو'
      else ip.headline_ar end,
    bio_ar=case e.profile_id
      when v_player_user then 'هوية رياضية مستمرة تجمع المشاركات والأداء والإنجازات والفرص في سجل واحد.'
      when v_coach_user then 'مسيرة مهنية موثقة تشمل الفرق والحصص والتقييمات والنتائج وتطور اللاعبين.'
      when v_academy_user then 'هوية مهنية مستقلة عن المنصب الحالي، توثق الجهات والمسؤوليات والإنجازات المعتمدة.'
      else ip.bio_ar end,
    visibility='public',verification_status='verified',
    sections=coalesce(ip.sections,'{}'::jsonb)||jsonb_build_object('three_pillars',true,'show_roles',true,'show_achievements',true,'show_timeline',true),
    theme=coalesce(ip.theme,'{}'::jsonb)||jsonb_build_object('system','playin_live_canvas','version','v1'),
    managed_by_user_id=e.profile_id,updated_at=now()
  from public.entities e
  where ip.entity_id=e.id and e.profile_id in (v_player_user,v_coach_user,v_academy_user);

  update public.identity_pages ip set
    headline_ar='أكاديمية مترابطة تجمع الأشخاص والعمل والأحداث في سجل موثوق واحد',
    bio_ar='هوية مستقلة للجهة تعكس الفرق والمدربين واللاعبين والبرامج والإنجازات والفرص مباشرة من التشغيل.',
    visibility='public',verification_status='verified',
    sections=coalesce(ip.sections,'{}'::jsonb)||jsonb_build_object('three_pillars',true,'show_teams',true,'show_events',true,'show_achievements',true,'show_opportunities',true),
    theme=coalesce(ip.theme,'{}'::jsonb)||jsonb_build_object('system','playin_live_canvas','version','v1'),
    managed_by_user_id=v_academy_user,updated_at=now()
  where ip.entity_id=v_org_entity;

  insert into public.sports_events(
    id,event_type,title,description,sport_code,age_category,organizer_organization_id,
    starts_at,ends_at,visibility,status,registration_required,guardian_gate_required,metadata,created_by,is_demo
  ) values(
    v_event,'open_training','يوم التدريب المترابط U16 — نموذج الركائز',
    'رحلة تشغيلية واحدة تربط الأكاديمية والمدرب واللاعب: الخطة، الجاهزية، الحضور، التقييم وإغلاق الحصة.',
    'football','U16',v_org,'2026-11-01 17:30:00+03','2026-11-01 19:00:00+03',
    'public','scheduled',true,true,
    jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'journey','training_day','version','v1'),
    v_academy_user,true
  ) on conflict(id) do update set
    title=excluded.title,description=excluded.description,starts_at=excluded.starts_at,ends_at=excluded.ends_at,
    organizer_organization_id=excluded.organizer_organization_id,visibility='public',status='scheduled',metadata=excluded.metadata,updated_at=now();

  select id into v_event_entity from public.entities where sports_event_id=v_event limit 1;
  if v_event_entity is null then raise exception 'three_pillars_event_entity_not_created'; end if;

  update public.entities set visibility='public',metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('three_pillars_version','v1'),updated_at=now()
  where id=v_event_entity;

  insert into public.identity_pages(
    entity_id,public_slug,geometry_orientation,headline_ar,bio_ar,visibility,verification_status,sections,theme,managed_by_user_id
  )
  select v_event_entity,'event-three-pillars-training','TR',
         'الحصة كحدث واحد يربط قرارات الجهة وتنفيذ المدرب وتجربة اللاعب',
         'صفحة حدث مستقلة تجمع الموعد والجهة والطاقم والمشاركين والنتائج والأدلة.',
         'public','verified',
         jsonb_build_object('three_pillars',true,'show_participants',true,'show_timeline',true,'show_outcomes',true),
         jsonb_build_object('system','playin_live_canvas','version','v1'),v_academy_user
  where not exists(select 1 from public.identity_pages where entity_id=v_event_entity);

  update public.identity_pages set visibility='public',verification_status='verified',updated_at=now()
  where entity_id=v_event_entity;

  insert into public.entity_event_links(event_entity_id,entity_id,participation_role,status,verification_status,source_type,source_id,metadata)
  select v_event_entity,x.entity_id,x.role,'active','verified','three_pillars_foundation',v_event::text,
         jsonb_build_object('demo_workspace',true,'version','v1')
  from (values
    (v_org_entity,'organizer'),
    (v_coach_entity,'coach'),
    (v_player_entity,'player')
  ) x(entity_id,role)
  where x.entity_id is not null
  on conflict(event_entity_id,entity_id,participation_role) do update set
    status='active',verification_status='verified',metadata=excluded.metadata,updated_at=now();

  insert into public.achievements(
    id,source_event_entity_id,source_organization_id,achievement_type,title,description,achieved_at,
    verification_status,visibility,evidence,metadata,created_by_user_id,approved_by_user_id,approved_at
  ) values(
    v_achievement,v_event_entity,v_org,'milestone','إطلاق رحلة التدريب المترابطة — نموذج تجريبي',
    'إنجاز توضيحي لسجل واحد ينعكس على هوية الأكاديمية والمدرب واللاعب دون تكرار البيانات.',
    '2026-10-28 18:00:00+03','verified','public',
    jsonb_build_object('event_entity_id',v_event_entity,'journey','training_day','evidence_type','system_demo'),
    jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'version','v1'),
    v_academy_user,v_academy_user,now()
  ) on conflict(id) do update set
    source_event_entity_id=excluded.source_event_entity_id,source_organization_id=excluded.source_organization_id,
    title=excluded.title,description=excluded.description,verification_status='verified',visibility='public',
    evidence=excluded.evidence,metadata=excluded.metadata,approved_by_user_id=v_academy_user,approved_at=now(),updated_at=now();

  insert into public.achievement_credits(achievement_id,entity_id,credit_role,visibility,display_order,metadata,verified_at)
  select v_achievement,x.entity_id,x.role,'public',x.ord,jsonb_build_object('source','three_pillars_foundation','demo_workspace',true),now()
  from (values
    (v_org_entity,'organization',10),
    (v_coach_entity,'coach',20),
    (v_player_entity,'participant',30)
  ) x(entity_id,role,ord)
  where x.entity_id is not null
  on conflict(achievement_id,entity_id,credit_role) do update set visibility='public',metadata=excluded.metadata,verified_at=now();

  insert into public.entity_activity_events(
    event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,
    title,summary,visibility,verification_status,occurred_at,payload
  )
  select 'achievement_verified',v_org_entity,x.entity_id,v_org_entity,v_event_entity,'achievement',v_achievement,
         'إنجاز مشترك جديد','تم اعتماد إنجاز واحد وانعكس تلقائيًا على الأطراف المرتبطة.','public','verified',
         '2026-10-28 18:00:00+03',jsonb_build_object('credit_role',x.role,'demo_workspace',true)
  from (values
    (v_org_entity,'organization'),
    (v_coach_entity,'coach'),
    (v_player_entity,'participant')
  ) x(entity_id,role)
  where x.entity_id is not null and not exists(
    select 1 from public.entity_activity_events ae
    where ae.source_type='achievement' and ae.source_id=v_achievement and ae.event_type='achievement_verified' and ae.subject_entity_id=x.entity_id
  );

  insert into public.work_items(
    id,organization_id,context_entity_id,event_entity_id,work_type_code,title,description,status,priority,
    requested_by_user_id,assigned_to_user_id,assigned_responsibility_code,decision_required,due_at,action_route,payload
  ) values
  ('00000000-0000-4000-8000-00000000b301',v_org,v_org_entity,null,'general_task','اعتماد نموذج المسؤوليات داخل الأكاديمية','مراجعة توزيع المسؤوليات وصفحاتها الرئيسية قبل التوسع لبقية الموظفين.','pending','critical',v_academy_user,null,'owner',true,'2026-10-30 12:00:00+03','opsStaff',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b302',v_org,v_org_entity,null,'general_task','اعتماد لوحة القيادة التنفيذية','تحديد المؤشرات والحدود التي تظهر للرئيس التنفيذي دون الدخول للتفاصيل.','pending','high',v_academy_user,null,'executive',true,'2026-10-31 12:00:00+03','opsReports',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b303',v_org,v_org_entity,null,'payment_reconciliation','مطابقة الفواتير القديمة مع السجل المالي الموحد','مراجعة الفواتير والاشتراكات قبل تحويلها إلى مسار الدفع الجديد.','pending','high',v_academy_user,null,'finance',false,'2026-11-01 12:00:00+03','opsFinance',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b304',v_org,v_org_entity,null,'document_expiry','استكمال ملفات الموظفين والمسؤوليات','مراجعة العقود والشهادات وتحديد مسؤول كل ملف.','pending','normal',v_academy_user,null,'hr',false,'2026-11-02 12:00:00+03','opsDocuments',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b305',v_org,v_org_entity,v_event_entity,'session_change','تجهيز يوم التدريب المترابط U16','تأكيد الفريق والمدرب والموعد والحضور قبل نشر الحصة المشتركة.','pending','critical',v_academy_user,null,'operations',true,'2026-10-31 15:00:00+03','opsAttendance',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'event_id',v_event)),
  ('00000000-0000-4000-8000-00000000b306',v_org,v_org_entity,null,'player_registration','مراجعة طلبات التسجيل والتجارب','فرز الطلبات الجديدة وتوجيه المقبولين للمسؤول الفني.','pending','normal',v_academy_user,null,'registration',false,'2026-11-01 10:00:00+03','acadTryouts',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b307',v_org,v_org_entity,null,'campaign_approval','اعتماد حملة التسجيل للموسم الجديد','مراجعة الرسالة والجمهور والميزانية قبل النشر.','pending','high',v_academy_user,null,'marketing',true,'2026-10-31 14:00:00+03','opsMarketing',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b308',v_org,v_org_entity,null,'payment_reconciliation','اختبار إغلاق صندوق نقطة البيع','تنفيذ دورة طلب وفاتورة وتحصيل وإغلاق تجريبية.','pending','normal',v_academy_user,null,'cashier',false,'2026-10-30 20:00:00+03','opsCashier',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true)),
  ('00000000-0000-4000-8000-00000000b309',v_org,v_org_entity,v_event_entity,'attendance_exception','مراجعة حالات الحضور الاستثنائية','معالجة الغياب والتأخر قبل إغلاق الحصة.','pending','high',v_academy_user,null,'gate',false,'2026-11-01 20:00:00+03','opsAttendance',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'event_id',v_event)),
  ('00000000-0000-4000-8000-00000000b310',v_org,v_org_entity,v_event_entity,'achievement_publish','اعتماد الإنجاز المشترك للنشر','مراجعة الدليل والأطراف قبل ظهوره في هويات الأكاديمية والمدرب واللاعب.','pending','normal',v_academy_user,null,'content',true,'2026-11-02 12:00:00+03','identityHub',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'achievement_id',v_achievement)),
  ('00000000-0000-4000-8000-00000000b311',v_org,v_coach_entity,v_event_entity,'general_task','نشر خطة الحصة المشتركة','اعتماد مراحل التدريب والحمل والتعليمات قبل إرسالها للاعبين.','pending','critical',v_academy_user,v_coach_user,'coach',false,'2026-11-01 14:00:00+03','session',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'event_id',v_event)),
  ('00000000-0000-4000-8000-00000000b312',v_org,v_player_entity,v_event_entity,'general_task','تأكيد الجاهزية والحضور للحصة','حدّث جاهزيتك وأكد حضورك قبل موعد التدريب.','pending','high',v_academy_user,v_player_user,null,false,'2026-11-01 15:30:00+03','health',jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'event_id',v_event))
  on conflict(id) do nothing;
end $$;
