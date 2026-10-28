-- Golden Match Day complete migration bundle
-- Exported from applied Supabase migration history to keep GitHub and production aligned.

-- MIGRATION 20261028211430 golden_match_day_schema
-- Golden Match Day — additive schema foundation
alter table public.matches
  add column if not exists created_by_user_id uuid,
  add column if not exists assigned_coach_user_id uuid,
  add column if not exists organizer_organization_id uuid,
  add column if not exists match_brief jsonb not null default '{}'::jsonb,
  add column if not exists published_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists version integer not null default 1,
  add column if not exists visibility text not null default 'network';

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.matches'::regclass and conname='matches_created_by_user_id_fkey') then
    alter table public.matches add constraint matches_created_by_user_id_fkey foreign key(created_by_user_id) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.matches'::regclass and conname='matches_assigned_coach_user_id_fkey') then
    alter table public.matches add constraint matches_assigned_coach_user_id_fkey foreign key(assigned_coach_user_id) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.matches'::regclass and conname='matches_organizer_organization_id_fkey') then
    alter table public.matches add constraint matches_organizer_organization_id_fkey foreign key(organizer_organization_id) references public.organizations(id) on delete set null;
  end if;
end $$;

alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check check(status = any(array[
  'open','today','scheduled','live','in_progress','final','completed','cancelled','postponed'
]));
alter table public.matches drop constraint if exists matches_visibility_check;
alter table public.matches add constraint matches_visibility_check check(visibility = any(array['public','network','private']));
alter table public.matches drop constraint if exists matches_version_check;
alter table public.matches add constraint matches_version_check check(version between 1 and 1000000);

alter table public.match_plans
  add column if not exists published_at timestamptz,
  add column if not exists version integer not null default 1,
  add column if not exists updated_by_user_id uuid,
  add column if not exists formation_data jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.match_plans'::regclass and conname='match_plans_updated_by_user_id_fkey') then
    alter table public.match_plans add constraint match_plans_updated_by_user_id_fkey foreign key(updated_by_user_id) references auth.users(id) on delete set null;
  end if;
end $$;

alter table public.match_plans drop constraint if exists match_plans_status_check;
alter table public.match_plans add constraint match_plans_status_check check(status = any(array['draft','approved','published','completed','archived']));
alter table public.match_plans drop constraint if exists match_plans_version_check;
alter table public.match_plans add constraint match_plans_version_check check(version between 1 and 1000000);

alter table public.match_plan_players
  add column if not exists position_x numeric,
  add column if not exists position_y numeric,
  add column if not exists sort_order integer not null default 0;

alter table public.match_plan_players drop constraint if exists match_plan_players_position_x_check;
alter table public.match_plan_players add constraint match_plan_players_position_x_check check(position_x is null or position_x between 0 and 100);
alter table public.match_plan_players drop constraint if exists match_plan_players_position_y_check;
alter table public.match_plan_players add constraint match_plan_players_position_y_check check(position_y is null or position_y between 0 and 100);
alter table public.match_plan_players drop constraint if exists match_plan_players_sort_order_check;
alter table public.match_plan_players add constraint match_plan_players_sort_order_check check(sort_order between 0 and 100);

create table if not exists public.match_readiness_checkins(
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  sleep_hours numeric not null,
  sleep_quality integer not null,
  fatigue_level integer not null,
  fuel_level integer not null,
  pain_flag boolean not null default false,
  readiness_score integer not null,
  readiness_state text not null,
  private_note text,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id,athlete_id),
  constraint match_readiness_sleep_hours_check check(sleep_hours between 0 and 16),
  constraint match_readiness_sleep_quality_check check(sleep_quality between 1 and 5),
  constraint match_readiness_fatigue_check check(fatigue_level between 1 and 5),
  constraint match_readiness_fuel_check check(fuel_level between 1 and 5),
  constraint match_readiness_score_check check(readiness_score between 0 and 100),
  constraint match_readiness_state_check check(readiness_state = any(array['ready','limited','unavailable','follow_up']))
);

alter table public.match_readiness_checkins enable row level security;
revoke all on public.match_readiness_checkins from anon,authenticated;
grant select,insert,update,delete on public.match_readiness_checkins to service_role;

create index if not exists match_readiness_match_idx on public.match_readiness_checkins(match_id,readiness_state);
create index if not exists match_readiness_athlete_idx on public.match_readiness_checkins(athlete_id,updated_at desc);
create index if not exists matches_organization_starts_idx on public.matches(organizer_organization_id,starts_at desc) where organizer_organization_id is not null;
create index if not exists matches_home_starts_idx on public.matches(home_team_id,starts_at desc) where home_team_id is not null;
create index if not exists matches_away_starts_idx on public.matches(away_team_id,starts_at desc) where away_team_id is not null;
create unique index if not exists sports_events_source_match_uq on public.sports_events(source_match_id) where source_match_id is not null;
create unique index if not exists performance_metrics_match_metric_uq on public.performance_metrics(match_id,athlete_id,metric_code) where match_id is not null;

comment on table public.match_readiness_checkins is 'Private pre-match readiness reported by the athlete; only aggregated state and score are exposed to authorized staff.';
comment on column public.match_plan_players.position_x is 'Horizontal pitch coordinate from 0 to 100 for the published lineup.';
comment on column public.match_plan_players.position_y is 'Vertical pitch coordinate from 0 to 100 for the published lineup.';

-- MIGRATION 20261028211517 golden_match_day_core
-- Golden Match Day — core access, creation and index
create or replace function public.match_day_athlete_id(p_user_id uuid)
returns uuid
language sql
stable security definer
set search_path=''
as $$ select ap.id from public.athlete_profiles ap where ap.user_id=p_user_id limit 1 $$;

create or replace function public.match_day_can_manage_team(p_team_id uuid,p_user_id uuid)
returns boolean
language sql
stable security definer
set search_path=''
as $$
  select public.training_day_can_manage_team(p_team_id,p_user_id)
    or exists(
      select 1 from public.teams t
      where t.id=p_team_id and public.technical_has_permission(p_user_id,'match_plan.manage',t.organization_id,t.id,null,'team',t.id)
    )
$$;

create or replace function public.match_day_team_for_user(p_match_id uuid,p_user_id uuid,p_organization_id uuid default null)
returns uuid
language plpgsql
stable security definer
set search_path=''
as $$
declare
  v_match public.matches%rowtype;
  v_athlete uuid;
  v_team uuid;
begin
  select * into v_match from public.matches where id=p_match_id;
  if not found then return null; end if;
  v_athlete:=public.match_day_athlete_id(p_user_id);
  if v_athlete is not null then
    select t.id into v_team
    from public.teams t
    join public.team_athletes ta on ta.team_id=t.id and ta.athlete_id=v_athlete and ta.status='active'
    where t.id in (v_match.home_team_id,v_match.away_team_id)
    order by case when t.id=v_match.home_team_id then 0 else 1 end
    limit 1;
    if v_team is not null then return v_team; end if;
  end if;
  if p_organization_id is not null then
    select t.id into v_team
    from public.teams t
    where t.id in (v_match.home_team_id,v_match.away_team_id)
      and t.organization_id=p_organization_id
      and public.match_day_can_manage_team(t.id,p_user_id)
    order by case when t.id=v_match.home_team_id then 0 else 1 end
    limit 1;
    if v_team is not null then return v_team; end if;
  end if;
  select t.id into v_team
  from public.teams t
  where t.id in (v_match.home_team_id,v_match.away_team_id)
    and public.match_day_can_manage_team(t.id,p_user_id)
  order by case when v_match.assigned_coach_user_id=p_user_id and t.head_coach_user_id=p_user_id then 0 else 1 end,
           case when t.id=v_match.home_team_id then 0 else 1 end
  limit 1;
  return v_team;
end $$;

create or replace function public.match_day_can_manage_match(p_match_id uuid,p_user_id uuid,p_team_id uuid default null)
returns boolean
language sql
stable security definer
set search_path=''
as $$
  select exists(
    select 1 from public.matches m
    where m.id=p_match_id and (
      m.assigned_coach_user_id=p_user_id
      or (p_team_id is not null and p_team_id in (m.home_team_id,m.away_team_id) and public.match_day_can_manage_team(p_team_id,p_user_id))
      or (p_team_id is null and (
        (m.home_team_id is not null and public.match_day_can_manage_team(m.home_team_id,p_user_id))
        or (m.away_team_id is not null and public.match_day_can_manage_team(m.away_team_id,p_user_id))
      ))
      or (m.organizer_organization_id is not null and (
        public.organization_user_has_permission(m.organizer_organization_id,p_user_id,'manage_events')
        or exists(
          select 1 from public.organization_responsibility_assignments r
          where r.organization_id=m.organizer_organization_id and r.user_id=p_user_id and r.status='active'
            and r.responsibility_code in ('owner','executive','academy_admin','operations','coach')
            and (r.starts_at is null or r.starts_at<=now()) and (r.ends_at is null or r.ends_at>=now())
        )
      ))
    )
  )
$$;

