create or replace function private.activate_opportunity_admission(
  p_offer_id uuid,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_offer public.athlete_offers%rowtype;
  v_c public.opportunity_candidates%rowtype;
  v_opp public.opportunities%rowtype;
  v_athlete public.athlete_profiles%rowtype;
  v_membership public.organization_memberships%rowtype;
  v_admission public.opportunity_admissions%rowtype;
  v_status text;
  v_person_entity uuid;
  v_org_entity uuid;
  v_event_entity uuid;
  v_existing_work uuid;
  v_old_membership_status text;
begin
  select * into v_offer from public.athlete_offers where id=p_offer_id for update;
  if not found then raise exception 'offer_not_found'; end if;
  select * into v_c from public.opportunity_candidates where id=v_offer.candidate_id for update;
  if not found then raise exception 'offer_candidate_required'; end if;
  select * into v_opp from public.opportunities where id=v_c.opportunity_id;
  select * into v_athlete from public.athlete_profiles where id=v_c.athlete_id;

  select * into v_membership
  from public.organization_memberships m
  where m.organization_id=v_opp.organization_id and m.user_id=v_athlete.user_id and m.role_code='player'
    and m.status in ('active','pending','suspended')
  order by case when m.status='active' then 0 when m.status='pending' then 1 else 2 end,m.created_at desc
  limit 1 for update;

  if not found then
    insert into public.organization_memberships(
      organization_id,user_id,role_code,status,starts_at,verification_status
    ) values(v_opp.organization_id,v_athlete.user_id,'player','active',current_date,'verified')
    returning * into v_membership;
    insert into public.organization_membership_events(
      membership_id,organization_id,user_id,actor_user_id,event_type,to_status,to_role_code,reason,metadata
    ) values(
      v_membership.id,v_opp.organization_id,v_athlete.user_id,p_actor_user_id,'opportunity_admission','active','player',
      'Accepted opportunity offer',jsonb_build_object('offer_id',v_offer.id,'candidate_id',v_c.id,'opportunity_id',v_opp.id)
    );
  elsif v_membership.status<>'active' then
    v_old_membership_status:=v_membership.status;
    update public.organization_memberships
      set status='active',verification_status='verified',starts_at=coalesce(starts_at,current_date),updated_at=now()
    where id=v_membership.id returning * into v_membership;
    insert into public.organization_membership_events(
      membership_id,organization_id,user_id,actor_user_id,event_type,from_status,to_status,from_role_code,to_role_code,reason,metadata
    ) values(
      v_membership.id,v_opp.organization_id,v_athlete.user_id,p_actor_user_id,'opportunity_admission',v_old_membership_status,'active','player','player',
      'Accepted opportunity offer',jsonb_build_object('offer_id',v_offer.id,'candidate_id',v_c.id,'opportunity_id',v_opp.id)
    );
  end if;

  if v_offer.team_id is not null then
    insert into public.team_athletes(team_id,athlete_id,primary_position,status,starts_at)
    values(v_offer.team_id,v_athlete.id,v_athlete.primary_position,'active',current_date)
    on conflict(team_id,athlete_id) do update set
      status='active',primary_position=coalesce(excluded.primary_position,public.team_athletes.primary_position),
      starts_at=coalesce(public.team_athletes.starts_at,current_date),ends_at=null;
  end if;

  v_status:=case when v_opp.registration_fee_plan_id is not null then 'pending_finance' else 'active' end;
  insert into public.opportunity_admissions(
    candidate_id,offer_id,opportunity_id,athlete_id,organization_id,team_id,membership_id,fee_plan_id,
    status,accepted_at,activated_at,activated_by_user_id,metadata
  ) values(
    v_c.id,v_offer.id,v_opp.id,v_athlete.id,v_opp.organization_id,v_offer.team_id,v_membership.id,v_opp.registration_fee_plan_id,
    v_status,now(),case when v_status='active' then now() else null end,case when v_status='active' then p_actor_user_id else null end,
    jsonb_build_object('source','golden_tryouts_opportunities','finance_required',v_opp.registration_fee_plan_id is not null)
  )
  on conflict(candidate_id) do update set
    offer_id=excluded.offer_id,team_id=excluded.team_id,membership_id=excluded.membership_id,fee_plan_id=excluded.fee_plan_id,
    status=case when public.opportunity_admissions.status='active' then 'active' else excluded.status end,
    accepted_at=coalesce(public.opportunity_admissions.accepted_at,excluded.accepted_at),updated_at=now(),metadata=excluded.metadata
  returning * into v_admission;

  update public.athlete_offers
     set status='accepted',accepted_at=coalesce(accepted_at,now()),decided_by_user_id=p_actor_user_id,updated_at=now()
   where id=v_offer.id returning * into v_offer;
  update public.opportunity_candidates
     set stage='accepted',accepted_at=coalesce(accepted_at,now()),updated_by_user_id=p_actor_user_id,updated_at=now()
   where id=v_c.id returning * into v_c;

  if v_c.event_registration_id is not null then
    update public.event_registrations
       set status=case when status='checked_in' then status else 'registered' end,
           attendance_verification_status=case when v_c.check_in_status='checked_in' then 'verified' else attendance_verification_status end,
           updated_at=now()
     where id=v_c.event_registration_id;
  end if;

  select e.id into v_person_entity from public.entities e where e.entity_type='person' and e.profile_id=v_athlete.user_id limit 1;
  select e.id into v_org_entity from public.entities e where e.entity_type='organization' and e.organization_id=v_opp.organization_id limit 1;
  select e.id into v_event_entity from public.entities e where e.entity_type='sports_event' and e.sports_event_id=v_opp.sports_event_id limit 1;
  if v_event_entity is not null and v_person_entity is not null then
    update public.entity_event_links
      set participation_role='selected_player',status='active',verification_status='verified',
          metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('candidate_stage','accepted','offer_id',v_offer.id,'admission_id',v_admission.id),updated_at=now()
      where event_entity_id=v_event_entity and entity_id=v_person_entity and source_type='opportunity_candidate' and source_id=v_c.id::text;
    if not found then
      insert into public.entity_event_links(event_entity_id,entity_id,participation_role,status,verification_status,source_type,source_id,metadata)
      values(v_event_entity,v_person_entity,'selected_player','active','verified','opportunity_admission',v_admission.id::text,
        jsonb_build_object('candidate_id',v_c.id,'offer_id',v_offer.id));
    end if;
  end if;

  if not exists(select 1 from public.entity_activity_events eae where eae.source_type='opportunity_admission' and eae.source_id=v_admission.id) then
    insert into public.entity_activity_events(
      event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload
    ) values(
      'opportunity_admitted',v_person_entity,v_person_entity,v_org_entity,v_event_entity,'opportunity_admission',v_admission.id,
      'تم قبول اللاعب في الجهة',v_opp.title,'network','verified',
      jsonb_build_object('organization_id',v_opp.organization_id,'team_id',v_offer.team_id,'candidate_id',v_c.id,'offer_id',v_offer.id,'finance_status',v_status)
    );
  end if;

  if v_status='pending_finance' then
    select wi.id into v_existing_work from public.work_items wi
    where wi.organization_id=v_opp.organization_id and wi.payload->>'admission_id'=v_admission.id::text
      and wi.status in ('pending','in_progress','waiting') limit 1;
    if v_existing_work is null then
      insert into public.work_items(
        organization_id,event_entity_id,work_type_code,title,description,status,priority,requested_by_user_id,
        assigned_responsibility_code,secondary_responsibility_code,decision_required,action_route,payload
      ) values(
        v_opp.organization_id,v_event_entity,'player_registration','إكمال رسوم قبول اللاعب',v_opp.title,'pending','high',p_actor_user_id,
        'finance','registration',true,'subscriptionPayment',
        jsonb_build_object('admission_id',v_admission.id,'candidate_id',v_c.id,'offer_id',v_offer.id,'membership_id',v_membership.id,'fee_plan_id',v_opp.registration_fee_plan_id)
      );
    end if;
  end if;

  insert into public.notifications(user_id,notification_type,title,body,data)
  values(v_athlete.user_id,'opportunity_admission',case when v_status='active' then 'تم تفعيل انضمامك' else 'تم قبولك — بانتظار إكمال الرسوم' end,
    v_opp.title,jsonb_build_object('admission_id',v_admission.id,'organization_id',v_opp.organization_id,'team_id',v_offer.team_id,'status',v_status));

  return jsonb_build_object('admission',to_jsonb(v_admission),'membership',to_jsonb(v_membership),'candidate',to_jsonb(v_c),'offer',to_jsonb(v_offer));
end $$;
revoke all on function private.activate_opportunity_admission(uuid,uuid) from public,anon,authenticated;

create or replace function public.my_athlete_opportunity_offer_decide(
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
  v_admission jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'invalid_decision'; end if;
  select ao.* into v_offer
  from public.athlete_offers ao join public.athlete_profiles ap on ap.id=ao.athlete_id
  where ao.id=p_offer_id and ap.user_id=v_uid for update of ao;
  if not found then raise exception 'offer_not_accessible'; end if;
  if v_offer.status<>'sent' then raise exception 'offer_not_actionable'; end if;
  if v_offer.valid_until is not null and v_offer.valid_until<=now() then
    update public.athlete_offers set status='expired',updated_at=now() where id=v_offer.id;
    update public.opportunity_candidates set stage='trial',updated_at=now() where id=v_offer.candidate_id and stage='offer';
    return jsonb_build_object('decided',false,'reason','offer_expired','offer_id',v_offer.id);
  end if;
  if v_offer.approval_request_id is not null then
    select * into v_approval from public.approval_requests where id=v_offer.approval_request_id;
    if not found or v_approval.status<>'approved' then raise exception 'guardian_approval_required'; end if;
  end if;

  if p_decision='rejected' then
    update public.athlete_offers set status='rejected',decided_by_user_id=v_uid,updated_at=now() where id=v_offer.id returning * into v_offer;
    update public.opportunity_candidates set stage='rejected',note=coalesce(nullif(btrim(coalesce(p_note,'')),''),note),updated_by_user_id=v_uid,updated_at=now()
      where id=v_offer.candidate_id;
    return jsonb_build_object('decided',true,'decision','rejected','offer',to_jsonb(v_offer),'contract_created',false,'affiliation_created',false);
  end if;

  v_admission:=private.activate_opportunity_admission(v_offer.id,v_uid);
  return jsonb_build_object('decided',true,'decision','accepted','offer',v_admission->'offer','candidate',v_admission->'candidate',
    'admission',v_admission->'admission','membership',v_admission->'membership','contract_created',false,'affiliation_created',true);
end $$;

create or replace function public.my_organization_opportunity_prepare_finance(
  p_admission_id uuid,
  p_due_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_a public.opportunity_admissions%rowtype;
  v_sub_result jsonb;
  v_invoice_result jsonb;
  v_subscription_id uuid;
  v_invoice_id uuid;
  v_billing_key text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_a from public.opportunity_admissions where id=p_admission_id for update;
  if not found then raise exception 'admission_not_found'; end if;
  if not public.organization_user_has_permission(v_a.organization_id,v_uid,'manage_finance') then raise exception 'manage_finance_required'; end if;
  if v_a.status<>'pending_finance' or v_a.fee_plan_id is null or v_a.membership_id is null then raise exception 'admission_finance_not_required'; end if;

  v_sub_result:=private.create_organization_subscription_v2(v_a.organization_id,v_a.fee_plan_id,v_a.membership_id,current_date,null,null);
  v_subscription_id:=nullif(v_sub_result->'subscription'->>'id','')::uuid;
  if v_subscription_id is null then raise exception 'admission_subscription_create_failed'; end if;
  v_billing_key:='admission-'||replace(v_a.id::text,'-','');
  v_invoice_result:=private.issue_subscription_invoice_v2(v_a.organization_id,v_subscription_id,v_billing_key,coalesce(p_due_at,now()+interval '7 days'));
  v_invoice_id:=nullif(v_invoice_result->'invoice'->>'id','')::uuid;
  if v_invoice_id is null then raise exception 'admission_invoice_create_failed'; end if;

  update public.opportunity_admissions
     set invoice_id=v_invoice_id,metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('subscription_id',v_subscription_id,'billing_period_key',v_billing_key),updated_at=now()
   where id=v_a.id returning * into v_a;
  update public.work_items set status='in_progress',updated_at=now()
   where payload->>'admission_id'=v_a.id::text and status in ('pending','waiting');
  return jsonb_build_object('prepared',true,'admission',to_jsonb(v_a),'subscription',v_sub_result->'subscription','invoice',v_invoice_result->'invoice');
end $$;

create or replace function public.my_organization_opportunity_admission_finalize(
  p_admission_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_a public.opportunity_admissions%rowtype;
  v_invoice public.invoices%rowtype;
  v_player_user uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_a from public.opportunity_admissions where id=p_admission_id for update;
  if not found then raise exception 'admission_not_found'; end if;
  if not (public.organization_user_has_permission(v_a.organization_id,v_uid,'manage_finance') or public.organization_user_has_permission(v_a.organization_id,v_uid,'manage_members')) then
    raise exception 'admission_finalize_denied';
  end if;
  if v_a.status='active' then return jsonb_build_object('changed',false,'admission',to_jsonb(v_a)); end if;
  if v_a.status<>'pending_finance' or v_a.invoice_id is null then raise exception 'admission_not_ready_for_finalize'; end if;
  select * into v_invoice from public.invoices where id=v_a.invoice_id;
  if not found or v_invoice.status<>'paid' then raise exception 'paid_invoice_required'; end if;

  update public.opportunity_admissions
     set status='active',activated_at=now(),activated_by_user_id=v_uid,updated_at=now()
   where id=v_a.id returning * into v_a;
  update public.work_items set status='completed',resolution=jsonb_build_object('admission_status','active','invoice_id',v_a.invoice_id),
    resolved_by_user_id=v_uid,resolved_at=now(),updated_at=now()
  where payload->>'admission_id'=v_a.id::text and status in ('pending','in_progress','waiting');
  select ap.user_id into v_player_user from public.athlete_profiles ap where ap.id=v_a.athlete_id;
  insert into public.notifications(user_id,notification_type,title,body,data)
  values(v_player_user,'opportunity_admission_activated','اكتمل تسجيلك وتفعيل انضمامك','تم اعتماد الدفع وإغلاق رحلة القبول',
    jsonb_build_object('admission_id',v_a.id,'organization_id',v_a.organization_id,'team_id',v_a.team_id,'invoice_id',v_a.invoice_id));
  return jsonb_build_object('changed',true,'admission',to_jsonb(v_a),'invoice',to_jsonb(v_invoice));
end $$;
