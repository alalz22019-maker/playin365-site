create or replace function public.my_opportunity_candidate_document_submit(
  p_candidate_id uuid,
  p_document_type text,
  p_title text,
  p_storage_path text default null,
  p_checksum_sha256 text default null,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_doc public.opportunity_candidate_documents%rowtype;
  v_is_owner boolean:=false;
  v_is_guardian boolean:=false;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if nullif(btrim(coalesce(p_document_type,'')),'') is null then raise exception 'document_type_required'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'document_title_required'; end if;
  select * into v_c from public.opportunity_candidates where id=p_candidate_id;
  if not found then raise exception 'candidate_not_found'; end if;
  select exists(select 1 from public.athlete_profiles ap where ap.id=v_c.athlete_id and ap.user_id=v_uid) into v_is_owner;
  select exists(select 1 from public.guardianships g where g.athlete_id=v_c.athlete_id and g.guardian_user_id=v_uid and g.status='verified') into v_is_guardian;
  if not (v_is_owner or v_is_guardian) then raise exception 'candidate_document_submit_denied'; end if;
  if v_c.stage in ('rejected','withdrawn','accepted') then raise exception 'candidate_stage_closed'; end if;

  insert into public.opportunity_candidate_documents(
    candidate_id,document_type,title,storage_path,checksum_sha256,status,visibility,note,uploaded_by_user_id
  ) values(
    v_c.id,btrim(p_document_type),btrim(p_title),nullif(btrim(coalesce(p_storage_path,'')),''),
    nullif(btrim(coalesce(p_checksum_sha256,'')),''),'submitted',case when v_is_guardian then 'guardian' else 'private' end,
    nullif(btrim(coalesce(p_note,'')),''),v_uid
  ) returning * into v_doc;

  update public.opportunity_candidates set document_status='pending',updated_by_user_id=v_uid,updated_at=now() where id=v_c.id;
  return jsonb_build_object('submitted',true,'document',to_jsonb(v_doc));
end $$;

create or replace function public.my_organization_opportunity_document_review(
  p_document_id uuid,
  p_decision text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_doc public.opportunity_candidate_documents%rowtype;
  v_c public.opportunity_candidates%rowtype;
  v_opp public.opportunities%rowtype;
  v_document_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_decision not in ('verified','rejected') then raise exception 'invalid_document_decision'; end if;
  select * into v_doc from public.opportunity_candidate_documents where id=p_document_id for update;
  if not found then raise exception 'candidate_document_not_found'; end if;
  select * into v_c from public.opportunity_candidates where id=v_doc.candidate_id;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;
  if not public.organization_user_has_permission(v_opp.organization_id,v_uid,'manage_opportunities') then raise exception 'manage_opportunities_denied'; end if;

  update public.opportunity_candidate_documents
     set status=p_decision,note=coalesce(nullif(btrim(coalesce(p_note,'')),''),note),reviewed_by_user_id=v_uid,reviewed_at=now(),updated_at=now()
   where id=v_doc.id returning * into v_doc;

  if exists(select 1 from public.opportunity_candidate_documents d where d.candidate_id=v_c.id and d.status='rejected') then
    v_document_status:='rejected';
  elsif exists(select 1 from public.opportunity_candidate_documents d where d.candidate_id=v_c.id and d.status='submitted') then
    v_document_status:='pending';
  else
    v_document_status:='complete';
  end if;
  update public.opportunity_candidates set document_status=v_document_status,updated_by_user_id=v_uid,updated_at=now() where id=v_c.id;
  return jsonb_build_object('reviewed',true,'decision',p_decision,'document',to_jsonb(v_doc),'candidate_document_status',v_document_status);
end $$;

create or replace function public.my_organization_tryout_candidate_decide(
  p_candidate_id uuid,
  p_action text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_opp public.opportunities%rowtype;
  v_player_user uuid;
  v_profile_name text;
  v_from_stage text;
  v_to_stage text;
  v_eligibility text;
  v_work_status text;
  v_event_entity uuid;
  v_assigned_coach uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_c from public.opportunity_candidates where id=p_candidate_id for update;
  if not found then raise exception 'candidate_not_found'; end if;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;
  if not public.organization_user_has_permission(v_opp.organization_id,v_uid,'manage_opportunities') then raise exception 'manage_opportunities_denied'; end if;
  if v_c.stage in ('accepted','withdrawn') then raise exception 'candidate_stage_final'; end if;

  v_from_stage:=v_c.stage;
  v_to_stage:=case p_action
    when 'needs_info' then 'review'
    when 'mark_eligible' then 'review'
    when 'shortlist' then 'shortlisted'
    when 'invite_trial' then 'trial'
    when 'waitlist' then 'waitlisted'
    when 'reject' then 'rejected'
    when 'restore_review' then 'review'
    else null end;
  if v_to_stage is null then raise exception 'invalid_candidate_action'; end if;
  if p_action in ('shortlist','invite_trial','waitlist') and v_c.approval_request_id is not null
     and not exists(select 1 from public.approval_requests a where a.id=v_c.approval_request_id and a.status='approved') then
    raise exception 'guardian_approval_required';
  end if;
  if p_action in ('shortlist','invite_trial') and v_c.document_status='rejected' then raise exception 'candidate_documents_rejected'; end if;

  v_eligibility:=case
    when p_action='needs_info' then 'needs_info'
    when p_action='reject' then 'ineligible'
    when p_action in ('mark_eligible','shortlist','invite_trial','waitlist') then 'eligible'
    else v_c.eligibility_status end;

  update public.opportunity_candidates
    set stage=v_to_stage,eligibility_status=v_eligibility,
        note=coalesce(nullif(btrim(coalesce(p_note,'')),''),note),
        updated_by_user_id=v_uid,updated_at=now(),
        withdrawn_at=case when v_to_stage='withdrawn' then now() else withdrawn_at end
    where id=v_c.id returning * into v_c;

  if v_c.event_registration_id is not null then
    update public.event_registrations
       set status=case
         when v_to_stage='trial' then 'registered'
         when v_to_stage='rejected' then 'rejected'
         when v_to_stage='withdrawn' then 'cancelled'
         else status end,
           registered_at=case when v_to_stage='trial' then coalesce(registered_at,now()) else registered_at end,
           organizer_decided_by_organization_id=v_opp.organization_id,
           organizer_decision_note=coalesce(nullif(btrim(coalesce(p_note,'')),''),organizer_decision_note),updated_at=now()
     where id=v_c.event_registration_id;
  end if;

  select ap.user_id,coalesce(p.display_name,p.name,p.handle,'لاعب') into v_player_user,v_profile_name
  from public.athlete_profiles ap join public.profiles p on p.id=ap.user_id where ap.id=v_c.athlete_id;

  insert into public.notifications(user_id,notification_type,title,body,data)
  values(v_player_user,'tryout_stage_changed',case p_action
    when 'needs_info' then 'الطلب يحتاج معلومات إضافية'
    when 'mark_eligible' then 'تم اجتياز فحص الأهلية'
    when 'shortlist' then 'انتقلت إلى القائمة المختصرة'
    when 'invite_trial' then 'تمت دعوتك إلى تجربة الأداء'
    when 'waitlist' then 'أضيف طلبك إلى قائمة الانتظار'
    when 'reject' then 'تم إغلاق طلب التجربة'
    else 'عاد طلبك إلى المراجعة' end,
    v_opp.title,jsonb_build_object('candidate_id',v_c.id,'opportunity_id',v_opp.id,'stage',v_c.stage,'action',p_action));

  v_work_status:=case when p_action='needs_info' then 'waiting' when p_action='reject' then 'rejected' else 'completed' end;
  update public.work_items set status=v_work_status,
      resolution=jsonb_build_object('action',p_action,'stage',v_c.stage,'note',p_note),resolved_by_user_id=v_uid,resolved_at=case when v_work_status<>'waiting' then now() else null end,updated_at=now()
  where payload->>'candidate_id'=v_c.id::text and status in ('pending','in_progress','waiting');

  if p_action='invite_trial' then
    select e.id into v_event_entity from public.entities e where e.entity_type='sports_event' and e.sports_event_id=v_opp.sports_event_id limit 1;
    select coalesce(t.head_coach_user_id,
      (select m.user_id from public.organization_memberships m where m.organization_id=v_opp.organization_id and m.status='active' and m.role_code in ('head_coach','coach') order by case when m.role_code='head_coach' then 0 else 1 end,m.created_at limit 1))
      into v_assigned_coach
    from public.teams t where t.id=v_opp.team_id;
    insert into public.work_items(organization_id,event_entity_id,work_type_code,title,description,status,priority,requested_by_user_id,
      assigned_to_user_id,assigned_responsibility_code,decision_required,due_at,action_route,payload)
    values(v_opp.organization_id,v_event_entity,'technical_followup','تقييم تجربة — '||v_profile_name,v_opp.title,'pending','high',v_uid,
      v_assigned_coach,'coach',true,
      (select starts_at from public.sports_events where id=v_opp.sports_event_id),'tryoutOpportunity',
      jsonb_build_object('candidate_id',v_c.id,'opportunity_id',v_opp.id,'sports_event_id',v_opp.sports_event_id))
    on conflict do nothing;
  end if;

  return jsonb_build_object('changed',true,'action',p_action,'from_stage',v_from_stage,'candidate',to_jsonb(v_c));
end $$;

create or replace function public.my_tryout_candidate_check_in(
  p_candidate_id uuid,
  p_status text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_opp public.opportunities%rowtype;
  v_link_id uuid;
  v_event_entity uuid;
  v_person_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_status not in ('checked_in','no_show','pending') then raise exception 'invalid_check_in_status'; end if;
  select * into v_c from public.opportunity_candidates where id=p_candidate_id for update;
  if not found then raise exception 'candidate_not_found'; end if;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;
  if not private.opportunity_user_can_evaluate(v_opp.id,v_uid) then raise exception 'tryout_check_in_denied'; end if;
  if v_c.stage not in ('trial','waitlisted') then raise exception 'candidate_not_in_trial'; end if;

  update public.opportunity_candidates
     set check_in_status=p_status,
         checked_in_at=case when p_status='checked_in' then now() else null end,
         note=coalesce(nullif(btrim(coalesce(p_note,'')),''),note),updated_by_user_id=v_uid,updated_at=now()
   where id=v_c.id returning * into v_c;

  if v_c.event_registration_id is not null then
    update public.event_registrations
      set status=case when p_status='checked_in' then 'checked_in' when p_status='no_show' then 'no_show' else 'registered' end,
          checked_in_at=case when p_status='checked_in' then now() else null end,
          attendance_verification_status=case when p_status in ('checked_in','no_show') then 'verified' else 'pending' end,
          organizer_decision_note=coalesce(nullif(btrim(coalesce(p_note,'')),''),organizer_decision_note),updated_at=now()
    where id=v_c.event_registration_id;
  end if;

  select e.id into v_event_entity from public.entities e where e.entity_type='sports_event' and e.sports_event_id=v_opp.sports_event_id limit 1;
  select e.id into v_person_entity from public.entities e join public.athlete_profiles ap on ap.user_id=e.profile_id where e.entity_type='person' and ap.id=v_c.athlete_id limit 1;
  if v_event_entity is not null and v_person_entity is not null then
    update public.entity_event_links set status=case when p_status='no_show' then 'cancelled' else 'active' end,
      verification_status=case when p_status='checked_in' then 'verified' else verification_status end,
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('check_in_status',p_status,'checked_in_at',v_c.checked_in_at),updated_at=now()
    where event_entity_id=v_event_entity and entity_id=v_person_entity and source_type='opportunity_candidate' and source_id=v_c.id::text
    returning id into v_link_id;
  end if;
  return jsonb_build_object('changed',true,'candidate',to_jsonb(v_c),'event_link_id',v_link_id);
end $$;
