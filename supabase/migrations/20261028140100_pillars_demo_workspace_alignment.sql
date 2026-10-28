-- Align only the isolated @demo.playin365.app workspace so academy, coach and player
-- share one organization context. This migration does not grant access to real accounts.
do $$
declare
 v_org uuid:='22b027e1-c13e-4bd9-9e8e-e7b42200dc8f'::uuid;
 v_coach uuid:='70080a99-1a96-43d1-8a53-75a9efe10ae4'::uuid;
 v_player uuid:='89a89d4d-6792-48ff-9017-086532d128b0'::uuid;
 v_player_entity uuid;
begin
 if not exists(select 1 from auth.users where id=v_coach and email='coach@demo.playin365.app')
    or not exists(select 1 from auth.users where id=v_player and email='player@demo.playin365.app')
    or not exists(select 1 from public.organizations where id=v_org and is_demo=true) then
   raise exception 'demo_workspace_not_available';
 end if;

 update public.profiles
 set name='عبدالله المطيري',role='coach',org='أكاديمية النخبة',updated_at=now()
 where id=v_coach;
 update public.profiles
 set name='سعود القحطاني',role='player',org='أكاديمية النخبة',pos=coalesce(pos,'مهاجم'),updated_at=now()
 where id=v_player;

 update public.entities set canonical_name='عبدالله المطيري',updated_at=now() where profile_id=v_coach;
 insert into public.entities(entity_type,profile_id,canonical_name,sport_code,status,visibility,metadata)
 values('person',v_player,'سعود القحطاني','football','active','private','{"source":"demo_workspace_alignment"}'::jsonb)
 on conflict(profile_id) where profile_id is not null do update
 set canonical_name=excluded.canonical_name,
     sport_code=coalesce(public.entities.sport_code,excluded.sport_code),
     updated_at=now()
 returning id into v_player_entity;

 insert into public.organization_memberships(organization_id,user_id,role_code,status,starts_at,verification_status)
 values(v_org,v_coach,'coach','active',current_date,'verified')
 on conflict(organization_id,user_id,role_code) where status='active' do nothing;
 insert into public.organization_memberships(organization_id,user_id,role_code,status,starts_at,verification_status)
 values(v_org,v_player,'player','active',current_date,'verified')
 on conflict(organization_id,user_id,role_code) where status='active' do nothing;

 insert into public.organization_responsibility_assignments(organization_id,user_id,responsibility_code,status,scope)
 values(v_org,v_coach,'coach','active','{"source":"demo_workspace_alignment","team_id":"39e4cb3e-4c42-4695-8b01-feda25206121"}'::jsonb)
 on conflict(organization_id,user_id,responsibility_code) where status='active'
 do update set scope=excluded.scope,updated_at=now();

 update public.teams
 set head_coach_user_id=v_coach,updated_at=now()
 where id='39e4cb3e-4c42-4695-8b01-feda25206121'::uuid
   and organization_id=v_org
   and head_coach_user_id is null;

 insert into public.identity_pages(
   entity_id,public_slug,geometry_orientation,headline_ar,visibility,
   verification_status,managed_by_user_id,sections,theme
 )
 select e.id,'person-'||left(e.id::text,8),public.pillar_entity_orientation(e.id),
        coalesce(p.pos,p.role),'private','unverified',p.id,'{}'::jsonb,
        jsonb_build_object('orientation',public.pillar_entity_orientation(e.id),'source','approved_geometry')
 from public.entities e
 join public.profiles p on p.id=e.profile_id
 where p.id in (v_coach,v_player)
 on conflict(entity_id) do update
 set geometry_orientation=public.pillar_entity_orientation(excluded.entity_id),
     headline_ar=excluded.headline_ar,
     managed_by_user_id=excluded.managed_by_user_id,
     updated_at=now();
end $$;