create or replace function public.match_day_is_match_athlete(p_match_id uuid,p_user_id uuid)
returns boolean
language sql
stable security definer
set search_path=''
as $$
  select exists(
    select 1 from public.matches m
    join public.team_athletes ta on ta.team_id in (m.home_team_id,m.away_team_id) and ta.status='active'
    join public.athlete_profiles ap on ap.id=ta.athlete_id
    where m.id=p_match_id and ap.user_id=p_user_id
      and (ta.starts_at is null or m.starts_at is null or ta.starts_at<=m.starts_at::date)
      and (ta.ends_at is null or m.starts_at is null or ta.ends_at>=m.starts_at::date)
  )
$$;

create or replace function public.match_day_match_entity(p_match_id uuid)
returns uuid
language sql
stable security definer
set search_path=''
as $$ select e.id from public.entities e where e.entity_type='match' and e.match_id=p_match_id limit 1 $$;

create or replace function public.create_my_match_day(
  p_organization_id uuid,
  p_team_id uuid,
  p_opponent_team_id uuid,
  p_opponent_name text,
  p_home_or_away text,
  p_title text,
  p_competition_id uuid,
  p_starts_at timestamptz,
  p_duration_min integer default 90,
  p_venue_label text default null,
  p_assigned_coach_user_id uuid default null,
  p_visibility text default 'network',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_team public.teams%rowtype;
  v_opponent public.teams%rowtype;
  v_match public.matches%rowtype;
  v_sports_event uuid;
  v_match_entity uuid;
  v_coach uuid:=p_assigned_coach_user_id;
  v_home uuid;
  v_away uuid;
  v_home_name text;
  v_away_name text;
  v_comp text;
  v_actor_name text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_home_or_away not in ('home','away') then raise exception 'invalid_match_side'; end if;
  if p_visibility not in ('public','network','private') then raise exception 'invalid_match_visibility'; end if;
  if p_starts_at is null or p_starts_at<now()-interval '12 hours' or p_starts_at>now()+interval '2 years' then raise exception 'invalid_match_start'; end if;
  if p_duration_min not between 20 and 240 then raise exception 'invalid_match_duration'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 2 and 180 then raise exception 'invalid_match_title'; end if;
  select * into v_team from public.teams where id=p_team_id and organization_id=p_organization_id and status='active';
  if not found then raise exception 'active_team_required'; end if;
  if not public.match_day_can_manage_team(p_team_id,v_uid) then raise exception 'match_day_manage_denied'; end if;
  if p_opponent_team_id is not null then
    select * into v_opponent from public.teams where id=p_opponent_team_id and status='active';
    if not found or v_opponent.id=v_team.id then raise exception 'invalid_opponent_team'; end if;
  elsif char_length(trim(coalesce(p_opponent_name,'')))<2 then
    raise exception 'opponent_required';
  end if;
  if p_competition_id is not null then
    select name into v_comp from public.competitions where id=p_competition_id and status='active';
    if v_comp is null then raise exception 'active_competition_required'; end if;
  end if;
  if v_coach is null then v_coach:=v_team.head_coach_user_id; end if;
  if v_coach is null and exists(
    select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.user_id=v_uid and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')
  ) then v_coach:=v_uid; end if;
  if v_coach is not null and not public.pillar_user_has_org_access(p_organization_id,v_coach) then raise exception 'assigned_coach_invalid'; end if;
  select coalesce(display_name,name) into v_actor_name from public.profiles where id=v_uid;
  if p_home_or_away='home' then
    v_home:=v_team.id; v_away:=v_opponent.id; v_home_name:=v_team.name; v_away_name:=coalesce(v_opponent.name,trim(p_opponent_name));
  else
    v_home:=v_opponent.id; v_away:=v_team.id; v_home_name:=coalesce(v_opponent.name,trim(p_opponent_name)); v_away_name:=v_team.name;
  end if;
  insert into public.matches(
    title,comp,venue,match_date,match_time,organizer_id,organizer_name,referee_name,status,score_a,score_b,team_a,team_b,fee,slots,
    is_demo,kickoff_at,duration_min,halves,competition_id,home_team_id,away_team_id,starts_at,venue_label,home_score,away_score,
    created_by_user_id,assigned_coach_user_id,organizer_organization_id,match_brief,published_at,visibility
  ) values(
    trim(p_title),coalesce(v_comp,''),coalesce(trim(p_venue_label),''),p_starts_at::date,to_char(p_starts_at at time zone 'Asia/Riyadh','HH24:MI'),
    v_uid,coalesce(v_actor_name,(select name_ar from public.organizations where id=p_organization_id)),null,'scheduled',0,0,v_home_name,v_away_name,0,0,
    false,p_starts_at,p_duration_min,2,p_competition_id,v_home,v_away,p_starts_at,nullif(trim(coalesce(p_venue_label,'')),''),0,0,
    v_uid,v_coach,p_organization_id,jsonb_build_object('notes',nullif(trim(coalesce(p_notes,'')),''),'home_label',v_home_name,'away_label',v_away_name),now(),p_visibility
  ) returning * into v_match;
  insert into public.sports_events(event_type,title,description,sport_code,age_category,organizer_organization_id,source_match_id,starts_at,ends_at,visibility,status,registration_required,guardian_gate_required,metadata,created_by)
  values('match',v_match.title,nullif(trim(coalesce(p_notes,'')),''),'football',v_team.age_category,p_organization_id,v_match.id,p_starts_at,p_starts_at+make_interval(mins=>p_duration_min),p_visibility,'scheduled',false,false,
    jsonb_build_object('home_team_id',v_home,'away_team_id',v_away,'home_label',v_home_name,'away_label',v_away_name,'competition_id',p_competition_id),v_uid)
  on conflict(source_match_id) where source_match_id is not null do update set title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,visibility=excluded.visibility,updated_at=now()
  returning id into v_sports_event;
  update public.matches set event_id=v_sports_event where id=v_match.id;
  insert into public.entities(entity_type,match_id,canonical_name,sport_code,status,visibility,metadata)
  values('match',v_match.id,v_match.title,'football','active',p_visibility,jsonb_build_object('sports_event_id',v_sports_event,'organization_id',p_organization_id,'home_team_id',v_home,'away_team_id',v_away))
  on conflict(match_id) where match_id is not null do update set canonical_name=excluded.canonical_name,visibility=excluded.visibility,metadata=excluded.metadata,updated_at=now()
  returning id into v_match_entity;
  insert into public.entity_event_links(event_entity_id,entity_id,participation_role,status,verification_status,source_type,source_id,metadata)
  select v_match_entity,e.id,case when e.team_id=v_home then 'home_team' else 'away_team' end,'active','verified','match',v_match.id::text,
    jsonb_build_object('match_id',v_match.id,'team_id',e.team_id)
  from public.entities e where e.team_id in (v_home,v_away)
  on conflict(event_entity_id,entity_id,participation_role) do update set status='active',verification_status='verified',metadata=excluded.metadata,updated_at=now();
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('match_created',(select id from public.entities where profile_id=v_uid limit 1),v_match_entity,(select id from public.entities where organization_id=p_organization_id limit 1),v_match_entity,
    'match',v_match.id,v_match.title,'تم إنشاء يوم مباراة مشترك',p_visibility,'verified',jsonb_build_object('starts_at',p_starts_at,'home_team_id',v_home,'away_team_id',v_away,'status','scheduled'));
  return jsonb_build_object('changed',true,'match',(select to_jsonb(m) from public.matches m where m.id=v_match.id),'sports_event_id',v_sports_event,'entity_id',v_match_entity,'managed_team_id',v_team.id);
end $$;

create or replace function public.my_match_day_index(p_organization_id uuid default null,p_limit integer default 30)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_org uuid:=p_organization_id;
  v_athlete uuid;
  v_matches jsonb:='[]'::jsonb;
  v_teams jsonb:='[]'::jsonb;
  v_opponents jsonb:='[]'::jsonb;
  v_competitions jsonb:='[]'::jsonb;
  v_coaches jsonb:='[]'::jsonb;
  v_can_create boolean:=false;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.match_day_athlete_id(v_uid);
  if v_org is null then
    select (c->'selected'->>'organization_id')::uuid into v_org from (select public.my_context_center() c) x where c->'selected'->>'context_type'='organization';
  end if;
  select coalesce(jsonb_agg(row_data order by
    case when (row_data->>'status') in ('scheduled','open','today','live','in_progress') and (row_data->>'starts_at')::timestamptz>=now()-interval '8 hours' then 0 else 1 end,
    abs(extract(epoch from((row_data->>'starts_at')::timestamptz-now())))
  ),'[]'::jsonb) into v_matches
  from (
    select jsonb_build_object(
      'id',m.id,'title',m.title,'starts_at',m.starts_at,'status',m.status,'duration_min',m.duration_min,'venue_label',coalesce(m.venue_label,m.venue),
      'home_team_id',m.home_team_id,'home_team_name',coalesce(ht.name,nullif(m.team_a,''),m.match_brief->>'home_label'),'home_organization_id',ht.organization_id,
      'away_team_id',m.away_team_id,'away_team_name',coalesce(at.name,nullif(m.team_b,''),m.match_brief->>'away_label'),'away_organization_id',at.organization_id,
      'home_score',coalesce(m.home_score,m.score_a,0),'away_score',coalesce(m.away_score,m.score_b,0),
      'competition_id',m.competition_id,'competition_name',coalesce(c.name,nullif(m.comp,'')),'organization_id',m.organizer_organization_id,
      'assigned_coach_user_id',m.assigned_coach_user_id,'coach_name',coalesce(cp.display_name,cp.name),
      'own_team_id',public.match_day_team_for_user(m.id,v_uid,v_org),
      'own_side',case when public.match_day_team_for_user(m.id,v_uid,v_org)=m.home_team_id then 'home' when public.match_day_team_for_user(m.id,v_uid,v_org)=m.away_team_id then 'away' else null end,
      'plan_status',(select mp.status from public.match_plans mp where mp.match_id=m.id and mp.team_id=public.match_day_team_for_user(m.id,v_uid,v_org) limit 1),
      'roster',(select count(*) from public.team_athletes ta where ta.team_id=public.match_day_team_for_user(m.id,v_uid,v_org) and ta.status='active'),
      'confirmed',(select count(*) from public.team_participant_responses r where r.resource_type='match' and r.resource_id=m.id and r.team_id=public.match_day_team_for_user(m.id,v_uid,v_org) and r.response_status='confirmed'),
      'selected',(select count(*) from public.match_plan_players pp join public.match_plans mp on mp.id=pp.match_plan_id where mp.match_id=m.id and mp.team_id=public.match_day_team_for_user(m.id,v_uid,v_org) and pp.selection_role in ('starting','bench')),
      'events',(select count(*) from public.team_match_events e where e.match_id=m.id and e.team_id=public.match_day_team_for_user(m.id,v_uid,v_org)),
      'entity_id',public.match_day_match_entity(m.id)
    ) row_data
    from public.matches m
    left join public.teams ht on ht.id=m.home_team_id
    left join public.teams at on at.id=m.away_team_id
    left join public.competitions c on c.id=m.competition_id
    left join public.profiles cp on cp.id=coalesce(m.assigned_coach_user_id,ht.head_coach_user_id,at.head_coach_user_id)
    where m.starts_at is not null and (
      (v_athlete is not null and exists(select 1 from public.team_athletes ta where ta.athlete_id=v_athlete and ta.status='active' and ta.team_id in (m.home_team_id,m.away_team_id)))
      or public.match_day_can_manage_match(m.id,v_uid,null)
      or (v_org is not null and m.organizer_organization_id=v_org and public.pillar_user_has_org_access(v_org,v_uid))
    )
    order by m.starts_at desc limit greatest(1,least(coalesce(p_limit,30),100))
  ) q;
  if v_org is not null and public.pillar_user_has_org_access(v_org,v_uid) then
    select exists(select 1 from public.teams t where t.organization_id=v_org and t.status='active' and public.match_day_can_manage_team(t.id,v_uid)) into v_can_create;
    if v_can_create then
      select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'season_label',t.season_label,'head_coach_user_id',t.head_coach_user_id) order by t.name),'[]'::jsonb)
      into v_teams from public.teams t where t.organization_id=v_org and t.status='active' and public.match_day_can_manage_team(t.id,v_uid);
      select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'organization_id',t.organization_id,'organization_name',o.name_ar) order by t.age_category,t.name),'[]'::jsonb)
      into v_opponents from public.teams t join public.organizations o on o.id=t.organization_id where t.status='active' and t.organization_id<>v_org limit 60;
      select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'season_label',c.season_label,'age_category',c.age_category) order by c.name),'[]'::jsonb)
      into v_competitions from public.competitions c where c.status='active' and (c.visibility='public' or c.organizer_organization_id=v_org);
      select coalesce(jsonb_agg(jsonb_build_object('user_id',p.id,'name',coalesce(p.display_name,p.name),'handle',p.handle,'avatar_url',p.avatar_url) order by coalesce(p.display_name,p.name)),'[]'::jsonb)
      into v_coaches from public.profiles p where public.pillar_user_has_org_access(v_org,p.id) and (
        exists(select 1 from public.organization_memberships m where m.organization_id=v_org and m.user_id=p.id and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach'))
        or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=v_org and r.user_id=p.id and r.status='active' and r.responsibility_code='coach')
      );
    end if;
  end if;
  return jsonb_build_object('organization_id',v_org,'athlete_id',v_athlete,'can_create',v_can_create,'matches',v_matches,'teams',v_teams,'opponents',v_opponents,'competitions',v_competitions,'coaches',v_coaches);
