-- Harden responsibility assignment and work-item routing/decisions.
create or replace function public.set_my_organization_responsibility(
 p_organization_id uuid,p_target_handle text,p_responsibility_code text,
 p_status text default 'active',p_scope jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid();
 v_target uuid;
 v_row public.organization_responsibility_assignments%rowtype;
 v_actor_access text;
 v_target_access boolean;
 v_active_owners integer;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_members') then
   raise exception 'manage_members_required';
 end if;
 if p_status not in ('active','paused','revoked','ended') then raise exception 'invalid_responsibility_status'; end if;
 if p_scope is null or jsonb_typeof(p_scope)<>'object' then raise exception 'scope_must_be_object'; end if;
 if not exists(select 1 from public.organization_responsibility_catalog c where c.code=p_responsibility_code and c.is_active) then
   raise exception 'responsibility_not_found';
 end if;

 select a.access_role_code into v_actor_access
 from public.organization_access_assignments a
 where a.organization_id=p_organization_id and a.user_id=v_uid and a.status='active'
 order by case a.access_role_code when 'owner' then 1 when 'admin' then 2 else 3 end
 limit 1;

 if p_responsibility_code in ('owner','executive') and coalesce(v_actor_access,'')<>'owner' then
   raise exception 'owner_access_required';
 end if;
 if p_responsibility_code in ('academy_admin','finance','hr') and coalesce(v_actor_access,'') not in ('owner','admin') then
   raise exception 'organization_admin_required';
 end if;

 select id into v_target
 from public.profiles
 where lower(handle)=lower(trim(both '@' from coalesce(p_target_handle,'')))
 limit 1;
 if v_target is null then raise exception 'target_profile_not_found'; end if;
 v_target_access:=public.pillar_user_has_org_access(p_organization_id,v_target);
 if not v_target_access then raise exception 'target_not_in_organization'; end if;

 if p_status='active' then
   insert into public.organization_responsibility_assignments(
     organization_id,user_id,responsibility_code,status,scope,granted_by_user_id
   ) values(
     p_organization_id,v_target,p_responsibility_code,'active',p_scope,v_uid
   )
   on conflict(organization_id,user_id,responsibility_code) where status='active'
   do update set scope=excluded.scope,updated_at=now(),granted_by_user_id=v_uid
   returning * into v_row;
 else
   if p_responsibility_code='owner' then
     select count(*) into v_active_owners
     from public.organization_responsibility_assignments r
     where r.organization_id=p_organization_id
       and r.responsibility_code='owner'
       and r.status='active'
       and r.user_id<>v_target;
     if v_active_owners=0 then raise exception 'last_owner_responsibility_required'; end if;
   end if;
   update public.organization_responsibility_assignments
   set status=p_status,updated_at=now(),ends_at=coalesce(ends_at,now()),granted_by_user_id=v_uid
   where organization_id=p_organization_id and user_id=v_target
     and responsibility_code=p_responsibility_code and status='active'
   returning * into v_row;
   if not found then raise exception 'responsibility_assignment_not_found'; end if;
 end if;
 return jsonb_build_object('changed',true,'assignment',to_jsonb(v_row));
end $$;

create or replace function public.create_my_work_item(
 p_organization_id uuid,p_work_type_code text,p_title text,p_description text default null,
 p_context_entity_id uuid default null,p_event_entity_id uuid default null,
 p_assigned_to_user_id uuid default null,p_assigned_responsibility_code text default null,
 p_priority text default null,p_due_at timestamptz default null,
 p_action_route text default null,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid();
 v_catalog public.work_type_catalog%rowtype;
 v_resp text;
 v_secondary text;
 v_priority text;
 v_due timestamptz;
 v_amount numeric;
 v_row public.work_items%rowtype;
 v_actor_entity uuid;
 v_context_entity uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if char_length(trim(coalesce(p_title,''))) not between 2 and 240 then raise exception 'invalid_work_title'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'payload_must_be_object'; end if;
 select * into v_catalog from public.work_type_catalog where code=p_work_type_code and is_active;
 if not found then raise exception 'work_type_not_found'; end if;

 if p_organization_id is not null then
   if not public.pillar_user_has_org_access(p_organization_id,v_uid) then raise exception 'organization_access_denied'; end if;
   if p_assigned_to_user_id is not null and not public.pillar_user_has_org_access(p_organization_id,p_assigned_to_user_id) then
     raise exception 'assignee_not_in_organization';
   end if;
   if p_context_entity_id is not null and not public.pillar_entity_belongs_to_org(p_context_entity_id,p_organization_id) then
     raise exception 'context_entity_outside_organization';
   end if;
   if p_event_entity_id is not null and not public.pillar_entity_belongs_to_org(p_event_entity_id,p_organization_id) then
     raise exception 'event_entity_outside_organization';
   end if;
 else
   if p_assigned_to_user_id is not null and p_assigned_to_user_id<>v_uid then raise exception 'personal_task_assignee_invalid'; end if;
   if p_assigned_responsibility_code is not null then raise exception 'personal_task_responsibility_invalid'; end if;
   if p_context_entity_id is not null and not exists(
     select 1 from public.entities e where e.id=p_context_entity_id and e.profile_id=v_uid
   ) then raise exception 'personal_context_entity_invalid'; end if;
   if p_event_entity_id is not null then raise exception 'personal_event_entity_invalid'; end if;
 end if;

 v_amount:=case when (p_payload->>'amount') ~ '^[0-9]+([.][0-9]+)?$' then (p_payload->>'amount')::numeric else null end;
 select r.responsibility_code,r.secondary_responsibility_code into v_resp,v_secondary
 from public.organization_workflow_routes r
 where r.is_active and r.work_type_code=p_work_type_code
   and (r.organization_id=p_organization_id or r.organization_id is null)
   and (r.min_amount is null or v_amount is null or v_amount>=r.min_amount)
   and (r.max_amount is null or v_amount is null or v_amount<=r.max_amount)
 order by case when r.organization_id=p_organization_id then 0 else 1 end,r.priority
 limit 1;

 v_resp:=case when p_organization_id is null then null
   else coalesce(nullif(p_assigned_responsibility_code,''),v_resp,v_catalog.default_responsibility_code) end;
 v_priority:=coalesce(nullif(p_priority,''),v_catalog.default_priority);
 if v_priority not in ('low','normal','high','critical') then raise exception 'invalid_priority'; end if;
 if v_resp is not null and not exists(
   select 1 from public.organization_responsibility_catalog c where c.code=v_resp and c.is_active
 ) then raise exception 'responsibility_not_found'; end if;
 v_due:=coalesce(p_due_at,case when v_catalog.default_sla_hours is not null
   then now()+make_interval(hours=>v_catalog.default_sla_hours) else null end);

 if p_context_entity_id is not null then v_context_entity:=p_context_entity_id;
 elsif p_organization_id is not null then
   select id into v_context_entity from public.entities where organization_id=p_organization_id limit 1;
 else
   select id into v_context_entity from public.entities where profile_id=v_uid limit 1;
 end if;
 if v_context_entity is null then raise exception 'context_entity_not_found'; end if;

 insert into public.work_items(
   organization_id,context_entity_id,event_entity_id,work_type_code,title,description,status,priority,
   requested_by_user_id,assigned_to_user_id,assigned_responsibility_code,secondary_responsibility_code,
   decision_required,due_at,action_route,payload
 ) values(
   p_organization_id,v_context_entity,p_event_entity_id,p_work_type_code,trim(p_title),
   nullif(trim(coalesce(p_description,'')),''),'pending',v_priority,v_uid,p_assigned_to_user_id,
   v_resp,v_secondary,v_catalog.decision_required,v_due,nullif(trim(coalesce(p_action_route,'')),''),p_payload
 ) returning * into v_row;

 insert into public.work_item_events(work_item_id,event_type,actor_user_id,to_status,note,metadata)
 values(v_row.id,'created',v_uid,'pending','تم إنشاء الطلب',jsonb_build_object('responsibility',v_resp));
 select id into v_actor_entity from public.entities where profile_id=v_uid limit 1;
 insert into public.entity_activity_events(
   event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,
   title,summary,visibility,verification_status,payload
 ) values(
   'work_item_created',v_actor_entity,coalesce(v_context_entity,v_actor_entity),v_context_entity,
   p_event_entity_id,'work_item',v_row.id,v_row.title,v_row.description,'private','verified',
   jsonb_build_object('work_type',p_work_type_code,'priority',v_priority,'status','pending')
 );
 return jsonb_build_object('changed',true,'work_item',to_jsonb(v_row));
end $$;

create or replace function public.act_my_work_item(
 p_work_item_id uuid,p_action text,p_note text default null,p_resolution jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid();
 v_row public.work_items%rowtype;
 v_from text;
 v_to text;
 v_is_requester boolean:=false;
 v_is_assignee boolean:=false;
 v_is_responsible boolean:=false;
 v_is_manager boolean:=false;
 v_can_action boolean:=false;
 v_actor_entity uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_resolution is null or jsonb_typeof(p_resolution)<>'object' then raise exception 'resolution_must_be_object'; end if;
 select * into v_row from public.work_items where id=p_work_item_id for update;
 if not found then raise exception 'work_item_not_found'; end if;

 v_is_requester:=coalesce(v_row.requested_by_user_id=v_uid,false);
 v_is_assignee:=coalesce(v_row.assigned_to_user_id=v_uid,false);
 v_is_responsible:=coalesce(v_row.organization_id is not null and exists(
   select 1 from public.organization_responsibility_assignments r
   where r.organization_id=v_row.organization_id and r.user_id=v_uid and r.status='active'
     and r.responsibility_code in (v_row.assigned_responsibility_code,v_row.secondary_responsibility_code)
     and (r.starts_at is null or r.starts_at<=now())
     and (r.ends_at is null or r.ends_at>=now())
 ),false);
 v_is_manager:=coalesce(v_row.organization_id is not null and exists(
   select 1 from public.organization_access_assignments a
   where a.organization_id=v_row.organization_id and a.user_id=v_uid and a.status='active'
     and a.access_role_code in ('owner','admin')
 ),false);

 if p_action in ('approve','reject') then
   v_can_action:=coalesce(v_is_assignee,false) or coalesce(v_is_responsible,false) or coalesce(v_is_manager,false);
 elsif p_action in ('start','wait','complete') then
   v_can_action:=coalesce(v_is_assignee,false) or coalesce(v_is_responsible,false) or coalesce(v_is_manager,false)
     or (v_row.organization_id is null and coalesce(v_is_requester,false));
 elsif p_action in ('cancel','reopen') then
   v_can_action:=coalesce(v_is_requester,false) or coalesce(v_is_assignee,false)
     or coalesce(v_is_responsible,false) or coalesce(v_is_manager,false);
 else
   raise exception 'invalid_work_item_action';
 end if;
 if coalesce(v_can_action,false)=false then raise exception 'work_item_action_denied'; end if;
 if p_action in ('approve','reject') and not v_row.decision_required then raise exception 'decision_not_required'; end if;
 if v_row.status in ('approved','rejected','completed','cancelled','expired') and p_action<>'reopen' then raise exception 'work_item_final_state'; end if;
 if p_action='reopen' and v_row.status not in ('approved','rejected','completed','cancelled','expired') then raise exception 'work_item_not_final'; end if;
 if p_action='start' and v_row.status not in ('pending','waiting') then raise exception 'invalid_work_item_transition'; end if;
 if p_action in ('approve','reject') and v_row.status not in ('pending','in_progress','waiting') then raise exception 'invalid_work_item_transition'; end if;
 if p_action='complete' and v_row.status not in ('pending','in_progress','waiting','approved') then raise exception 'invalid_work_item_transition'; end if;
 if p_action='wait' and v_row.status not in ('pending','in_progress') then raise exception 'invalid_work_item_transition'; end if;

 v_from:=v_row.status;
 v_to:=case p_action
   when 'start' then 'in_progress' when 'wait' then 'waiting' when 'approve' then 'approved'
   when 'reject' then 'rejected' when 'complete' then 'completed' when 'cancel' then 'cancelled'
   when 'reopen' then 'pending' end;

 update public.work_items set
   status=v_to,
   resolution=case when p_action in ('approve','reject','complete','cancel') then p_resolution else resolution end,
   resolved_by_user_id=case when p_action in ('approve','reject','complete','cancel') then v_uid else null end,
   resolved_at=case when p_action in ('approve','reject','complete','cancel') then now() else null end,
   updated_at=now()
 where id=p_work_item_id returning * into v_row;

 insert into public.work_item_events(work_item_id,event_type,actor_user_id,from_status,to_status,note,metadata)
 values(
   v_row.id,
   case p_action when 'start' then 'started' when 'wait' then 'updated' when 'approve' then 'approved'
     when 'reject' then 'rejected' when 'complete' then 'completed' when 'cancel' then 'cancelled' else 'reopened' end,
   v_uid,v_from,v_to,nullif(trim(coalesce(p_note,'')),''),p_resolution
 );
 select id into v_actor_entity from public.entities where profile_id=v_uid limit 1;
 insert into public.entity_activity_events(
   event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,
   title,summary,visibility,verification_status,payload
 ) values(
   'work_item_'||p_action,v_actor_entity,v_row.context_entity_id,v_row.context_entity_id,
   v_row.event_entity_id,'work_item',v_row.id,v_row.title,nullif(trim(coalesce(p_note,'')),''),
   'private','verified',jsonb_build_object('from_status',v_from,'to_status',v_to,'resolution',p_resolution)
 ) on conflict do nothing;
 return jsonb_build_object('changed',true,'work_item',to_jsonb(v_row));
end $$;

revoke all on function public.set_my_organization_responsibility(uuid,text,text,text,jsonb) from public,anon;
revoke all on function public.create_my_work_item(uuid,text,text,text,uuid,uuid,uuid,text,text,timestamptz,text,jsonb) from public,anon;
revoke all on function public.act_my_work_item(uuid,text,text,jsonb) from public,anon;
grant execute on function public.set_my_organization_responsibility(uuid,text,text,text,jsonb) to authenticated;
grant execute on function public.create_my_work_item(uuid,text,text,text,uuid,uuid,uuid,text,text,timestamptz,text,jsonb) to authenticated;
grant execute on function public.act_my_work_item(uuid,text,text,jsonb) to authenticated;
