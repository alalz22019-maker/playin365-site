create or replace function public.my_tryout_application_withdraw(
  p_candidate_id uuid,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_c public.opportunity_candidates%rowtype;
  v_offer public.athlete_offers%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select c.* into v_c
  from public.opportunity_candidates c join public.athlete_profiles ap on ap.id=c.athlete_id
  where c.id=p_candidate_id and ap.user_id=v_uid for update of c;
  if not found then raise exception 'candidate_not_accessible'; end if;
  if v_c.stage in ('accepted','rejected','withdrawn') then raise exception 'candidate_stage_final'; end if;
  if exists(select 1 from public.athlete_offers ao where ao.candidate_id=v_c.id and ao.status='accepted') then raise exception 'accepted_offer_cannot_withdraw_here'; end if;

  update public.opportunity_candidates
    set stage='withdrawn',withdrawn_at=now(),note=coalesce(nullif(btrim(coalesce(p_note,'')),''),note),updated_by_user_id=v_uid,updated_at=now()
    where id=v_c.id returning * into v_c;
  if v_c.approval_request_id is not null then
    update public.approval_requests set status='cancelled',decision_note=coalesce(p_note,'Application withdrawn'),decided_at=now(),updated_at=now()
    where id=v_c.approval_request_id and status='pending';
  end if;
  if v_c.event_registration_id is not null then
    update public.event_registrations set status='cancelled',organizer_decision_note=p_note,updated_at=now() where id=v_c.event_registration_id;
  end if;
  select * into v_offer from public.athlete_offers where candidate_id=v_c.id and status in ('draft','sent','pending_guardian') order by created_at desc limit 1;
  if found then
    update public.athlete_offers set status='withdrawn',decided_by_user_id=v_uid,updated_at=now() where id=v_offer.id;
    if v_offer.approval_request_id is not null then
      update public.approval_requests set status='cancelled',decision_note=coalesce(p_note,'Application withdrawn'),decided_at=now(),updated_at=now()
      where id=v_offer.approval_request_id and status='pending';
    end if;
  end if;
  update public.work_items set status='cancelled',resolution=jsonb_build_object('reason','applicant_withdrew','note',p_note),
    resolved_by_user_id=v_uid,resolved_at=now(),updated_at=now()
  where payload->>'candidate_id'=v_c.id::text and status in ('pending','in_progress','waiting');
  return jsonb_build_object('withdrawn',true,'candidate',to_jsonb(v_c));
end $$;

create or replace function public.my_tryout_opportunity_center(
  p_opportunity_id uuid default null,
  p_candidate_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_profile public.profiles%rowtype;
  v_athlete_id uuid;
  v_mode text;
  v_selected_opportunity uuid:=p_opportunity_id;
  v_selected_candidate uuid:=p_candidate_id;
  v_can_manage boolean:=false;
  v_can_evaluate boolean:=false;
  v_is_owner boolean:=false;
  v_is_guardian boolean:=false;
  v_opportunities jsonb:='[]'::jsonb;
  v_opportunity jsonb:=null;
  v_candidates jsonb:='[]'::jsonb;
  v_candidate jsonb:=null;
  v_documents jsonb:='[]'::jsonb;
  v_evaluations jsonb:='[]'::jsonb;
  v_offers jsonb:='[]'::jsonb;
  v_admissions jsonb:='[]'::jsonb;
  v_guardian_requests jsonb:='[]'::jsonb;
  v_teams jsonb:='[]'::jsonb;
  v_venues jsonb:='[]'::jsonb;
  v_fee_plans jsonb:='[]'::jsonb;
  v_stats jsonb:='{}'::jsonb;
  v_org_id uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_profile from public.profiles where id=v_uid;
  select ap.id into v_athlete_id from public.athlete_profiles ap where ap.user_id=v_uid;

  if exists(
    select 1 from public.organization_access_assignments a
    join public.organization_access_roles r on r.code=a.access_role_code and r.can_manage_opportunities
    where a.user_id=v_uid and a.status='active' and r.is_active
  ) then v_mode:='academy';
  elsif v_profile.role='coach' or exists(
    select 1 from public.organization_memberships m
    where m.user_id=v_uid and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach','technical_staff','performance_analyst','performance')
  ) then v_mode:='coach';
  elsif v_profile.role='guardian' then v_mode:='guardian';
  else v_mode:='player'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.priority,x.event_starts_at nulls last,x.created_at desc),'[]'::jsonb)
  into v_opportunities
  from (
    select o.id,o.organization_id,org.name_ar organization_name,org.is_verified organization_verified,
      o.opportunity_type,o.title,o.description,o.sport_code,o.age_category,o.positions,o.city,o.visibility,o.status,
      o.opens_at,o.closes_at,o.sports_event_id,o.team_id,t.name team_name,o.venue_id,v.name venue_name,
      se.starts_at event_starts_at,se.ends_at event_ends_at,o.capacity,o.guardian_gate_required,o.registration_fee_plan_id,
      o.is_demo,o.created_at,
      (select count(*)::int from public.opportunity_candidates c where c.opportunity_id=o.id and c.stage not in ('rejected','withdrawn')) candidate_count,
      case
        when v_mode in ('academy','coach') and (private.opportunity_user_can_manage(o.id,v_uid) or private.opportunity_user_can_evaluate(o.id,v_uid)) then 0
        when exists(select 1 from public.opportunity_candidates c where c.opportunity_id=o.id and c.athlete_id=v_athlete_id) then 1
        else 2 end priority
    from public.opportunities o
    join public.organizations org on org.id=o.organization_id
    left join public.sports_events se on se.id=o.sports_event_id
    left join public.teams t on t.id=o.team_id
    left join public.venues v on v.id=o.venue_id
    where
      (v_mode='academy' and private.opportunity_user_can_manage(o.id,v_uid))
      or (v_mode='coach' and private.opportunity_user_can_evaluate(o.id,v_uid))
      or (v_mode='player' and (
        (o.status='open' and o.visibility='public' and (o.opens_at is null or o.opens_at<=now()) and (o.closes_at is null or o.closes_at>=now()))
        or exists(select 1 from public.opportunity_candidates c where c.opportunity_id=o.id and c.athlete_id=v_athlete_id)
      ))
      or (v_mode='guardian' and exists(
        select 1 from public.opportunity_candidates c
        join public.guardianships g on g.athlete_id=c.athlete_id and g.guardian_user_id=v_uid and g.status='verified'
        where c.opportunity_id=o.id
      ))
  ) x;

  if v_selected_opportunity is null then
    if v_mode='guardian' then
      select c.opportunity_id into v_selected_opportunity
      from public.opportunity_candidates c
      join public.guardianships g on g.athlete_id=c.athlete_id and g.guardian_user_id=v_uid and g.status='verified'
      left join public.approval_requests a on a.id=c.approval_request_id
      where a.status='pending' or c.stage not in ('rejected','withdrawn')
      order by (a.status='pending') desc,c.updated_at desc limit 1;
    elsif v_mode='player' then
      select c.opportunity_id into v_selected_opportunity from public.opportunity_candidates c
      where c.athlete_id=v_athlete_id and c.stage not in ('rejected','withdrawn') order by c.updated_at desc limit 1;
    else
      select o.id into v_selected_opportunity from public.opportunities o
      where (v_mode='academy' and private.opportunity_user_can_manage(o.id,v_uid)) or (v_mode='coach' and private.opportunity_user_can_evaluate(o.id,v_uid))
      order by case when o.status='open' then 0 when o.status='draft' then 1 else 2 end,o.updated_at desc limit 1;
    end if;
    if v_selected_opportunity is null then
      select (x->>'id')::uuid into v_selected_opportunity from jsonb_array_elements(v_opportunities) x limit 1;
    end if;
  end if;

  if v_selected_opportunity is not null then
    if not (
      (v_mode='academy' and private.opportunity_user_can_manage(v_selected_opportunity,v_uid))
      or (v_mode='coach' and private.opportunity_user_can_evaluate(v_selected_opportunity,v_uid))
      or (v_mode='player' and (
        exists(select 1 from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.athlete_id=v_athlete_id)
        or exists(select 1 from public.opportunities o where o.id=v_selected_opportunity and o.status='open' and o.visibility='public')
      ))
      or (v_mode='guardian' and exists(
        select 1 from public.opportunity_candidates c join public.guardianships g on g.athlete_id=c.athlete_id
        where c.opportunity_id=v_selected_opportunity and g.guardian_user_id=v_uid and g.status='verified'
      ))
    ) then raise exception 'opportunity_not_accessible'; end if;

    v_can_manage:=private.opportunity_user_can_manage(v_selected_opportunity,v_uid);
    v_can_evaluate:=private.opportunity_user_can_evaluate(v_selected_opportunity,v_uid);
    select o.organization_id into v_org_id from public.opportunities o where o.id=v_selected_opportunity;

    select jsonb_build_object(
      'id',o.id,'organization_id',o.organization_id,'organization_name',org.name_ar,'organization_verified',org.is_verified,
      'type',o.opportunity_type,'title',o.title,'description',o.description,'sport_code',o.sport_code,'age_category',o.age_category,
      'positions',o.positions,'city',o.city,'visibility',o.visibility,'status',o.status,'opens_at',o.opens_at,'closes_at',o.closes_at,
      'sports_event_id',o.sports_event_id,'event_starts_at',se.starts_at,'event_ends_at',se.ends_at,'event_status',se.status,
      'team_id',o.team_id,'team_name',t.name,'venue_id',o.venue_id,'venue_name',v.name,'capacity',o.capacity,
      'guardian_gate_required',o.guardian_gate_required,'requirements',o.requirements,'application_form',o.application_form,
      'evaluation_schema',o.evaluation_schema,'registration_fee_plan_id',o.registration_fee_plan_id,'is_demo',o.is_demo,
      'candidate_count',(select count(*) from public.opportunity_candidates c where c.opportunity_id=o.id and c.stage not in ('rejected','withdrawn'))
    ) into v_opportunity
    from public.opportunities o
    join public.organizations org on org.id=o.organization_id
    left join public.sports_events se on se.id=o.sports_event_id
    left join public.teams t on t.id=o.team_id
    left join public.venues v on v.id=o.venue_id
    where o.id=v_selected_opportunity;

    select coalesce(jsonb_agg(jsonb_build_object(
      'candidate_id',c.id,'athlete_id',c.athlete_id,'display_name',coalesce(p.display_name,p.name,p.handle),'handle',p.handle,
      'primary_position',ap.primary_position,'stage',c.stage,'eligibility_status',c.eligibility_status,'document_status',c.document_status,
      'check_in_status',c.check_in_status,'checked_in_at',c.checked_in_at,'final_score',c.final_score,'recommendation',c.recommendation,
      'application_snapshot',case when v_can_manage then c.application_snapshot else '{}'::jsonb end,
      'application_answers',case when v_can_manage then c.application_answers else '{}'::jsonb end,
      'approval_status',ar.status,'event_registration_id',c.event_registration_id,'created_at',c.created_at,'updated_at',c.updated_at,
      'is_self',(ap.user_id=v_uid),'is_guardian',exists(select 1 from public.guardianships g where g.athlete_id=c.athlete_id and g.guardian_user_id=v_uid and g.status='verified')
    ) order by case c.stage when 'offer' then 0 when 'trial' then 1 when 'shortlisted' then 2 when 'review' then 3 when 'applied' then 4 else 5 end,c.updated_at desc),'[]'::jsonb)
    into v_candidates
    from public.opportunity_candidates c
    join public.athlete_profiles ap on ap.id=c.athlete_id
    join public.profiles p on p.id=ap.user_id
    left join public.approval_requests ar on ar.id=c.approval_request_id
    where c.opportunity_id=v_selected_opportunity and (
      v_can_manage or v_can_evaluate or ap.user_id=v_uid
      or exists(select 1 from public.guardianships g where g.athlete_id=c.athlete_id and g.guardian_user_id=v_uid and g.status='verified')
    );
  end if;

  if v_selected_candidate is null then
    if v_can_manage or v_can_evaluate then
      select c.id into v_selected_candidate from public.opportunity_candidates c
      where c.opportunity_id=v_selected_opportunity
      order by case c.stage when 'offer' then 0 when 'trial' then 1 when 'shortlisted' then 2 when 'review' then 3 when 'applied' then 4 else 5 end,c.updated_at desc limit 1;
    elsif v_mode='player' then
      select c.id into v_selected_candidate from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.athlete_id=v_athlete_id limit 1;
    elsif v_mode='guardian' then
      select c.id into v_selected_candidate from public.opportunity_candidates c join public.guardianships g on g.athlete_id=c.athlete_id
      where c.opportunity_id=v_selected_opportunity and g.guardian_user_id=v_uid and g.status='verified'
      order by c.updated_at desc limit 1;
    end if;
  end if;

  if v_selected_candidate is not null then
    if not private.opportunity_user_can_read_candidate(v_selected_candidate,v_uid) then raise exception 'candidate_not_accessible'; end if;
    select exists(select 1 from public.athlete_profiles ap where ap.id=c.athlete_id and ap.user_id=v_uid),
           exists(select 1 from public.guardianships g where g.athlete_id=c.athlete_id and g.guardian_user_id=v_uid and g.status='verified')
      into v_is_owner,v_is_guardian from public.opportunity_candidates c where c.id=v_selected_candidate;

    select jsonb_build_object(
      'candidate_id',c.id,'opportunity_id',c.opportunity_id,'athlete_id',c.athlete_id,
      'user_id',ap.user_id,'display_name',coalesce(p.display_name,p.name,p.handle),'handle',p.handle,'city',p.city,
      'primary_position',ap.primary_position,'stage',c.stage,
      'eligibility_status',c.eligibility_status,'document_status',c.document_status,'check_in_status',c.check_in_status,
      'checked_in_at',c.checked_in_at,'evaluated_at',c.evaluated_at,'final_score',c.final_score,'recommendation',c.recommendation,
      'note',case when v_can_manage then c.note else null end,
      'application_snapshot',case when v_can_manage then c.application_snapshot else '{}'::jsonb end,
      'application_answers',case when v_can_manage then c.application_answers else '{}'::jsonb end,
      'approval_request_id',c.approval_request_id,'approval_status',ar.status,'event_registration_id',c.event_registration_id,
      'accepted_at',c.accepted_at,'withdrawn_at',c.withdrawn_at,'created_at',c.created_at,'updated_at',c.updated_at
    ) into v_candidate
    from public.opportunity_candidates c
    join public.athlete_profiles ap on ap.id=c.athlete_id
    join public.profiles p on p.id=ap.user_id
    left join public.approval_requests ar on ar.id=c.approval_request_id
    where c.id=v_selected_candidate;

    if v_can_manage or v_is_owner or v_is_guardian then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',d.id,'document_type',d.document_type,'title',d.title,
        'storage_path',case when v_can_manage or v_is_owner or v_is_guardian then d.storage_path else null end,
        'status',d.status,'visibility',d.visibility,'note',d.note,'reviewed_at',d.reviewed_at,'created_at',d.created_at
      ) order by d.created_at desc),'[]'::jsonb)
      into v_documents from public.opportunity_candidate_documents d where d.candidate_id=v_selected_candidate;
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'evaluation_id',e.id,'evaluator_user_id',e.evaluator_user_id,'evaluator_name',coalesce(ep.display_name,ep.name,ep.handle),
      'status',e.status,'recommendation',e.recommendation,'overall_score',e.overall_score,
      'athlete_summary',e.athlete_summary,'staff_note',case when v_can_manage or v_can_evaluate then e.staff_note else null end,
      'evidence',case when v_can_manage or v_can_evaluate then e.evidence else '{}'::jsonb end,
      'dimensions',coalesce((select jsonb_agg(jsonb_build_object('code',d.dimension_code,'label_ar',d.label_ar,'score',d.score,'weight',d.weight,
        'note',case when v_can_manage or v_can_evaluate then d.note else null end) order by d.dimension_code)
        from public.opportunity_evaluation_dimensions d where d.evaluation_id=e.id),'[]'::jsonb),
      'published_at',e.published_at,'updated_at',e.updated_at
    ) order by e.updated_at desc),'[]'::jsonb)
    into v_evaluations
    from public.opportunity_evaluations e left join public.profiles ep on ep.id=e.evaluator_user_id
    where e.candidate_id=v_selected_candidate and (v_can_manage or v_can_evaluate or e.status='published');

    select coalesce(jsonb_agg(jsonb_build_object(
      'offer_id',ao.id,'candidate_id',ao.candidate_id,'offer_type',ao.offer_type,'title',ao.title,'terms_summary',ao.terms_summary,
      'message',ao.message,'status',ao.status,'valid_until',ao.valid_until,'team_id',ao.team_id,'team_name',t.name,
      'approval_request_id',ao.approval_request_id,'approval_status',ar.status,'accepted_at',ao.accepted_at,'created_at',ao.created_at
    ) order by ao.created_at desc),'[]'::jsonb)
    into v_offers
    from public.athlete_offers ao left join public.teams t on t.id=ao.team_id left join public.approval_requests ar on ar.id=ao.approval_request_id
    where ao.candidate_id=v_selected_candidate and (v_can_manage or v_is_owner or v_is_guardian);

    select coalesce(jsonb_agg(jsonb_build_object(
      'admission_id',a.id,'status',a.status,'organization_id',a.organization_id,'team_id',a.team_id,'membership_id',a.membership_id,
      'invoice_id',a.invoice_id,'fee_plan_id',a.fee_plan_id,'accepted_at',a.accepted_at,'activated_at',a.activated_at,'metadata',a.metadata
    ) order by a.created_at desc),'[]'::jsonb)
    into v_admissions from public.opportunity_admissions a
    where a.candidate_id=v_selected_candidate and (v_can_manage or v_is_owner or v_is_guardian);
  end if;

  if v_mode='guardian' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'approval_id',a.id,'request_type',a.request_type,'status',a.status,'candidate_id',c.id,'candidate_stage',c.stage,
      'athlete_id',ap.id,'athlete_name',coalesce(p.display_name,p.name,p.handle),'opportunity_id',o.id,'title',o.title,
      'organization_name',org.name_ar,'offer_id',ao.id,'offer_title',ao.title,'offer_status',ao.status,'expires_at',a.expires_at,'created_at',a.created_at
    ) order by a.created_at),'[]'::jsonb)
    into v_guardian_requests
    from public.approval_requests a
    join public.athlete_profiles ap on ap.id=a.athlete_id join public.profiles p on p.id=ap.user_id
    left join public.opportunity_candidates c on c.id=nullif(a.payload->>'candidate_id','')::uuid
    left join public.opportunities o on o.id=coalesce(c.opportunity_id,nullif(a.payload->>'opportunity_id','')::uuid)
    left join public.organizations org on org.id=o.organization_id
    left join public.athlete_offers ao on ao.id=nullif(a.payload->>'offer_id','')::uuid
    where a.assigned_to_user_id=v_uid and a.status='pending' and a.request_type in ('trial','offer');
  end if;

  if v_can_manage and v_org_id is not null then
    select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'status',t.status) order by t.name),'[]'::jsonb)
      into v_teams from public.teams t where t.organization_id=v_org_id and t.status='active';
    select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'name',v.name,'city',v.city,'district',v.district) order by v.name),'[]'::jsonb)
      into v_venues from public.venues v where v.organization_id=v_org_id or v.is_public=true;
    select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'fee_type',f.fee_type,'amount',f.amount,'tax_rate',f.tax_rate,'currency',f.currency)
      order by f.name),'[]'::jsonb) into v_fee_plans
      from public.organization_fee_plans f where f.organization_id=v_org_id and f.status='active';
  end if;

  if v_selected_opportunity is not null then
    select jsonb_build_object(
      'total',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity),
      'applied',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='applied'),
      'review',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='review'),
      'shortlisted',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='shortlisted'),
      'trial',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='trial'),
      'checked_in',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.check_in_status='checked_in'),
      'evaluated',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.evaluated_at is not null),
      'offers',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='offer'),
      'accepted',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='accepted'),
      'waitlisted',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='waitlisted'),
      'rejected',(select count(*) from public.opportunity_candidates c where c.opportunity_id=v_selected_opportunity and c.stage='rejected'),
      'pending_guardian',(select count(*) from public.opportunity_candidates c join public.approval_requests a on a.id=c.approval_request_id where c.opportunity_id=v_selected_opportunity and a.status='pending')
    ) into v_stats;
  end if;

  return jsonb_build_object(
    'mode',v_mode,'identity',jsonb_build_object('user_id',v_uid,'display_name',coalesce(v_profile.display_name,v_profile.name,v_profile.handle),'role',v_profile.role,'athlete_id',v_athlete_id),
    'viewer',jsonb_build_object('can_manage',v_can_manage,'can_evaluate',v_can_evaluate,'is_owner',v_is_owner,'is_guardian',v_is_guardian),
    'opportunities',v_opportunities,'selected_opportunity_id',v_selected_opportunity,'opportunity',v_opportunity,
    'candidates',v_candidates,'selected_candidate_id',v_selected_candidate,'candidate',v_candidate,
    'documents',v_documents,'evaluations',v_evaluations,'offers',v_offers,'admissions',v_admissions,
    'guardian_requests',v_guardian_requests,'teams',v_teams,'venues',v_venues,'fee_plans',v_fee_plans,'stats',v_stats
  );
end $$;
