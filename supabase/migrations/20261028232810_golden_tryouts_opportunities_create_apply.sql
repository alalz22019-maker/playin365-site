create or replace function public.create_my_organization_tryout_opportunity(
  p_organization_id uuid,
  p_title text,
  p_description text default null,
  p_opportunity_type text default 'trial',
  p_age_category text default null,
  p_positions text[] default '{}'::text[],
  p_city text default null,
  p_visibility text default 'public',
  p_opens_at timestamptz default now(),
  p_closes_at timestamptz default null,
  p_team_id uuid default null,
  p_venue_id uuid default null,
  p_event_starts_at timestamptz default null,
  p_event_ends_at timestamptz default null,
  p_capacity integer default null,
  p_guardian_gate_required boolean default false,
  p_requirements jsonb default '{}'::jsonb,
  p_application_form jsonb default '{}'::jsonb,
  p_evaluation_schema jsonb default null,
  p_registration_fee_plan_id uuid default null,
  p_is_demo boolean default false
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_opp public.opportunities%rowtype;
  v_event public.sports_events%rowtype;
  v_event_entity uuid;
  v_team_entity uuid;
  v_event_visibility text;
  v_schema jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_opportunities') then raise exception 'manage_opportunities_denied'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'opportunity_title_required'; end if;
  if p_opportunity_type not in ('trial','scouting','academy_intake','team_opening','scholarship','other') then raise exception 'invalid_opportunity_type'; end if;
  if p_visibility not in ('public','restricted','private') then raise exception 'invalid_visibility'; end if;
  if p_closes_at is not null and p_closes_at<=coalesce(p_opens_at,now()) then raise exception 'invalid_application_window'; end if;
  if p_event_starts_at is null then raise exception 'trial_event_start_required'; end if;
  if p_event_ends_at is not null and p_event_ends_at<=p_event_starts_at then raise exception 'invalid_event_window'; end if;
  if p_capacity is not null and p_capacity<=0 then raise exception 'invalid_capacity'; end if;
  if coalesce(jsonb_typeof(p_requirements),'object')<>'object' or coalesce(jsonb_typeof(p_application_form),'object')<>'object' then raise exception 'json_object_required'; end if;

  if p_team_id is not null and not exists(select 1 from public.teams t where t.id=p_team_id and t.organization_id=p_organization_id and t.status='active') then
    raise exception 'team_not_in_organization';
  end if;
  if p_registration_fee_plan_id is not null and not exists(select 1 from public.organization_fee_plans f where f.id=p_registration_fee_plan_id and f.organization_id=p_organization_id and f.status='active') then
    raise exception 'fee_plan_not_in_organization';
  end if;
  if p_venue_id is not null and not exists(select 1 from public.venues v where v.id=p_venue_id) then raise exception 'venue_not_found'; end if;

  v_schema:=coalesce(p_evaluation_schema,'{"dimensions":[{"code":"technical","label_ar":"فني","weight":30},{"code":"tactical","label_ar":"تكتيكي","weight":25},{"code":"physical","label_ar":"بدني","weight":25},{"code":"mentality","label_ar":"ذهني","weight":20}]}'::jsonb);
  if jsonb_typeof(v_schema)<>'object' then raise exception 'evaluation_schema_object_required'; end if;

  insert into public.opportunities(
    organization_id,opportunity_type,title,description,sport_code,age_category,positions,city,visibility,status,
    opens_at,closes_at,team_id,venue_id,capacity,guardian_gate_required,requirements,application_form,evaluation_schema,
    registration_fee_plan_id,created_by_user_id,is_demo
  ) values(
    p_organization_id,p_opportunity_type,btrim(p_title),nullif(btrim(coalesce(p_description,'')),''),'football',p_age_category,
    coalesce(p_positions,'{}'::text[]),p_city,p_visibility,'draft',coalesce(p_opens_at,now()),p_closes_at,p_team_id,p_venue_id,p_capacity,
    coalesce(p_guardian_gate_required,false),coalesce(p_requirements,'{}'::jsonb),coalesce(p_application_form,'{}'::jsonb),v_schema,
    p_registration_fee_plan_id,v_uid,coalesce(p_is_demo,false)
  ) returning * into v_opp;

  v_event_visibility:=case p_visibility when 'restricted' then 'network' else p_visibility end;
  insert into public.sports_events(
    event_type,title,description,sport_code,age_category,organizer_organization_id,venue_id,starts_at,ends_at,
    visibility,status,registration_required,guardian_gate_required,metadata,created_by,is_demo
  ) values(
    'trial',v_opp.title,v_opp.description,v_opp.sport_code,v_opp.age_category,p_organization_id,p_venue_id,p_event_starts_at,p_event_ends_at,
    v_event_visibility,'scheduled',true,v_opp.guardian_gate_required,
    jsonb_build_object('journey','golden_tryouts_opportunities','opportunity_id',v_opp.id,'capacity',v_opp.capacity),v_uid,coalesce(p_is_demo,false)
  ) returning * into v_event;

  update public.opportunities set sports_event_id=v_event.id,updated_at=now() where id=v_opp.id returning * into v_opp;

  select e.id into v_event_entity from public.entities e where e.entity_type='sports_event' and e.sports_event_id=v_event.id limit 1;
  if p_team_id is not null and v_event_entity is not null then
    select e.id into v_team_entity from public.entities e where e.entity_type='team' and e.team_id=p_team_id limit 1;
    if v_team_entity is not null then
      insert into public.entity_event_links(event_entity_id,entity_id,participation_role,status,verification_status,source_type,source_id,metadata)
      values(v_event_entity,v_team_entity,'target_team','active','verified','opportunity',v_opp.id::text,jsonb_build_object('organization_id',p_organization_id))
      on conflict do nothing;
    end if;
  end if;

  insert into public.activity_events(actor_user_id,actor_organization_id,event_type,title,summary,visibility_scope,source_type,source_id,metadata)
  values(v_uid,p_organization_id,'opportunity_created','تم إنشاء فرصة وتجربة',v_opp.title,'private','opportunity',v_opp.id::text,
         jsonb_build_object('sports_event_id',v_event.id,'team_id',p_team_id,'status',v_opp.status))
  on conflict(source_type,source_id,event_type) where source_id is not null do nothing;

  return jsonb_build_object('created',true,'opportunity',to_jsonb(v_opp),'event',to_jsonb(v_event));
end $$;

create or replace function public.act_my_organization_tryout_opportunity(
  p_opportunity_id uuid,
  p_action text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_opp public.opportunities%rowtype;
  v_status text;
  v_event_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_opp from public.opportunities where id=p_opportunity_id for update;
  if not found then raise exception 'opportunity_not_found'; end if;
  if not public.organization_user_has_permission(v_opp.organization_id,v_uid,'manage_opportunities') then raise exception 'manage_opportunities_denied'; end if;

  v_status:=case p_action
    when 'publish' then 'open'
    when 'pause' then 'paused'
    when 'resume' then 'open'
    when 'close' then 'closed'
    when 'archive' then 'archived'
    else null end;
  if v_status is null then raise exception 'invalid_opportunity_action'; end if;
  if p_action='publish' and (v_opp.closes_at is not null and v_opp.closes_at<=now()) then raise exception 'application_window_closed'; end if;

  update public.opportunities
  set status=v_status,
      published_at=case when p_action='publish' then coalesce(published_at,now()) else published_at end,
      updated_at=now()
  where id=v_opp.id returning * into v_opp;

  if v_opp.sports_event_id is not null then
    v_event_status:=case when p_action='archive' then 'cancelled' else 'scheduled' end;
    update public.sports_events set status=v_event_status,updated_at=now(),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('opportunity_status',v_status,'last_action_note',p_note)
    where id=v_opp.sports_event_id;
  end if;

  insert into public.activity_events(actor_user_id,actor_organization_id,event_type,title,summary,visibility_scope,source_type,source_id,metadata)
  values(v_uid,v_opp.organization_id,'opportunity_'||p_action,'تم تحديث حالة الفرصة',coalesce(p_note,v_opp.title),'private','opportunity',v_opp.id::text,
         jsonb_build_object('action',p_action,'status',v_status))
  on conflict(source_type,source_id,event_type) where source_id is not null do nothing;

  return jsonb_build_object('changed',true,'action',p_action,'opportunity',to_jsonb(v_opp));
end $$;

create or replace function public.my_tryout_opportunity_apply(
  p_opportunity_id uuid,
  p_answers jsonb default '{}'::jsonb,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_athlete public.athlete_profiles%rowtype;
  v_profile public.profiles%rowtype;
  v_opp public.opportunities%rowtype;
  v_candidate public.opportunity_candidates%rowtype;
  v_birth date;
  v_minor boolean:=false;
  v_gate boolean:=false;
  v_guardian uuid;
  v_approval uuid;
  v_registration uuid;
  v_required_docs integer:=0;
  v_event_entity uuid;
  v_person_entity uuid;
  v_work_item uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_answers is null or jsonb_typeof(p_answers)<>'object' then raise exception 'answers_object_required'; end if;
  select * into v_athlete from public.athlete_profiles where user_id=v_uid;
  if not found then raise exception 'player_profile_required'; end if;
  select * into v_profile from public.profiles where id=v_uid;
  select * into v_opp from public.opportunities where id=p_opportunity_id for update;
  if not found or v_opp.status<>'open' or v_opp.visibility not in ('public','restricted')
     or (v_opp.opens_at is not null and v_opp.opens_at>now())
     or (v_opp.closes_at is not null and v_opp.closes_at<now()) then raise exception 'opportunity_not_available'; end if;
  if v_opp.sport_code is not null and v_opp.sport_code<>coalesce(v_athlete.sport_code,'football') then raise exception 'sport_not_eligible'; end if;
  if v_opp.capacity is not null and (select count(*) from public.opportunity_candidates c where c.opportunity_id=v_opp.id and c.stage not in ('rejected','withdrawn'))>=v_opp.capacity then raise exception 'opportunity_capacity_reached'; end if;

  select * into v_candidate from public.opportunity_candidates where opportunity_id=v_opp.id and athlete_id=v_athlete.id;
  if found then return jsonb_build_object('created',false,'candidate',to_jsonb(v_candidate)); end if;

  select birth_date into v_birth from public.profile_private where user_id=v_uid;
  v_minor:=v_birth is not null and v_birth>(current_date-interval '18 years')::date;
  v_gate:=v_minor or v_opp.guardian_gate_required;
  if v_gate then
    select guardian_user_id into v_guardian
    from public.guardianships
    where athlete_id=v_athlete.id and status='verified'
    order by verified_at nulls last,created_at limit 1;
    if v_guardian is null then raise exception 'verified_guardian_required'; end if;
  end if;

  begin
    v_required_docs:=jsonb_array_length(coalesce(v_opp.requirements->'required_documents','[]'::jsonb));
  exception when others then v_required_docs:=0; end;

  if v_opp.sports_event_id is not null then
    insert into public.event_registrations(event_id,athlete_id,requested_by_user_id,status,metadata)
    values(v_opp.sports_event_id,v_athlete.id,v_uid,case when v_gate then 'pending_guardian' else 'pending_organizer' end,
           jsonb_build_object('source','opportunity_application','opportunity_id',v_opp.id))
    on conflict(event_id,athlete_id) do update set updated_at=now()
    returning id into v_registration;
  end if;

  insert into public.opportunity_candidates(
    opportunity_id,athlete_id,stage,initiated_by_user_id,note,event_registration_id,
    application_snapshot,application_answers,eligibility_status,document_status,check_in_status,is_demo
  ) values(
    v_opp.id,v_athlete.id,case when v_gate then 'applied' else 'review' end,v_uid,nullif(btrim(coalesce(p_note,'')),''),v_registration,
    jsonb_build_object('user_id',v_uid,'display_name',coalesce(v_profile.display_name,v_profile.name,v_profile.handle),'handle',v_profile.handle,
      'city',v_profile.city,'sport_code',v_athlete.sport_code,'primary_position',v_athlete.primary_position,'birth_date',v_birth,'captured_at',now()),
    p_answers,'pending',case when v_required_docs>0 then 'pending' else 'not_required' end,
    case when v_opp.sports_event_id is not null then 'pending' else 'not_required' end,v_opp.is_demo
  ) returning * into v_candidate;

  if v_gate then
    insert into public.approval_requests(athlete_id,request_type,requested_by_user_id,assigned_to_user_id,related_organization_id,status,payload,expires_at)
    values(v_athlete.id,'trial',v_uid,v_guardian,v_opp.organization_id,'pending',
           jsonb_build_object('candidate_id',v_candidate.id,'opportunity_id',v_opp.id,'event_registration_id',v_registration,'opportunity_title',v_opp.title),v_opp.closes_at)
    returning id into v_approval;
    update public.opportunity_candidates set approval_request_id=v_approval,updated_at=now() where id=v_candidate.id returning * into v_candidate;
    if v_registration is not null then update public.event_registrations set guardian_approval_request_id=v_approval,updated_at=now() where id=v_registration; end if;
    insert into public.notifications(user_id,notification_type,title,body,data)
    values(v_guardian,'tryout_guardian_approval','موافقتك مطلوبة','طلب مشاركة في تجربة: '||v_opp.title,
           jsonb_build_object('candidate_id',v_candidate.id,'opportunity_id',v_opp.id,'event_registration_id',v_registration));
  end if;

  select e.id into v_event_entity from public.entities e where e.entity_type='sports_event' and e.sports_event_id=v_opp.sports_event_id limit 1;
  select e.id into v_person_entity from public.entities e where e.entity_type='person' and e.profile_id=v_uid limit 1;
  if v_event_entity is not null and v_person_entity is not null then
    insert into public.entity_event_links(event_entity_id,entity_id,participation_role,status,verification_status,source_type,source_id,metadata)
    values(v_event_entity,v_person_entity,'applicant',case when v_gate then 'invited' else 'registered' end,'pending','opportunity_candidate',v_candidate.id::text,
           jsonb_build_object('opportunity_id',v_opp.id,'stage',v_candidate.stage))
    on conflict do nothing;
  end if;

  insert into public.work_items(
    organization_id,event_entity_id,work_type_code,title,description,status,priority,requested_by_user_id,
    assigned_responsibility_code,decision_required,due_at,action_route,payload
  ) values(
    v_opp.organization_id,v_event_entity,'trial_application','مراجعة طلب تجربة — '||coalesce(v_profile.display_name,v_profile.name,'لاعب'),
    v_opp.title,'pending','normal',v_uid,'registration',true,coalesce(v_opp.closes_at,now()+interval '7 days'),'tryoutOpportunity',
    jsonb_build_object('candidate_id',v_candidate.id,'opportunity_id',v_opp.id,'guardian_required',v_gate)
  ) returning id into v_work_item;

  insert into public.activity_events(actor_user_id,actor_organization_id,subject_athlete_id,event_type,title,summary,visibility_scope,source_type,source_id,metadata)
  values(v_uid,v_opp.organization_id,v_athlete.id,'opportunity_applied','تم التقديم على تجربة',v_opp.title,
         case when v_gate then 'guardian' else 'private' end,'opportunity_candidate',v_candidate.id::text,
         jsonb_build_object('opportunity_id',v_opp.id,'sports_event_id',v_opp.sports_event_id,'guardian_required',v_gate,'work_item_id',v_work_item))
  on conflict(source_type,source_id,event_type) where source_id is not null do nothing;

  return jsonb_build_object('created',true,'guardian_required',v_gate,'candidate',to_jsonb(v_candidate),'approval_request_id',v_approval,'event_registration_id',v_registration,'work_item_id',v_work_item);
end $$;

create or replace function public.my_opportunity_apply(p_opportunity_id uuid)
returns jsonb
language sql
security definer
set search_path=''
as $$ select public.my_tryout_opportunity_apply(p_opportunity_id,'{}'::jsonb,null) $$;

create or replace function public.my_guardian_tryout_application_decide(
  p_candidate_id uuid,
  p_decision text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_a public.approval_requests%rowtype;
  v_opp public.opportunities%rowtype;
  v_player_user uuid;
  v_event_entity uuid;
  v_person_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'invalid_decision'; end if;
  select * into v_c from public.opportunity_candidates where id=p_candidate_id for update;
  if not found or v_c.stage<>'applied' or v_c.approval_request_id is null then raise exception 'candidate_not_pending_guardian'; end if;
  select * into v_a from public.approval_requests where id=v_c.approval_request_id for update;
  if not found or v_a.assigned_to_user_id<>v_uid or v_a.status<>'pending' then raise exception 'guardian_not_authorized'; end if;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;

  update public.approval_requests set status=p_decision,decision_note=p_note,decided_at=now(),updated_at=now() where id=v_a.id;
  update public.opportunity_candidates
    set stage=case when p_decision='approved' then 'review' else 'rejected' end,
        eligibility_status=case when p_decision='approved' then eligibility_status else 'ineligible' end,
        updated_by_user_id=v_uid,updated_at=now()
    where id=v_c.id returning * into v_c;
  if v_c.event_registration_id is not null then
    update public.event_registrations
      set status=case when p_decision='approved' then 'pending_organizer' else 'rejected' end,
          organizer_decision_note=case when p_decision='rejected' then p_note else organizer_decision_note end,
          updated_at=now()
      where id=v_c.event_registration_id;
  end if;
  select user_id into v_player_user from public.athlete_profiles where id=v_c.athlete_id;
  select e.id into v_event_entity from public.entities e where e.entity_type='sports_event' and e.sports_event_id=v_opp.sports_event_id limit 1;
  select e.id into v_person_entity from public.entities e where e.entity_type='person' and e.profile_id=v_player_user limit 1;
  if v_event_entity is not null and v_person_entity is not null then
    update public.entity_event_links
       set status=case when p_decision='approved' then 'registered' else 'cancelled' end,
           metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('guardian_decision',p_decision),updated_at=now()
     where event_entity_id=v_event_entity and entity_id=v_person_entity and source_type='opportunity_candidate' and source_id=v_c.id::text;
  end if;
  insert into public.notifications(user_id,notification_type,title,body,data)
  values(v_player_user,'tryout_guardian_decision',case when p_decision='approved' then 'وافق ولي الأمر على طلب التجربة' else 'رفض ولي الأمر طلب التجربة' end,
         v_opp.title,jsonb_build_object('candidate_id',v_c.id,'opportunity_id',v_opp.id,'decision',p_decision));
  return jsonb_build_object('decided',true,'decision',p_decision,'candidate',to_jsonb(v_c));
end $$;

create or replace function public.my_guardian_opportunity_decide(p_candidate_id uuid,p_decision text,p_note text default null)
returns jsonb
language sql
security definer
set search_path=''
as $$ select public.my_guardian_tryout_application_decide(p_candidate_id,p_decision,p_note) $$;
