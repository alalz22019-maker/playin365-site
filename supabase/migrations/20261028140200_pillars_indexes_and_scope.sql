-- Query and foreign-key indexes for the pillars layer.
create index if not exists achievements_approved_by_idx on public.achievements(approved_by_user_id) where approved_by_user_id is not null;
create index if not exists achievements_created_by_idx on public.achievements(created_by_user_id);
create index if not exists entity_activity_actor_idx on public.entity_activity_events(actor_entity_id,occurred_at desc) where actor_entity_id is not null;
create index if not exists identity_pages_managed_by_idx on public.identity_pages(managed_by_user_id) where managed_by_user_id is not null;
create index if not exists responsibility_assignments_code_idx on public.organization_responsibility_assignments(responsibility_code,status);
create index if not exists responsibility_assignments_granted_by_idx on public.organization_responsibility_assignments(granted_by_user_id) where granted_by_user_id is not null;
create index if not exists workflow_routes_org_idx on public.organization_workflow_routes(organization_id) where organization_id is not null;
create index if not exists workflow_routes_responsibility_idx on public.organization_workflow_routes(responsibility_code,is_active);
create index if not exists workflow_routes_secondary_responsibility_idx on public.organization_workflow_routes(secondary_responsibility_code) where secondary_responsibility_code is not null;
create index if not exists workflow_routes_created_by_idx on public.organization_workflow_routes(created_by_user_id) where created_by_user_id is not null;
create index if not exists context_preferences_org_idx on public.user_context_preferences(active_organization_id) where active_organization_id is not null;
create index if not exists context_preferences_responsibility_idx on public.user_context_preferences(active_responsibility_code) where active_responsibility_code is not null;
create index if not exists work_item_events_actor_idx on public.work_item_events(actor_user_id,occurred_at desc) where actor_user_id is not null;
create index if not exists work_items_work_type_idx on public.work_items(work_type_code,status,created_at desc);
create index if not exists work_items_context_entity_idx on public.work_items(context_entity_id,status,created_at desc) where context_entity_id is not null;
create index if not exists work_items_event_entity_idx on public.work_items(event_entity_id,status,created_at desc) where event_entity_id is not null;
create index if not exists work_items_resolved_by_idx on public.work_items(resolved_by_user_id,resolved_at desc) where resolved_by_user_id is not null;
create index if not exists work_items_assigned_responsibility_idx on public.work_items(assigned_responsibility_code,status,due_at) where assigned_responsibility_code is not null;
create index if not exists work_items_secondary_responsibility_idx on public.work_items(secondary_responsibility_code,status,due_at) where secondary_responsibility_code is not null;

create or replace function public.pillar_entity_belongs_to_org(p_entity_id uuid,p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
 select exists(
   select 1
   from public.entities e
   where e.id=p_entity_id and (
     e.organization_id=p_organization_id
     or (e.profile_id is not null and exists(
       select 1 from public.organization_memberships m
       where m.organization_id=p_organization_id and m.user_id=e.profile_id and m.status='active'
     ))
     or (e.team_id is not null and exists(
       select 1 from public.teams t where t.id=e.team_id and t.organization_id=p_organization_id
     ))
     or (e.sports_event_id is not null and exists(
       select 1 from public.sports_events se
       where se.id=e.sports_event_id and se.organizer_organization_id=p_organization_id
     ))
     or (e.match_id is not null and exists(
       select 1 from public.matches ma
       where ma.id=e.match_id and (
         ma.home_team_id in (select t.id from public.teams t where t.organization_id=p_organization_id)
         or ma.away_team_id in (select t.id from public.teams t where t.organization_id=p_organization_id)
       )
     ))
     or (e.training_session_id is not null and exists(
       select 1 from public.training_sessions ts
       where ts.id=e.training_session_id and ts.organization_id=p_organization_id
     ))
   )
 )
$$;
revoke all on function public.pillar_entity_belongs_to_org(uuid,uuid) from public,anon,authenticated;
grant execute on function public.pillar_entity_belongs_to_org(uuid,uuid) to service_role;