end $$;

grant execute on function public.match_day_athlete_id(uuid) to authenticated,service_role;
grant execute on function public.match_day_can_manage_team(uuid,uuid) to authenticated,service_role;
grant execute on function public.match_day_team_for_user(uuid,uuid,uuid) to authenticated,service_role;
grant execute on function public.match_day_can_manage_match(uuid,uuid,uuid) to authenticated,service_role;
grant execute on function public.match_day_is_match_athlete(uuid,uuid) to authenticated,service_role;
grant execute on function public.match_day_match_entity(uuid) to authenticated,service_role;
grant execute on function public.create_my_match_day(uuid,uuid,uuid,text,text,text,uuid,timestamptz,integer,text,uuid,text,text) to authenticated,service_role;
grant execute on function public.my_match_day_index(uuid,integer) to authenticated,service_role;

-- MIGRATION 20261028211554 golden_match_day_center
-- Golden Match Day — shared center for academy, coach and player
create or replace function public.my_match_day_center(
  p_match_id uuid default null,
  p_organization_id uuid default null,
  p_team_id uuid default null
)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_org uuid:=p_organization_id;
  v_athlete uuid;
  v_match_id uuid:=p_match_id;
  v_match public.matches%rowtype;
  v_team_id uuid:=p_team_id;
  v_mode text;
  v_can_manage boolean:=false;
  v_is_athlete boolean:=false;
  v_can_result boolean:=false;
  v_plan jsonb:=null;
  v_roster jsonb:='[]'::jsonb;
  v_events jsonb:='[]'::jsonb;
  v_stats jsonb:='{}'::jsonb;
  v_own_response jsonb:=null;
  v_own_readiness jsonb:=null;
  v_own_selection jsonb:=null;
  v_own_appearance jsonb:=null;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.match_day_athlete_id(v_uid);
  if v_org is null then
    select (c->'selected'->>'organization_id')::uuid into v_org from (select public.my_context_center() c) x where c->'selected'->>'context_type'='organization';
  end if;
  if v_match_id is null then
    if v_athlete is not null then
      select m.id into v_match_id
      from public.matches m
      join public.team_athletes ta on ta.team_id in (m.home_team_id,m.away_team_id) and ta.athlete_id=v_athlete and ta.status='active'
      where m.starts_at is not null
      order by case when m.status in ('scheduled','open','today','live','in_progress') and m.starts_at>=now()-interval '8 hours' then 0 else 1 end,
               abs(extract(epoch from(m.starts_at-now())))
      limit 1;
    end if;
    if v_match_id is null then
      select m.id into v_match_id from public.matches m
      where m.starts_at is not null and public.match_day_can_manage_match(m.id,v_uid,null)
      order by case when m.status in ('scheduled','open','today','live','in_progress') and m.starts_at>=now()-interval '8 hours' then 0 else 1 end,
               abs(extract(epoch from(m.starts_at-now())))
      limit 1;
    end if;
  end if;
  if v_match_id is null then
    return jsonb_build_object('match',null,'mode',case when v_athlete is not null then 'player' else 'academy' end,'organization_id',v_org,'athlete_id',v_athlete,'can_create',v_org is not null and public.pillar_user_has_org_access(v_org,v_uid));
  end if;
  select * into v_match from public.matches where id=v_match_id;
  if not found then raise exception 'match_not_found'; end if;
  v_team_id:=coalesce(v_team_id,public.match_day_team_for_user(v_match_id,v_uid,v_org));
  if v_team_id is null and v_org is not null then
    select t.id into v_team_id from public.teams t where t.id in (v_match.home_team_id,v_match.away_team_id) and t.organization_id=v_org order by case when t.id=v_match.home_team_id then 0 else 1 end limit 1;
  end if;
  if v_team_id is null and public.match_day_can_manage_match(v_match_id,v_uid,null) then
    v_team_id:=coalesce(v_match.home_team_id,v_match.away_team_id);
  end if;
  if v_team_id is null or v_team_id not in (v_match.home_team_id,v_match.away_team_id) then raise exception 'match_team_context_required'; end if;
  v_can_manage:=public.match_day_can_manage_match(v_match_id,v_uid,v_team_id);
  v_is_athlete:=v_athlete is not null and exists(select 1 from public.team_athletes ta where ta.team_id=v_team_id and ta.athlete_id=v_athlete and ta.status='active');
  if not v_can_manage and not v_is_athlete then raise exception 'match_day_access_denied'; end if;
  v_can_result:=private.match_result_user_can_manage(v_match_id,v_uid)
    or (v_match.organizer_organization_id is not null and public.organization_user_has_permission(v_match.organizer_organization_id,v_uid,'manage_events'));
  v_mode:=case
    when v_is_athlete and not v_can_manage then 'player'
    when v_match.assigned_coach_user_id=v_uid
      or exists(select 1 from public.teams t where t.id=v_team_id and t.head_coach_user_id=v_uid)
      or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=(select organization_id from public.teams where id=v_team_id) and r.user_id=v_uid and r.status='active' and r.responsibility_code='coach')
    then 'coach' else 'academy' end;
  select case when v_mode='player' and mp.status not in ('published','completed') then null else jsonb_build_object(
    'id',mp.id,'status',mp.status,'formation',mp.formation,'formation_data',mp.formation_data,'tactical_instructions',mp.tactical_instructions,
    'set_pieces',mp.set_pieces,'notes',case when v_mode='player' then null else mp.notes end,'version',mp.version,'published_at',mp.published_at,
    'players',coalesce((
      select jsonb_agg(jsonb_build_object(
        'athlete_id',pp.athlete_id,'name',coalesce(pr.display_name,pr.name,'لاعب'),'avatar_url',pr.avatar_url,
        'selection_role',pp.selection_role,'position_code',pp.position_code,'shirt_number',pp.shirt_number,'captain',pp.captain,
        'position_x',pp.position_x,'position_y',pp.position_y,'sort_order',pp.sort_order
      ) order by case pp.selection_role when 'starting' then 0 when 'bench' then 1 else 2 end,pp.sort_order,coalesce(pp.shirt_number,999))
      from public.match_plan_players pp
      join public.athlete_profiles ap on ap.id=pp.athlete_id
      left join public.profiles pr on pr.id=ap.user_id
      where pp.match_plan_id=mp.id
    ),'[]'::jsonb)
  ) end into v_plan from public.match_plans mp where mp.match_id=v_match_id and mp.team_id=v_team_id;
  select coalesce(jsonb_agg(row_data order by row_data->>'name'),'[]'::jsonb) into v_roster
  from (
    select jsonb_build_object(
      'athlete_id',ap.id,'user_id',ap.user_id,'name',coalesce(pr.display_name,pr.name,'لاعب'),'avatar_url',pr.avatar_url,
      'position',coalesce(ta.primary_position,ap.primary_position),'jersey_number',ta.jersey_number,
      'response_status',case when v_mode='player' and ap.id<>v_athlete then null else rsp.response_status end,
      'responded_at',case when v_mode='player' and ap.id<>v_athlete then null else rsp.responded_at end,
      'readiness_state',case when v_mode='player' and ap.id<>v_athlete then null else rd.readiness_state end,
      'readiness_score',case when v_mode='player' and ap.id<>v_athlete then null else rd.readiness_score end,
      'selection_role',case when v_mode='player' and (v_plan is null or (v_plan->>'status') not in ('published','completed')) and ap.id<>v_athlete then null else pp.selection_role end,
      'position_code',case when v_mode='player' and (v_plan is null or (v_plan->>'status') not in ('published','completed')) and ap.id<>v_athlete then null else pp.position_code end,
      'shirt_number',case when v_mode='player' and (v_plan is null or (v_plan->>'status') not in ('published','completed')) and ap.id<>v_athlete then null else pp.shirt_number end,
      'captain',case when v_mode='player' and (v_plan is null or (v_plan->>'status') not in ('published','completed')) and ap.id<>v_athlete then null else pp.captain end,
      'position_x',case when v_mode='player' and (v_plan is null or (v_plan->>'status') not in ('published','completed')) and ap.id<>v_athlete then null else pp.position_x end,
      'position_y',case when v_mode='player' and (v_plan is null or (v_plan->>'status') not in ('published','completed')) and ap.id<>v_athlete then null else pp.position_y end,
      'appearance',case when ma.match_id is null then null when v_mode='player' and ap.id<>v_athlete and v_match.status not in ('completed','final') then null else jsonb_build_object(
        'starter',ma.starter,'position',ma.position,'minutes_played',ma.minutes_played,'goals',ma.goals,'assists',ma.assists,
        'yellow_cards',ma.yellow_cards,'red_cards',ma.red_cards,'verification_status',ma.verification_status
      ) end
    ) row_data
    from public.team_athletes ta
    join public.athlete_profiles ap on ap.id=ta.athlete_id
    left join public.profiles pr on pr.id=ap.user_id
    left join public.team_participant_responses rsp on rsp.resource_type='match' and rsp.resource_id=v_match_id and rsp.athlete_id=ap.id
    left join public.match_readiness_checkins rd on rd.match_id=v_match_id and rd.athlete_id=ap.id
    left join public.match_plans mp on mp.match_id=v_match_id and mp.team_id=v_team_id
    left join public.match_plan_players pp on pp.match_plan_id=mp.id and pp.athlete_id=ap.id
    left join public.match_appearances ma on ma.match_id=v_match_id and ma.athlete_id=ap.id
    where ta.team_id=v_team_id and ta.status='active'
      and (ta.starts_at is null or v_match.starts_at is null or ta.starts_at<=v_match.starts_at::date)
      and (ta.ends_at is null or v_match.starts_at is null or ta.ends_at>=v_match.starts_at::date)
  ) q;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',e.id,'team_id',e.team_id,'team_name',t.name,'athlete_id',e.athlete_id,'athlete_name',coalesce(apr.display_name,apr.name),
    'secondary_athlete_id',e.secondary_athlete_id,'secondary_athlete_name',coalesce(bpr.display_name,bpr.name),
    'event_type',e.event_type,'minute',e.minute,'event_data',e.event_data,'created_at',e.created_at
  ) order by coalesce(e.minute,999),e.created_at),'[]'::jsonb) into v_events
  from public.team_match_events e
  left join public.teams t on t.id=e.team_id
  left join public.athlete_profiles aa on aa.id=e.athlete_id left join public.profiles apr on apr.id=aa.user_id
  left join public.athlete_profiles ba on ba.id=e.secondary_athlete_id left join public.profiles bpr on bpr.id=ba.user_id
  where e.match_id=v_match_id;
  select jsonb_build_object(
    'roster',count(*),
    'confirmed',count(*) filter(where rsp.response_status='confirmed'),
    'declined',count(*) filter(where rsp.response_status='declined'),
    'late',count(*) filter(where rsp.response_status='late'),
    'awaiting_response',count(*) filter(where rsp.id is null),
    'ready',count(*) filter(where rd.readiness_state='ready'),
    'limited',count(*) filter(where rd.readiness_state='limited'),
    'unavailable',count(*) filter(where rd.readiness_state in ('unavailable','follow_up')),
    'starting',count(*) filter(where pp.selection_role='starting'),
    'bench',count(*) filter(where pp.selection_role='bench'),
    'reserve',count(*) filter(where pp.selection_role='reserve'),
    'appeared',count(*) filter(where ma.match_id is not null),
    'goals',(select count(*) from public.team_match_events e where e.match_id=v_match_id and e.team_id=v_team_id and e.event_type='goal'),
    'cards',(select count(*) from public.team_match_events e where e.match_id=v_match_id and e.team_id=v_team_id and e.event_type in ('yellow_card','red_card')),
    'substitutions',(select count(*) from public.team_match_events e where e.match_id=v_match_id and e.team_id=v_team_id and e.event_type='substitution')
  ) into v_stats
  from public.team_athletes ta
  join public.athlete_profiles ap on ap.id=ta.athlete_id
  left join public.team_participant_responses rsp on rsp.resource_type='match' and rsp.resource_id=v_match_id and rsp.athlete_id=ap.id
  left join public.match_readiness_checkins rd on rd.match_id=v_match_id and rd.athlete_id=ap.id
  left join public.match_plans mp on mp.match_id=v_match_id and mp.team_id=v_team_id
  left join public.match_plan_players pp on pp.match_plan_id=mp.id and pp.athlete_id=ap.id
  left join public.match_appearances ma on ma.match_id=v_match_id and ma.athlete_id=ap.id
  where ta.team_id=v_team_id and ta.status='active';
  if v_athlete is not null then
    select to_jsonb(x) into v_own_response from (select id,response_status,reason,response_as,responded_at from public.team_participant_responses where resource_type='match' and resource_id=v_match_id and athlete_id=v_athlete) x;
    select jsonb_build_object('id',r.id,'sleep_hours',r.sleep_hours,'sleep_quality',r.sleep_quality,'fatigue_level',r.fatigue_level,'fuel_level',r.fuel_level,
      'pain_flag',r.pain_flag,'readiness_score',r.readiness_score,'readiness_state',r.readiness_state,'private_note',r.private_note,'updated_at',r.updated_at)
      into v_own_readiness from public.match_readiness_checkins r where r.match_id=v_match_id and r.athlete_id=v_athlete;
    select jsonb_build_object('selection_role',pp.selection_role,'position_code',pp.position_code,'shirt_number',pp.shirt_number,'captain',pp.captain,'position_x',pp.position_x,'position_y',pp.position_y)
      into v_own_selection from public.match_plan_players pp join public.match_plans mp on mp.id=pp.match_plan_id
      where mp.match_id=v_match_id and mp.team_id=v_team_id and pp.athlete_id=v_athlete and mp.status in ('published','completed');
    select jsonb_build_object('starter',ma.starter,'position',ma.position,'minutes_played',ma.minutes_played,'goals',ma.goals,'assists',ma.assists,'yellow_cards',ma.yellow_cards,'red_cards',ma.red_cards,'verification_status',ma.verification_status)
      into v_own_appearance from public.match_appearances ma where ma.match_id=v_match_id and ma.athlete_id=v_athlete;
  end if;
  return jsonb_build_object(
    'mode',v_mode,'can_manage',v_can_manage,'can_manage_result',v_can_result,
    'can_start',v_can_manage and v_match.status in ('scheduled','open','today') and v_plan is not null and (v_plan->>'status') in ('published','completed'),
    'can_close_team',v_can_manage and v_match.status not in ('completed','final','cancelled'),
    'athlete_id',v_athlete,'team_id',v_team_id,
    'side',case when v_team_id=v_match.home_team_id then 'home' else 'away' end,
    'match',jsonb_build_object(
      'id',v_match.id,'title',v_match.title,'starts_at',v_match.starts_at,'status',v_match.status,'duration_min',v_match.duration_min,
      'venue_label',coalesce(v_match.venue_label,v_match.venue),'home_team_id',v_match.home_team_id,'away_team_id',v_match.away_team_id,
      'home_team_name',coalesce((select name from public.teams where id=v_match.home_team_id),nullif(v_match.team_a,''),v_match.match_brief->>'home_label'),
      'away_team_name',coalesce((select name from public.teams where id=v_match.away_team_id),nullif(v_match.team_b,''),v_match.match_brief->>'away_label'),
      'home_score',coalesce(v_match.home_score,v_match.score_a,0),'away_score',coalesce(v_match.away_score,v_match.score_b,0),
      'competition_id',v_match.competition_id,'assigned_coach_user_id',v_match.assigned_coach_user_id,'organizer_organization_id',v_match.organizer_organization_id,
      'published_at',v_match.published_at,'closed_at',v_match.closed_at,'version',v_match.version,'visibility',v_match.visibility,'match_brief',v_match.match_brief,
      'entity_id',public.match_day_match_entity(v_match.id),'sports_event_id',(select id from public.sports_events where source_match_id=v_match.id limit 1)
    ),
    'team',(select jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'season_label',t.season_label,'organization_id',t.organization_id,'head_coach_user_id',t.head_coach_user_id) from public.teams t where t.id=v_team_id),
    'opponent',(select jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'organization_id',t.organization_id) from public.teams t where t.id=case when v_team_id=v_match.home_team_id then v_match.away_team_id else v_match.home_team_id end),
    'organization',(select jsonb_build_object('id',o.id,'name_ar',o.name_ar,'name_en',o.name_en,'city',o.city,'is_verified',o.is_verified) from public.organizations o where o.id=(select organization_id from public.teams where id=v_team_id)),
    'coach',(select jsonb_build_object('id',p.id,'name',coalesce(p.display_name,p.name),'avatar_url',p.avatar_url,'handle',p.handle) from public.profiles p where p.id=coalesce(v_match.assigned_coach_user_id,(select head_coach_user_id from public.teams where id=v_team_id))),
    'competition',(select jsonb_build_object('id',c.id,'name',c.name,'season_label',c.season_label,'age_category',c.age_category) from public.competitions c where c.id=v_match.competition_id),
    'plan',v_plan,'stats',v_stats,'roster',v_roster,'events',v_events,
    'own_response',v_own_response,'own_readiness',v_own_readiness,'own_selection',v_own_selection,'own_appearance',v_own_appearance
  );
