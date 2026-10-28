-- Context-aware home queues and event credit for the three-pillar foundation.
create or replace function public.my_three_pillars_home(
  p_context_type text default null,
  p_organization_id uuid default null,
  p_responsibility_code text default null
) returns jsonb
language plpgsql
stable security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_base jsonb;
  v_type text;
  v_org uuid;
  v_resp text;
  v_decisions jsonb:='[]'::jsonb;
  v_approvals jsonb:='[]'::jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_base:=public.my_unified_home(p_context_type,p_organization_id,p_responsibility_code);
  v_type:=coalesce(v_base->'context'->>'context_type','personal');
  v_org:=nullif(v_base->'context'->>'organization_id','')::uuid;
  v_resp:=nullif(v_base->'context'->>'responsibility_code','');

  select coalesce(jsonb_agg(d.item order by
    case d.item->>'priority' when 'critical' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,
    nullif(d.item->>'due_at','')::timestamptz nulls last,
    nullif(d.item->>'created_at','')::timestamptz desc nulls last
  ),'[]'::jsonb)
  into v_decisions
  from jsonb_array_elements(coalesce(v_base->'decisions','[]'::jsonb)) d(item)
  join public.work_items w on w.id=(d.item->>'id')::uuid
  where case
    when v_type='organization' then
      w.organization_id=v_org and (
        (w.assigned_to_user_id=v_uid and (w.assigned_responsibility_code is null or w.assigned_responsibility_code=v_resp))
        or w.assigned_responsibility_code=v_resp
        or (w.assigned_to_user_id is null and w.assigned_responsibility_code is null and v_resp in ('owner','executive','academy_admin'))
      )
    else
      w.assigned_to_user_id=v_uid or (w.organization_id is null and w.requested_by_user_id=v_uid)
  end;

  select coalesce(jsonb_agg(a.item order by
    nullif(a.item->>'expires_at','')::timestamptz nulls last,
    nullif(a.item->>'created_at','')::timestamptz desc nulls last
  ),'[]'::jsonb)
  into v_approvals
  from jsonb_array_elements(coalesce(v_base->'approvals','[]'::jsonb)) a(item)
  join public.approval_requests ar on ar.id=(a.item->>'id')::uuid
  where case
    when v_type='organization' then
      ar.related_organization_id=v_org and (
        ar.assigned_to_user_id=v_uid
        or (ar.assigned_to_user_id is null and v_resp in ('owner','executive','academy_admin'))
      )
    else
      ar.assigned_to_user_id=v_uid
      or (ar.related_organization_id is null and ar.requested_by_user_id=v_uid)
  end;

  v_base:=jsonb_set(v_base,'{decisions}',v_decisions,true);
  v_base:=jsonb_set(v_base,'{approvals}',v_approvals,true);
  if v_type='organization' then
    v_base:=jsonb_set(v_base,'{metrics,pending_decisions}',to_jsonb(jsonb_array_length(v_decisions)+jsonb_array_length(v_approvals)),true);
  else
    v_base:=jsonb_set(v_base,'{metrics,pending_actions}',to_jsonb(jsonb_array_length(v_decisions)+jsonb_array_length(v_approvals)),true);
  end if;
  return v_base;
end $$;

revoke all on function public.my_three_pillars_home(text,uuid,text) from public,anon;
grant execute on function public.my_three_pillars_home(text,uuid,text) to authenticated;
comment on function public.my_three_pillars_home(text,uuid,text) is 'Context-aware home projection: personal work is separated from organization responsibility queues, while requester history stays in the inbox.';

insert into public.achievement_credits(achievement_id,entity_id,credit_role,visibility,display_order,metadata,verified_at)
select '00000000-0000-4000-8000-00000000a301'::uuid,e.id,'other','public',5,
       jsonb_build_object('source','three_pillars_foundation','demo_workspace',true,'entity_role','event'),now()
from public.entities e
where e.sports_event_id='00000000-0000-4000-8000-00000000f301'::uuid
on conflict(achievement_id,entity_id,credit_role) do update set visibility='public',metadata=excluded.metadata,verified_at=now();
