create or replace function public.my_tryout_evaluation_save(
  p_candidate_id uuid,
  p_dimensions jsonb,
  p_recommendation text,
  p_athlete_summary text default null,
  p_staff_note text default null,
  p_evidence jsonb default '{}'::jsonb,
  p_publish boolean default true
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_opp public.opportunities%rowtype;
  v_eval public.opportunity_evaluations%rowtype;
  v_dim jsonb;
  v_code text;
  v_label text;
  v_score numeric;
  v_weight numeric;
  v_total numeric:=0;
  v_weights numeric:=0;
  v_overall numeric;
  v_player_assessment uuid;
  v_player_user uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_dimensions is null or jsonb_typeof(p_dimensions)<>'array' or jsonb_array_length(p_dimensions)=0 then raise exception 'evaluation_dimensions_required'; end if;
  if p_recommendation not in ('select','waitlist','reject','observe') then raise exception 'invalid_recommendation'; end if;
  if p_evidence is null or jsonb_typeof(p_evidence)<>'object' then raise exception 'evidence_object_required'; end if;
  select * into v_c from public.opportunity_candidates where id=p_candidate_id for update;
  if not found then raise exception 'candidate_not_found'; end if;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;
  if not private.opportunity_user_can_evaluate(v_opp.id,v_uid) then raise exception 'tryout_evaluation_denied'; end if;
  if v_c.stage not in ('trial','waitlisted','shortlisted') then raise exception 'candidate_not_evaluable'; end if;
  if v_c.event_registration_id is not null and v_c.check_in_status<>'checked_in' then raise exception 'candidate_check_in_required'; end if;

  for v_dim in select value from jsonb_array_elements(p_dimensions)
  loop
    v_code:=nullif(btrim(coalesce(v_dim->>'code','')),'');
    v_label:=nullif(btrim(coalesce(v_dim->>'label_ar','')),'');
    begin v_score:=(v_dim->>'score')::numeric; exception when others then raise exception 'invalid_dimension_score'; end;
    begin v_weight:=coalesce((v_dim->>'weight')::numeric,1); exception when others then raise exception 'invalid_dimension_weight'; end;
    if v_code is null or v_score<0 or v_score>100 or v_weight<=0 then raise exception 'invalid_evaluation_dimension'; end if;
    v_total:=v_total+(v_score*v_weight);
    v_weights:=v_weights+v_weight;
  end loop;
  v_overall:=round(v_total/nullif(v_weights,0),2);
  v_status:=case when p_publish then 'published' else 'draft' end;

  insert into public.opportunity_evaluations(
    candidate_id,evaluator_user_id,organization_id,sports_event_id,status,recommendation,overall_score,
    athlete_summary,staff_note,evidence,published_at
  ) values(
    v_c.id,v_uid,v_opp.organization_id,v_opp.sports_event_id,v_status,p_recommendation,v_overall,
    nullif(btrim(coalesce(p_athlete_summary,'')),''),nullif(btrim(coalesce(p_staff_note,'')),''),p_evidence,
    case when p_publish then now() else null end
  )
  on conflict(candidate_id,evaluator_user_id) do update set
    status=excluded.status,recommendation=excluded.recommendation,overall_score=excluded.overall_score,
    athlete_summary=excluded.athlete_summary,staff_note=excluded.staff_note,evidence=excluded.evidence,
    published_at=case when excluded.status='published' then now() else public.opportunity_evaluations.published_at end,
    updated_at=now()
  returning * into v_eval;

  delete from public.opportunity_evaluation_dimensions where evaluation_id=v_eval.id;
  for v_dim in select value from jsonb_array_elements(p_dimensions)
  loop
    insert into public.opportunity_evaluation_dimensions(evaluation_id,dimension_code,label_ar,score,weight,note)
    values(v_eval.id,btrim(v_dim->>'code'),nullif(btrim(coalesce(v_dim->>'label_ar','')),''),(v_dim->>'score')::numeric,
           coalesce((v_dim->>'weight')::numeric,1),nullif(btrim(coalesce(v_dim->>'note','')),''));
  end loop;

  if p_publish then
    update public.opportunity_candidates
      set evaluated_at=now(),final_score=v_overall,recommendation=p_recommendation,updated_by_user_id=v_uid,updated_at=now()
      where id=v_c.id returning * into v_c;

    if v_opp.team_id is not null then
      select pa.id into v_player_assessment
      from public.player_assessments pa
      where pa.organization_id=v_opp.organization_id and pa.team_id=v_opp.team_id and pa.athlete_id=v_c.athlete_id
        and pa.assessment_type='trial' and pa.period_label='OPPORTUNITY:'||v_opp.id::text
      order by pa.created_at desc limit 1;
      if v_player_assessment is null then
        insert into public.player_assessments(
          organization_id,team_id,athlete_id,assessment_type,period_label,summary,status,visibility,
          created_by_user_id,updated_by_user_id,approved_by_user_id,approved_at,verification_source
        ) values(
          v_opp.organization_id,v_opp.team_id,v_c.athlete_id,'trial','OPPORTUNITY:'||v_opp.id::text,
          nullif(btrim(coalesce(p_athlete_summary,'')),''),'approved','athlete_guardian',v_uid,v_uid,v_uid,now(),'coach'
        ) returning id into v_player_assessment;
      else
        update public.player_assessments
          set summary=nullif(btrim(coalesce(p_athlete_summary,'')),''),status='approved',visibility='athlete_guardian',
              updated_by_user_id=v_uid,approved_by_user_id=v_uid,approved_at=now(),verification_source='coach',updated_at=now()
        where id=v_player_assessment;
        delete from public.player_assessment_dimensions where assessment_id=v_player_assessment;
      end if;
      for v_dim in select value from jsonb_array_elements(p_dimensions)
      loop
        insert into public.player_assessment_dimensions(assessment_id,dimension_code,score,note)
        values(v_player_assessment,btrim(v_dim->>'code'),round(((v_dim->>'score')::numeric)/10.0,2),nullif(btrim(coalesce(v_dim->>'note','')),''));
      end loop;
    end if;

    select ap.user_id into v_player_user from public.athlete_profiles ap where ap.id=v_c.athlete_id;
    insert into public.notifications(user_id,notification_type,title,body,data)
    values(v_player_user,'tryout_evaluation_published','تم نشر تقييم تجربة الأداء',coalesce(p_athlete_summary,'يمكنك مراجعة النتيجة داخل رحلة التجربة'),
      jsonb_build_object('candidate_id',v_c.id,'opportunity_id',v_opp.id,'score',v_overall,'recommendation',p_recommendation));
  end if;

  return jsonb_build_object('saved',true,'published',p_publish,'evaluation',to_jsonb(v_eval),'overall_score',v_overall,'candidate',to_jsonb(v_c),'player_assessment_id',v_player_assessment);
end $$;

create or replace function public.my_organization_opportunity_offer_create(
  p_candidate_id uuid,
  p_offer_type text,
  p_title text,
  p_terms_summary jsonb default '{}'::jsonb,
  p_valid_until timestamptz default null,
  p_team_id uuid default null,
  p_message text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_opp public.opportunities%rowtype;
  v_offer public.athlete_offers%rowtype;
  v_player_user uuid;
  v_birth date;
  v_minor boolean:=false;
  v_guardian uuid;
  v_approval uuid;
  v_team uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_offer_type not in ('trial','academy_registration','youth_registration','professional_contract','transfer','other') then raise exception 'invalid_offer_type'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'offer_title_required'; end if;
  if p_terms_summary is null or jsonb_typeof(p_terms_summary)<>'object' then raise exception 'offer_terms_object_required'; end if;
  if p_valid_until is not null and p_valid_until<=now() then raise exception 'offer_valid_until_must_be_future'; end if;
  select * into v_c from public.opportunity_candidates where id=p_candidate_id for update;
  if not found or v_c.stage not in ('trial','waitlisted','shortlisted') then raise exception 'candidate_not_offer_ready'; end if;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;
  if not public.organization_user_has_permission(v_opp.organization_id,v_uid,'manage_opportunities') then raise exception 'manage_opportunities_denied'; end if;
  if not exists(select 1 from public.opportunity_evaluations e where e.candidate_id=v_c.id and e.status='published' and e.recommendation='select') then
    raise exception 'select_recommendation_required';
  end if;
  if exists(select 1 from public.athlete_offers ao where ao.candidate_id=v_c.id and ao.status in ('draft','sent','pending_guardian','accepted')) then
    raise exception 'active_offer_already_exists';
  end if;
  v_team:=coalesce(p_team_id,v_opp.team_id);
  if v_team is not null and not exists(select 1 from public.teams t where t.id=v_team and t.organization_id=v_opp.organization_id and t.status='active') then
    raise exception 'offer_team_not_in_organization';
  end if;

  select ap.user_id into v_player_user from public.athlete_profiles ap where ap.id=v_c.athlete_id;
  select pp.birth_date into v_birth from public.profile_private pp where pp.user_id=v_player_user;
  v_minor:=(v_birth is not null and v_birth>(current_date-interval '18 years')::date) or v_opp.guardian_gate_required;
  if v_minor then
    select g.guardian_user_id into v_guardian from public.guardianships g
    where g.athlete_id=v_c.athlete_id and g.status='verified'
    order by g.verified_at desc nulls last,g.created_at desc limit 1;
    if v_guardian is null then raise exception 'verified_guardian_required'; end if;
  end if;

  insert into public.athlete_offers(
    athlete_id,organization_id,opportunity_id,candidate_id,team_id,offer_type,title,terms_summary,status,
    valid_until,offered_by_user_id,message
  ) values(
    v_c.athlete_id,v_opp.organization_id,v_opp.id,v_c.id,v_team,p_offer_type,btrim(p_title),p_terms_summary,
    case when v_minor then 'pending_guardian' else 'sent' end,p_valid_until,v_uid,nullif(btrim(coalesce(p_message,'')),'')
  ) returning * into v_offer;

  if v_minor then
    insert into public.approval_requests(athlete_id,request_type,requested_by_user_id,assigned_to_user_id,related_organization_id,status,payload,expires_at)
    values(v_c.athlete_id,'offer',v_uid,v_guardian,v_opp.organization_id,'pending',
      jsonb_build_object('offer_id',v_offer.id,'candidate_id',v_c.id,'opportunity_id',v_opp.id,'offer_title',v_offer.title,'offer_type',v_offer.offer_type),p_valid_until)
    returning id into v_approval;
    update public.athlete_offers set approval_request_id=v_approval,updated_at=now() where id=v_offer.id returning * into v_offer;
    insert into public.notifications(user_id,notification_type,title,body,data)
    values(v_guardian,'opportunity_offer_guardian_approval','موافقتك مطلوبة على عرض',v_offer.title,
      jsonb_build_object('offer_id',v_offer.id,'candidate_id',v_c.id,'opportunity_id',v_opp.id));
  end if;

  update public.opportunity_candidates set stage='offer',updated_by_user_id=v_uid,updated_at=now() where id=v_c.id;
  insert into public.notifications(user_id,notification_type,title,body,data)
  values(v_player_user,'opportunity_offer_created',case when v_minor then 'وصلك عرض بانتظار موافقة ولي الأمر' else 'وصلك عرض جديد' end,
    v_offer.title,jsonb_build_object('offer_id',v_offer.id,'candidate_id',v_c.id,'opportunity_id',v_opp.id,'status',v_offer.status));
  return jsonb_build_object('created',true,'guardian_required',v_minor,'offer',to_jsonb(v_offer),'candidate_stage','offer');
end $$;

create or replace function public.my_guardian_opportunity_offer_decide(
  p_offer_id uuid,
  p_decision text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_offer public.athlete_offers%rowtype;
  v_approval public.approval_requests%rowtype;
  v_player_user uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'invalid_decision'; end if;
  select * into v_offer from public.athlete_offers where id=p_offer_id for update;
  if not found or v_offer.status<>'pending_guardian' or v_offer.approval_request_id is null then raise exception 'offer_not_pending_guardian'; end if;
  select * into v_approval from public.approval_requests where id=v_offer.approval_request_id for update;
  if not found or v_approval.assigned_to_user_id<>v_uid or v_approval.status<>'pending' then raise exception 'guardian_not_authorized'; end if;
  if v_offer.valid_until is not null and v_offer.valid_until<=now() then
    update public.approval_requests set status='expired',decision_note='Offer expired before guardian decision',decided_at=now(),updated_at=now() where id=v_approval.id;
    update public.athlete_offers set status='expired',updated_at=now() where id=v_offer.id returning * into v_offer;
    update public.opportunity_candidates set stage='trial',updated_at=now() where id=v_offer.candidate_id and stage='offer';
    return jsonb_build_object('decided',false,'reason','offer_expired','offer',to_jsonb(v_offer));
  end if;

  update public.approval_requests set status=p_decision,decision_note=p_note,decided_at=now(),updated_at=now() where id=v_approval.id;
  update public.athlete_offers set status=case when p_decision='approved' then 'sent' else 'rejected' end,
      decided_by_user_id=v_uid,updated_at=now()
  where id=v_offer.id returning * into v_offer;
  if p_decision='rejected' then update public.opportunity_candidates set stage='rejected',updated_at=now() where id=v_offer.candidate_id; end if;
  select ap.user_id into v_player_user from public.athlete_profiles ap where ap.id=v_offer.athlete_id;
  insert into public.notifications(user_id,notification_type,title,body,data)
  values(v_player_user,'opportunity_offer_guardian_decision',case when p_decision='approved' then 'وافق ولي الأمر — العرض جاهز لقرارك' else 'رفض ولي الأمر العرض' end,
    v_offer.title,jsonb_build_object('offer_id',v_offer.id,'decision',p_decision,'status',v_offer.status));
  return jsonb_build_object('decided',true,'decision',p_decision,'offer',to_jsonb(v_offer));
end $$;