end $$;

grant execute on function public.my_match_day_center(uuid,uuid,uuid) to authenticated,service_role;

-- MIGRATION 20261028211807 golden_match_day_actions_core
-- Golden Match Day — plan, response, readiness and live operation
create or replace function public.save_my_match_day_plan(
  p_match_id uuid,
  p_team_id uuid,
  p_formation text,
  p_tactical_instructions text,
  p_set_pieces jsonb,
  p_notes text,
  p_formation_data jsonb,
  p_players jsonb,
  p_publish boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_match public.matches%rowtype;
  v_org uuid;
  v_season uuid;
  v_plan public.match_plans%rowtype;
  v_row jsonb;
  v_athlete uuid;
  v_role text;
  v_seen uuid[]:='{}'::uuid[];
  v_count integer:=0;
  v_starting integer:=0;
  v_captains integer:=0;
  v_x numeric;
  v_y numeric;
  v_shirt integer;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_match from public.matches where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if p_team_id not in (v_match.home_team_id,v_match.away_team_id) then raise exception 'match_team_mismatch'; end if;
  if not public.match_day_can_manage_match(p_match_id,v_uid,p_team_id) then raise exception 'match_plan_manage_denied'; end if;
  if v_match.status in ('completed','final','cancelled') then raise exception 'match_plan_locked'; end if;
  if p_players is null or jsonb_typeof(p_players)<>'array' or jsonb_array_length(p_players)>35 then raise exception 'invalid_match_players'; end if;
  if p_set_pieces is null or jsonb_typeof(p_set_pieces)<>'array' or jsonb_array_length(p_set_pieces)>30 then raise exception 'invalid_set_pieces'; end if;
  if p_formation_data is null or jsonb_typeof(p_formation_data)<>'object' then raise exception 'invalid_formation_data'; end if;
  select organization_id into v_org from public.teams where id=p_team_id;
  select id into v_season from public.team_seasons where team_id=p_team_id and status='active' order by starts_on desc nulls last,created_at desc limit 1;
  for v_row in select value from jsonb_array_elements(p_players) loop
    begin v_athlete:=(v_row->>'athlete_id')::uuid; exception when others then raise exception 'invalid_match_athlete_id'; end;
    if v_athlete is null or v_athlete=any(v_seen) then raise exception 'duplicate_or_invalid_match_athlete'; end if;
    v_seen:=array_append(v_seen,v_athlete);
    if not exists(select 1 from public.team_athletes ta where ta.team_id=p_team_id and ta.athlete_id=v_athlete and ta.status='active') then raise exception 'match_plan_athlete_not_rostered'; end if;
    v_role:=coalesce(nullif(v_row->>'selection_role',''),'reserve');
    if v_role not in ('starting','bench','reserve') then raise exception 'invalid_selection_role'; end if;
    if v_role='starting' then v_starting:=v_starting+1; end if;
    if coalesce((v_row->>'captain')::boolean,false) then v_captains:=v_captains+1; end if;
  end loop;
  if v_starting>11 then raise exception 'starting_lineup_exceeds_eleven'; end if;
  if v_captains>1 then raise exception 'multiple_captains_not_allowed'; end if;
  insert into public.match_plans(match_id,team_id,organization_id,season_id,formation,tactical_instructions,set_pieces,notes,status,created_by_user_id,approved_by_user_id,approved_at,published_at,version,updated_by_user_id,formation_data)
  values(p_match_id,p_team_id,v_org,v_season,nullif(trim(coalesce(p_formation,'')),''),nullif(trim(coalesce(p_tactical_instructions,'')),''),p_set_pieces,nullif(trim(coalesce(p_notes,'')),''),
    case when p_publish then 'published' else 'draft' end,v_uid,case when p_publish then v_uid else null end,case when p_publish then now() else null end,case when p_publish then now() else null end,1,v_uid,p_formation_data)
  on conflict(match_id,team_id) do update set season_id=excluded.season_id,formation=excluded.formation,tactical_instructions=excluded.tactical_instructions,set_pieces=excluded.set_pieces,
    notes=excluded.notes,status=case when p_publish then 'published' else public.match_plans.status end,
    approved_by_user_id=case when p_publish then v_uid else public.match_plans.approved_by_user_id end,
    approved_at=case when p_publish then now() else public.match_plans.approved_at end,
    published_at=case when p_publish then now() else public.match_plans.published_at end,
    version=public.match_plans.version+1,updated_by_user_id=v_uid,formation_data=excluded.formation_data,updated_at=now()
  returning * into v_plan;
  delete from public.match_plan_players where match_plan_id=v_plan.id;
  v_count:=0;
  for v_row in select value from jsonb_array_elements(p_players) loop
    v_athlete:=(v_row->>'athlete_id')::uuid;
    v_role:=coalesce(nullif(v_row->>'selection_role',''),'reserve');
    begin v_x:=nullif(v_row->>'position_x','')::numeric; exception when others then v_x:=null; end;
    begin v_y:=nullif(v_row->>'position_y','')::numeric; exception when others then v_y:=null; end;
    begin v_shirt:=nullif(v_row->>'shirt_number','')::integer; exception when others then v_shirt:=null; end;
    if v_x is not null and (v_x<0 or v_x>100) then raise exception 'invalid_position_x'; end if;
    if v_y is not null and (v_y<0 or v_y>100) then raise exception 'invalid_position_y'; end if;
    if v_shirt is not null and (v_shirt<1 or v_shirt>99) then raise exception 'invalid_shirt_number'; end if;
    insert into public.match_plan_players(match_plan_id,athlete_id,selection_role,position_code,shirt_number,captain,position_x,position_y,sort_order)
    values(v_plan.id,v_athlete,v_role,nullif(v_row->>'position_code',''),v_shirt,coalesce((v_row->>'captain')::boolean,false),v_x,v_y,v_count);
    v_count:=v_count+1;
  end loop;
  update public.matches set published_at=case when p_publish then coalesce(published_at,now()) else published_at end,version=version+1,updated_at=now() where id=p_match_id;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values(case when p_publish then 'match_plan_published' else 'match_plan_updated' end,(select id from public.entities where profile_id=v_uid limit 1),public.match_day_match_entity(p_match_id),
    (select id from public.entities where organization_id=v_org limit 1),public.match_day_match_entity(p_match_id),'match_plan',v_plan.id,v_match.title,
    case when p_publish then 'نُشرت قائمة المباراة والخطة للاعبين' else 'حُفظت مسودة خطة المباراة' end,case when p_publish then 'network' else 'private' end,'verified',
    jsonb_build_object('match_id',p_match_id,'team_id',p_team_id,'version',v_plan.version,'player_count',v_count,'formation',v_plan.formation));
  return jsonb_build_object('changed',true,'plan',to_jsonb(v_plan),'player_count',v_count,'starting_count',v_starting,'published',p_publish);
end $$;

create or replace function public.respond_my_match_day(p_match_id uuid,p_response_status text,p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_athlete uuid;
  v_match public.matches%rowtype;
  v_team uuid;
  v_response_id uuid;
  v_athlete_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_response_status not in ('confirmed','declined','late') then raise exception 'invalid_match_response'; end if;
  v_athlete:=public.match_day_athlete_id(v_uid);
  if v_athlete is null then raise exception 'player_profile_required'; end if;
  select * into v_match from public.matches where id=p_match_id;
  if not found or v_match.status in ('completed','final','cancelled') then raise exception 'match_not_open'; end if;
  v_team:=public.match_day_team_for_user(p_match_id,v_uid,null);
  if v_team is null then raise exception 'match_athlete_required'; end if;
  select public.save_my_team_participation_response('match',p_match_id,v_athlete,p_response_status,p_reason) into v_response_id;
  select e.id into v_athlete_entity from public.entities e join public.athlete_profiles ap on ap.user_id=e.profile_id where ap.id=v_athlete limit 1;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('match_response_updated',v_athlete_entity,v_athlete_entity,(select id from public.entities where organization_id=(select organization_id from public.teams where id=v_team) limit 1),
    public.match_day_match_entity(p_match_id),'team_participant_response',v_response_id,'تحديث توفر اللاعب للمباراة',
    case p_response_status when 'confirmed' then 'أكد اللاعب توفره للمباراة' when 'declined' then 'اعتذر اللاعب عن المباراة' else 'أبلغ اللاعب عن وصول متأخر' end,
    'private','verified',jsonb_build_object('match_id',p_match_id,'team_id',v_team,'response_status',p_response_status));
  return jsonb_build_object('changed',true,'response',(select to_jsonb(r) from public.team_participant_responses r where r.id=v_response_id));
end $$;

create or replace function public.save_my_match_readiness(
  p_match_id uuid,
  p_sleep_hours numeric,
  p_sleep_quality integer,
  p_fatigue_level integer,
  p_fuel_level integer,
  p_pain_flag boolean default false,
  p_private_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_athlete uuid;
  v_team uuid;
  v_org uuid;
  v_match public.matches%rowtype;
  v_score integer;
  v_state text;
  v_row public.match_readiness_checkins%rowtype;
  v_athlete_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.match_day_athlete_id(v_uid);
  if v_athlete is null then raise exception 'player_profile_required'; end if;
  select * into v_match from public.matches where id=p_match_id and status not in ('completed','final','cancelled');
  if not found then raise exception 'match_not_open'; end if;
  v_team:=public.match_day_team_for_user(p_match_id,v_uid,null);
  if v_team is null then raise exception 'match_athlete_required'; end if;
  select organization_id into v_org from public.teams where id=v_team;
  if p_sleep_hours not between 0 and 16 or p_sleep_quality not between 1 and 5 or p_fatigue_level not between 1 and 5 or p_fuel_level not between 1 and 5 then raise exception 'invalid_readiness_values'; end if;
  v_score:=round(((least(p_sleep_hours,9)/9)*100 + p_sleep_quality*20 + (6-p_fatigue_level)*20 + p_fuel_level*20)/4)::integer;
  if coalesce(p_pain_flag,false) then v_score:=greatest(0,v_score-12); end if;
  v_score:=greatest(0,least(100,v_score));
  v_state:=case when coalesce(p_pain_flag,false) then 'follow_up' when v_score<45 then 'unavailable' when v_score<70 then 'limited' else 'ready' end;
  insert into public.match_readiness_checkins(match_id,organization_id,team_id,athlete_id,sleep_hours,sleep_quality,fatigue_level,fuel_level,pain_flag,readiness_score,readiness_state,private_note,created_by_user_id)
  values(p_match_id,v_org,v_team,v_athlete,p_sleep_hours,p_sleep_quality,p_fatigue_level,p_fuel_level,coalesce(p_pain_flag,false),v_score,v_state,nullif(trim(coalesce(p_private_note,'')),''),v_uid)
  on conflict(match_id,athlete_id) do update set sleep_hours=excluded.sleep_hours,sleep_quality=excluded.sleep_quality,fatigue_level=excluded.fatigue_level,fuel_level=excluded.fuel_level,
    pain_flag=excluded.pain_flag,readiness_score=excluded.readiness_score,readiness_state=excluded.readiness_state,private_note=excluded.private_note,created_by_user_id=v_uid,updated_at=now()
  returning * into v_row;
  select e.id into v_athlete_entity from public.entities e join public.athlete_profiles ap on ap.user_id=e.profile_id where ap.id=v_athlete limit 1;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('match_readiness_updated',v_athlete_entity,v_athlete_entity,(select id from public.entities where organization_id=v_org limit 1),public.match_day_match_entity(p_match_id),
    'match_readiness',v_row.id,'تحديث الجاهزية للمباراة','حدّث اللاعب جاهزيته قبل المباراة','private','verified',jsonb_build_object('match_id',p_match_id,'readiness_state',v_state,'readiness_score',v_score));
  return jsonb_build_object('changed',true,'readiness',jsonb_build_object('id',v_row.id,'readiness_score',v_score,'readiness_state',v_state,'sleep_hours',v_row.sleep_hours,
    'sleep_quality',v_row.sleep_quality,'fatigue_level',v_row.fatigue_level,'fuel_level',v_row.fuel_level,'pain_flag',v_row.pain_flag,'private_note',v_row.private_note,'updated_at',v_row.updated_at));
end $$;

create or replace function public.start_my_match_day(p_match_id uuid,p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_match public.matches%rowtype;v_org uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_match from public.matches where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if not public.match_day_can_manage_match(p_match_id,v_uid,p_team_id) then raise exception 'match_day_manage_denied'; end if;
  if p_team_id not in (v_match.home_team_id,v_match.away_team_id) then raise exception 'match_team_mismatch'; end if;
  if v_match.status in ('completed','final','cancelled') then raise exception 'match_not_startable'; end if;
  if v_match.starts_at>now()+interval '6 hours' then raise exception 'match_start_too_early'; end if;
  if not exists(select 1 from public.match_plans mp where mp.match_id=p_match_id and mp.team_id=p_team_id and mp.status in ('published','completed')) then raise exception 'published_lineup_required'; end if;
  update public.matches set status='live',home_score=coalesce(home_score,0),away_score=coalesce(away_score,0),score_a=coalesce(home_score,score_a,0),score_b=coalesce(away_score,score_b,0),version=version+1,updated_at=now()
  where id=p_match_id returning * into v_match;
  update public.sports_events set status='active',updated_at=now() where source_match_id=p_match_id;
  select organization_id into v_org from public.teams where id=p_team_id;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('match_started',(select id from public.entities where profile_id=v_uid limit 1),public.match_day_match_entity(p_match_id),(select id from public.entities where organization_id=v_org limit 1),
    public.match_day_match_entity(p_match_id),'match',p_match_id,v_match.title,'بدأت المباراة','network','verified',jsonb_build_object('team_id',p_team_id,'status','live'));
  return jsonb_build_object('changed',true,'match',to_jsonb(v_match));
end $$;

create or replace function public.record_my_match_day_events(p_match_id uuid,p_team_id uuid,p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_match public.matches%rowtype;
  v_row jsonb;
  v_type text;
  v_athlete uuid;
  v_secondary uuid;
  v_minute integer;
  v_key text;
  v_inserted integer;
  v_count integer:=0;
  v_goals integer:=0;
  v_org uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_match from public.matches where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if p_team_id not in (v_match.home_team_id,v_match.away_team_id) then raise exception 'match_team_mismatch'; end if;
  if not public.match_day_can_manage_match(p_match_id,v_uid,p_team_id)
     and not private.match_result_user_can_manage(p_match_id,v_uid) then raise exception 'match_event_create_denied'; end if;
  if v_match.status not in ('live','in_progress','today') then raise exception 'match_not_live'; end if;
  if p_events is null or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>100 then raise exception 'match_events_array_required'; end if;
  select organization_id into v_org from public.teams where id=p_team_id;
  for v_row in select value from jsonb_array_elements(p_events) loop
    v_type:=v_row->>'event_type';
    if v_type not in ('goal','assist','substitution','yellow_card','red_card','injury','position_change','other') then raise exception 'match_event_type_invalid'; end if;
    begin v_athlete:=nullif(v_row->>'athlete_id','')::uuid; exception when others then raise exception 'invalid_event_athlete'; end;
    begin v_secondary:=nullif(v_row->>'secondary_athlete_id','')::uuid; exception when others then raise exception 'invalid_event_secondary_athlete'; end;
    begin v_minute:=nullif(v_row->>'minute','')::integer; exception when others then raise exception 'invalid_event_minute'; end;
    if v_minute is not null and (v_minute<0 or v_minute>coalesce(v_match.duration_min,90)+60) then raise exception 'match_event_minute_out_of_range'; end if;
    if v_athlete is not null and not exists(select 1 from public.team_athletes where team_id=p_team_id and athlete_id=v_athlete and status='active') then raise exception 'match_event_athlete_not_rostered'; end if;
    if v_secondary is not null and not exists(select 1 from public.team_athletes where team_id=p_team_id and athlete_id=v_secondary and status='active') then raise exception 'match_event_secondary_athlete_not_rostered'; end if;
    if v_type='substitution' and (v_athlete is null or v_secondary is null) then raise exception 'substitution_players_required'; end if;
    v_key:=coalesce(nullif(v_row->>'idempotency_key',''),gen_random_uuid()::text);
    insert into public.team_match_events(match_id,team_id,athlete_id,secondary_athlete_id,event_type,minute,event_data,idempotency_key,recorded_by_user_id)
    values(p_match_id,p_team_id,v_athlete,v_secondary,v_type,v_minute,coalesce(v_row->'event_data','{}'::jsonb),v_key,v_uid)
    on conflict(match_id,team_id,idempotency_key) do nothing;
    get diagnostics v_inserted=row_count;
    v_count:=v_count+v_inserted;
    if v_type='goal' then v_goals:=v_goals+v_inserted; end if;
  end loop;
  if v_goals>0 then
    update public.matches set
      home_score=case when p_team_id=home_team_id then coalesce(home_score,0)+v_goals else coalesce(home_score,0) end,
      away_score=case when p_team_id=away_team_id then coalesce(away_score,0)+v_goals else coalesce(away_score,0) end,
      score_a=case when p_team_id=home_team_id then coalesce(home_score,0)+v_goals else coalesce(home_score,0) end,
      score_b=case when p_team_id=away_team_id then coalesce(away_score,0)+v_goals else coalesce(away_score,0) end,
      updated_at=now(),version=version+1
    where id=p_match_id returning * into v_match;
  end if;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('match_events_recorded',(select id from public.entities where profile_id=v_uid limit 1),public.match_day_match_entity(p_match_id),(select id from public.entities where organization_id=v_org limit 1),
    public.match_day_match_entity(p_match_id),'match',p_match_id,v_match.title,'تم تسجيل أحداث المباراة','network','verified',jsonb_build_object('team_id',p_team_id,'accepted',v_count,'goals_added',v_goals));
  return jsonb_build_object('accepted',v_count,'goals_added',v_goals,'match',to_jsonb(v_match));
end $$;

create or replace function public.update_my_match_day_score(p_match_id uuid,p_home_score integer,p_away_score integer,p_minute integer default null,p_period text default null)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_match public.matches%rowtype;v_org uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_home_score not between 0 and 99 or p_away_score not between 0 and 99 then raise exception 'invalid_match_score'; end if;
  select * into v_match from public.matches where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if not public.match_day_can_manage_match(p_match_id,v_uid,null) and not private.match_result_user_can_manage(p_match_id,v_uid) then raise exception 'match_score_update_denied'; end if;
  if v_match.status in ('completed','final','cancelled') then raise exception 'official_result_already_finalized'; end if;
  update public.matches set home_score=p_home_score,away_score=p_away_score,score_a=p_home_score,score_b=p_away_score,
    status=case when status in ('scheduled','open','today') then 'live' else status end,
    match_brief=coalesce(match_brief,'{}'::jsonb)||jsonb_build_object('live_minute',p_minute,'period',nullif(trim(coalesce(p_period,'')),'')),
    version=version+1,updated_at=now() where id=p_match_id returning * into v_match;
  v_org:=v_match.organizer_organization_id;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('match_score_updated',(select id from public.entities where profile_id=v_uid limit 1),public.match_day_match_entity(p_match_id),(select id from public.entities where organization_id=v_org limit 1),
    public.match_day_match_entity(p_match_id),'match',p_match_id,v_match.title,'تحديث النتيجة المباشرة','network','verified',jsonb_build_object('home_score',p_home_score,'away_score',p_away_score,'minute',p_minute,'period',p_period));
  return jsonb_build_object('changed',true,'match',to_jsonb(v_match));
end $$;

grant execute on function public.save_my_match_day_plan(uuid,uuid,text,text,jsonb,text,jsonb,jsonb,boolean) to authenticated,service_role;
grant execute on function public.respond_my_match_day(uuid,text,text) to authenticated,service_role;
grant execute on function public.save_my_match_readiness(uuid,numeric,integer,integer,integer,boolean,text) to authenticated,service_role;
grant execute on function public.start_my_match_day(uuid,uuid) to authenticated,service_role;
grant execute on function public.record_my_match_day_events(uuid,uuid,jsonb) to authenticated,service_role;
grant execute on function public.update_my_match_day_score(uuid,integer,integer,integer,text) to authenticated,service_role;

-- MIGRATION 20261028211909 golden_match_day_closure
-- Golden Match Day — materialize verified appearances and close the shared match
create or replace function private.match_day_materialize_team_v1(p_match_id uuid,p_team_id uuid,p_actor_user_id uuid)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_match public.matches%rowtype;
  v_org uuid;
  v_plan public.match_plans%rowtype;
  v_row record;
  v_position text;
  v_goals integer;
  v_assists integer;
  v_yellow integer;
  v_red integer;
  v_count integer:=0;
begin
  select * into v_match from public.matches where id=p_match_id;
  if not found then raise exception 'match_not_found'; end if;
  select organization_id into v_org from public.teams where id=p_team_id;
  select * into v_plan from public.match_plans where match_id=p_match_id and team_id=p_team_id and status in ('published','completed');
  if not found then raise exception 'published_lineup_required'; end if;
  for v_row in
    with selected as (
      select pp.athlete_id,pp.selection_role from public.match_plan_players pp where pp.match_plan_id=v_plan.id
    ),subs_out as (
      select e.athlete_id,min(coalesce(e.minute,coalesce(v_match.duration_min,90)))::integer as sub_minute
      from public.team_match_events e
      where e.match_id=p_match_id and e.team_id=p_team_id and e.event_type='substitution' and e.athlete_id is not null
      group by e.athlete_id
    ),subs_in as (
      select e.secondary_athlete_id as athlete_id,min(coalesce(e.minute,0))::integer as sub_minute
      from public.team_match_events e
      where e.match_id=p_match_id and e.team_id=p_team_id and e.event_type='substitution' and e.secondary_athlete_id is not null
      group by e.secondary_athlete_id
    ),athletes as (
      select athlete_id from selected union select athlete_id from subs_in union select athlete_id from subs_out
    )
    select a.athlete_id,(s.selection_role='starting') as started,
      greatest(0,coalesce(so.sub_minute,coalesce(v_match.duration_min,90))-
        case when s.selection_role='starting' then 0 else coalesce(si.sub_minute,coalesce(v_match.duration_min,90)) end)::integer as minutes_played
    from athletes a
    left join selected s on s.athlete_id=a.athlete_id
    left join subs_in si on si.athlete_id=a.athlete_id
    left join subs_out so on so.athlete_id=a.athlete_id
  loop
    select pp.position_code into v_position from public.match_plan_players pp where pp.match_plan_id=v_plan.id and pp.athlete_id=v_row.athlete_id;
    select count(*)::integer into v_goals from public.team_match_events e where e.match_id=p_match_id and e.team_id=p_team_id and e.athlete_id=v_row.athlete_id and e.event_type='goal';
    select count(*)::integer into v_assists from public.team_match_events e where e.match_id=p_match_id and e.team_id=p_team_id and e.athlete_id=v_row.athlete_id and e.event_type='assist';
    select count(*)::integer into v_yellow from public.team_match_events e where e.match_id=p_match_id and e.team_id=p_team_id and e.athlete_id=v_row.athlete_id and e.event_type='yellow_card';
    select count(*)::integer into v_red from public.team_match_events e where e.match_id=p_match_id and e.team_id=p_team_id and e.athlete_id=v_row.athlete_id and e.event_type='red_card';
    insert into public.match_appearances(match_id,athlete_id,team_id,starter,position,minutes_played,goals,assists,yellow_cards,red_cards,verified_by_organization_id,verification_status)
    values(p_match_id,v_row.athlete_id,p_team_id,v_row.started,v_position,v_row.minutes_played,v_goals,v_assists,v_yellow,v_red,v_org,'verified')
    on conflict(match_id,athlete_id) do update set
      team_id=excluded.team_id,starter=excluded.starter,position=excluded.position,minutes_played=excluded.minutes_played,
      goals=excluded.goals,assists=excluded.assists,yellow_cards=excluded.yellow_cards,red_cards=excluded.red_cards,
      verified_by_organization_id=excluded.verified_by_organization_id,verification_status='verified',updated_at=now();
    if v_row.minutes_played>0 then
      insert into public.performance_metrics(athlete_id,match_id,metric_code,metric_value,unit,source_type,verification_status,recorded_at,metadata)
      values(v_row.athlete_id,p_match_id,'match_minutes',v_row.minutes_played,'min','organization','verified',coalesce(v_match.starts_at,now()),jsonb_build_object('team_id',p_team_id,'actor_user_id',p_actor_user_id))
      on conflict(match_id,athlete_id,metric_code) where match_id is not null do update set
        metric_value=excluded.metric_value,unit=excluded.unit,source_type='organization',verification_status='verified',recorded_at=excluded.recorded_at,metadata=excluded.metadata;
    end if;
    insert into public.performance_metrics(athlete_id,match_id,metric_code,metric_value,unit,source_type,verification_status,recorded_at,metadata)
    values
      (v_row.athlete_id,p_match_id,'goals',v_goals,'count','organization','verified',coalesce(v_match.starts_at,now()),jsonb_build_object('team_id',p_team_id)),
      (v_row.athlete_id,p_match_id,'assists',v_assists,'count','organization','verified',coalesce(v_match.starts_at,now()),jsonb_build_object('team_id',p_team_id)),
      (v_row.athlete_id,p_match_id,'yellow_cards',v_yellow,'count','organization','verified',coalesce(v_match.starts_at,now()),jsonb_build_object('team_id',p_team_id)),
      (v_row.athlete_id,p_match_id,'red_cards',v_red,'count','organization','verified',coalesce(v_match.starts_at,now()),jsonb_build_object('team_id',p_team_id))
    on conflict(match_id,athlete_id,metric_code) where match_id is not null do update set
      metric_value=excluded.metric_value,unit=excluded.unit,source_type='organization',verification_status='verified',recorded_at=excluded.recorded_at,metadata=excluded.metadata;
    v_count:=v_count+1;
  end loop;
  update public.match_plans set status='completed',updated_by_user_id=p_actor_user_id,updated_at=now() where id=v_plan.id;
  return v_count;
end $$;

create or replace function public.close_my_match_day(p_match_id uuid,p_team_id uuid,p_home_score integer,p_away_score integer,p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_match public.matches%rowtype;
  v_org uuid;
  v_authority uuid;
  v_can_result boolean:=false;
  v_appearance_count integer:=0;
  v_revision integer;
  v_official boolean:=false;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_home_score not between 0 and 99 or p_away_score not between 0 and 99 then raise exception 'invalid_match_score'; end if;
  select * into v_match from public.matches where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if p_team_id not in (v_match.home_team_id,v_match.away_team_id) then raise exception 'match_team_mismatch'; end if;
  if not public.match_day_can_manage_match(p_match_id,v_uid,p_team_id) then raise exception 'match_day_close_denied'; end if;
  if v_match.starts_at>now() then raise exception 'match_not_started'; end if;
  select organization_id into v_org from public.teams where id=p_team_id;
  v_appearance_count:=private.match_day_materialize_team_v1(p_match_id,p_team_id,v_uid);
  v_authority:=coalesce(private.match_result_authority_organization_id(p_match_id),v_match.organizer_organization_id,v_org);
  v_can_result:=private.match_result_user_can_manage(p_match_id,v_uid)
    or (v_authority is not null and public.organization_user_has_permission(v_authority,v_uid,'manage_events'))
    or exists(
      select 1 from public.organization_responsibility_assignments r
      where r.organization_id=v_authority and r.user_id=v_uid and r.status='active'
        and r.responsibility_code in ('owner','executive','academy_admin','operations')
        and (r.starts_at is null or r.starts_at<=now()) and (r.ends_at is null or r.ends_at>=now())
    );
  if v_can_result then
    if v_match.status in ('completed','final') then
      if coalesce(v_match.home_score,v_match.score_a,0)<>p_home_score or coalesce(v_match.away_score,v_match.score_b,0)<>p_away_score then
        raise exception 'official_result_already_finalized_use_correction';
      end if;
    else
      select coalesce(max(revision),0)+1 into v_revision from public.match_result_revisions where match_id=p_match_id;
      insert into public.match_result_revisions(match_id,revision,action,authority_organization_id,actor_user_id,old_home_score,old_away_score,new_home_score,new_away_score,reason)
      values(p_match_id,v_revision,'finalized',v_authority,v_uid,v_match.home_score,v_match.away_score,p_home_score,p_away_score,nullif(trim(coalesce(p_note,'')),''));
      update public.matches set
        home_score=p_home_score,away_score=p_away_score,score_a=p_home_score,score_b=p_away_score,
        status='completed',closed_at=now(),version=version+1,updated_at=now()
      where id=p_match_id returning * into v_match;
      update public.sports_events set status='completed',updated_at=now() where source_match_id=p_match_id;
      insert into public.data_provenance(entity_type,entity_id,field_path,source_type,source_user_id,source_organization_id,verification_status,observed_at,evidence)
      values('match',p_match_id,'score','organization_verified',v_uid,v_authority,'verified',now(),jsonb_build_object('revision',v_revision,'home_score',p_home_score,'away_score',p_away_score,'source','golden_match_day'));
    end if;
    v_official:=true;
  end if;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values(case when v_official then 'match_completed' else 'team_matchday_completed' end,
    (select id from public.entities where profile_id=v_uid limit 1),public.match_day_match_entity(p_match_id),
    (select id from public.entities where organization_id=v_org limit 1),public.match_day_match_entity(p_match_id),
    'match',p_match_id,v_match.title,
    case when v_official then 'اعتمدت النتيجة وأغلقت المباراة' else 'أغلق الطاقم سجل فريقه وبانتظار اعتماد النتيجة' end,
    'network','verified',jsonb_build_object('team_id',p_team_id,'appearances_materialized',v_appearance_count,'official_result',v_official,'home_score',p_home_score,'away_score',p_away_score));
  return jsonb_build_object(
    'changed',true,'official_result',v_official,'official_result_pending',not v_official,
    'appearances_materialized',v_appearance_count,
    'match',(select to_jsonb(m) from public.matches m where m.id=p_match_id),
    'team_plan_status',(select status from public.match_plans where match_id=p_match_id and team_id=p_team_id)
  );
end $$;

grant execute on function public.close_my_match_day(uuid,uuid,integer,integer,text) to authenticated,service_role;
revoke all on function private.match_day_materialize_team_v1(uuid,uuid,uuid) from public,anon,authenticated;

-- MIGRATION golden_match_day_indexes
-- Targeted covering indexes for Golden Match Day foreign keys and hot lookups.
create index if not exists matches_created_by_user_idx on public.matches(created_by_user_id) where created_by_user_id is not null;
create index if not exists matches_assigned_coach_starts_idx on public.matches(assigned_coach_user_id,starts_at desc) where assigned_coach_user_id is not null;
create index if not exists match_plans_updated_by_user_idx on public.match_plans(updated_by_user_id) where updated_by_user_id is not null;
create index if not exists match_readiness_created_by_user_idx on public.match_readiness_checkins(created_by_user_id);
create index if not exists match_readiness_organization_idx on public.match_readiness_checkins(organization_id,updated_at desc);
create index if not exists match_readiness_team_idx on public.match_readiness_checkins(team_id,updated_at desc);
create index if not exists match_plan_players_athlete_idx on public.match_plan_players(athlete_id,match_plan_id);
create index if not exists team_match_events_team_idx on public.team_match_events(team_id,match_id,minute);
create index if not exists team_match_events_athlete_idx on public.team_match_events(athlete_id,match_id) where athlete_id is not null;
create index if not exists team_match_events_secondary_athlete_idx on public.team_match_events(secondary_athlete_id,match_id) where secondary_athlete_id is not null;
create index if not exists team_match_events_recorded_by_idx on public.team_match_events(recorded_by_user_id,created_at desc);
create index if not exists team_participant_responses_organization_idx on public.team_participant_responses(organization_id,updated_at desc);
create index if not exists team_participant_responses_team_idx on public.team_participant_responses(team_id,resource_type,resource_id);
create index if not exists team_participant_responses_response_by_idx on public.team_participant_responses(response_by_user_id,responded_at desc);
