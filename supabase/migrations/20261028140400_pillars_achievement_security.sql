-- Ensure an organization achievement can only reference its own event and entities.
create or replace function public.create_my_achievement(
 p_source_organization_id uuid,p_source_event_entity_id uuid,p_achievement_type text,
 p_title text,p_description text,p_achieved_at timestamptz,p_visibility text default 'network',
 p_evidence jsonb default '{}'::jsonb,p_credits jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid();
 v_row public.achievements%rowtype;
 v_credit jsonb;
 v_credit_entity uuid;
 v_self_entity uuid;
 v_context_entity uuid;
 v_verified text:='pending';
 v_credit_count integer;
 v_distinct_credit_count integer;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_achievement_type not in (
   'championship','award','milestone','record','qualification','promotion',
   'selection','certification','project','other'
 ) then raise exception 'invalid_achievement_type'; end if;
 if char_length(trim(coalesce(p_title,''))) not between 2 and 240 then raise exception 'invalid_achievement_title'; end if;
 if p_achieved_at is null or p_achieved_at>now()+interval '1 day' then raise exception 'invalid_achievement_date'; end if;
 if p_visibility not in ('public','network','private') then raise exception 'invalid_visibility'; end if;
 if p_evidence is null or jsonb_typeof(p_evidence)<>'object'
    or p_credits is null or jsonb_typeof(p_credits)<>'array' then
   raise exception 'invalid_achievement_payload';
 end if;

 v_credit_count:=jsonb_array_length(p_credits);
 if v_credit_count<1 or v_credit_count>500 then raise exception 'achievement_credits_required'; end if;
 if exists(
   select 1 from jsonb_array_elements(p_credits) c
   where not (c ? 'entity_id')
      or (c->>'entity_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(nullif(c->>'credit_role',''),'participant') not in (
        'winner','participant','coach','staff','organization','team','organizer','issuer','contributor','other'
      )
      or coalesce(nullif(c->>'visibility',''),'inherit') not in ('inherit','public','network','private')
 ) then raise exception 'invalid_achievement_credit'; end if;
 select count(distinct (c->>'entity_id')::uuid)
 into v_distinct_credit_count
 from jsonb_array_elements(p_credits) c;
 if v_distinct_credit_count<>v_credit_count then raise exception 'duplicate_achievement_credit_entity'; end if;

 select id into v_self_entity from public.entities where profile_id=v_uid limit 1;
 if v_self_entity is null then raise exception 'personal_entity_not_found'; end if;

 if p_source_organization_id is not null then
   if not (
     public.organization_user_has_permission(p_source_organization_id,v_uid,'manage_profile')
     or public.organization_user_has_permission(p_source_organization_id,v_uid,'manage_events')
   ) then raise exception 'achievement_manage_denied'; end if;
   select id into v_context_entity
   from public.entities where organization_id=p_source_organization_id limit 1;
   if v_context_entity is null then raise exception 'organization_entity_not_found'; end if;
   if p_source_event_entity_id is not null
      and not public.pillar_entity_belongs_to_org(p_source_event_entity_id,p_source_organization_id) then
     raise exception 'achievement_event_outside_organization';
   end if;
   if exists(
     select 1 from jsonb_array_elements(p_credits) c
     where not public.pillar_entity_belongs_to_org((c->>'entity_id')::uuid,p_source_organization_id)
   ) then raise exception 'achievement_credit_outside_organization'; end if;
   v_verified:='verified';
 else
   if p_source_event_entity_id is not null and not exists(
     select 1 from public.entities e
     where e.id=p_source_event_entity_id
       and e.entity_type in ('event','match','training_session')
       and e.visibility in ('public','network')
   ) then raise exception 'personal_achievement_event_invalid'; end if;
   if v_credit_count<>1 or not exists(
     select 1 from jsonb_array_elements(p_credits) c
     where (c->>'entity_id')::uuid=v_self_entity
   ) then raise exception 'personal_achievement_must_credit_self'; end if;
 end if;

 insert into public.achievements(
   source_event_entity_id,source_organization_id,achievement_type,title,description,
   achieved_at,verification_status,visibility,evidence,created_by_user_id,
   approved_by_user_id,approved_at
 ) values(
   p_source_event_entity_id,p_source_organization_id,p_achievement_type,trim(p_title),
   nullif(trim(coalesce(p_description,'')),''),p_achieved_at,v_verified,p_visibility,p_evidence,v_uid,
   case when v_verified='verified' then v_uid else null end,
   case when v_verified='verified' then now() else null end
 ) returning * into v_row;

 for v_credit in select value from jsonb_array_elements(p_credits) loop
   v_credit_entity:=(v_credit->>'entity_id')::uuid;
   insert into public.achievement_credits(
     achievement_id,entity_id,credit_role,visibility,display_order,metadata,verified_at
   ) values(
     v_row.id,v_credit_entity,coalesce(nullif(v_credit->>'credit_role',''),'participant'),
     coalesce(nullif(v_credit->>'visibility',''),'inherit'),
     coalesce(nullif(v_credit->>'display_order','')::integer,100),
     coalesce(v_credit->'metadata','{}'::jsonb),
     case when v_verified='verified' then now() else null end
   );
   insert into public.entity_activity_events(
     event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,
     source_type,source_id,title,summary,visibility,verification_status,payload
   ) values(
     'achievement_recorded',v_self_entity,v_credit_entity,coalesce(v_context_entity,v_credit_entity),
     p_source_event_entity_id,'achievement',v_row.id,v_row.title,v_row.description,
     p_visibility,v_verified,jsonb_build_object(
       'achievement_type',p_achievement_type,
       'credit_role',coalesce(v_credit->>'credit_role','participant')
     )
   ) on conflict do nothing;
 end loop;
 return jsonb_build_object('changed',true,'achievement',to_jsonb(v_row));
end $$;

revoke all on function public.create_my_achievement(uuid,uuid,text,text,text,timestamptz,text,jsonb,jsonb) from public,anon;
grant execute on function public.create_my_achievement(uuid,uuid,text,text,text,timestamptz,text,jsonb,jsonb) to authenticated;
