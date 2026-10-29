create or replace function public.pi_my_orgs()
returns setof uuid
language sql
stable
security definer
set search_path=''
as $$
  select organization_id
  from public.organization_memberships
  where user_id=auth.uid() and status='active'
$$;

alter function public.my_organization_workspace(uuid) set search_path='';
alter function public.my_organization_erp_workspace(uuid) set search_path='';

revoke all on function public.pi_my_orgs() from public,anon;
revoke all on function public.my_organization_workspace(uuid) from public,anon;
revoke all on function public.my_organization_erp_workspace(uuid) from public,anon;

grant execute on function public.pi_my_orgs() to authenticated;
grant execute on function public.my_organization_workspace(uuid) to authenticated;
grant execute on function public.my_organization_erp_workspace(uuid) to authenticated;

comment on function public.pi_my_orgs() is 'Returns the signed-in user active organization ids; anonymous execution is forbidden and the search path is pinned.';
