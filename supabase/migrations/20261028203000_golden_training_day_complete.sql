-- Golden Training Day complete migration bundle
-- Exported from applied Supabase migration history to keep GitHub and production schema aligned.

-- MIGRATION 20261028154425 training_day_foundation
-- PlayIn365 Golden Training Day foundation
alter table public.training_sessions
  add column if not exists assigned_coach_user_id uuid,
  add column if not exists published_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists version integer not null default 1,
  add column if not exists session_brief jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.training_sessions'::regclass and conname='training_sessions_assigned_coach_user_id_fkey') then
    alter table public.training_sessions add constraint training_sessions_assigned_coach_user_id_fkey foreign key (assigned_coach_user_id) references auth.users(id) on delete set null;
  end if;
end $$;

alter table public.coach_evaluations
  add column if not exists training_session_id uuid,
  add column if not exists evidence jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'published';

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.coach_evaluations'::regclass and conname='coach_evaluations_training_session_id_fkey') then
    alter table public.coach_evaluations add constraint coach_evaluations_training_session_id_fkey foreign key (training_session_id) references public.training_sessions(id) on delete set null;
  end if;
end $$;

alter table public.player_assessments add column if not exists training_session_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.player_assessments'::regclass and conname='player_assessments_training_session_id_fkey') then
    alter table public.player_assessments add constraint player_assessments_training_session_id_fkey foreign key (training_session_id) references public.training_sessions(id) on delete set null;
  end if;
end $$;

create table if not exists public.training_session_plans (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','completed','archived')),
  objectives jsonb not null default '[]'::jsonb check (jsonb_typeof(objectives)='array'),
  phases jsonb not null default '[]'::jsonb check (jsonb_typeof(phases)='array'),
  coach_notes text,
  total_duration_min integer not null default 0 check (total_duration_min between 0 and 600),
  version integer not null default 1 check (version>0),
  published_by_user_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_session_responses (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  response_status text not null check (response_status in ('confirmed','declined','maybe')),
  reason text,
  responded_by_user_id uuid not null references auth.users(id) on delete restrict,
  guardian_user_id uuid references auth.users(id) on delete set null,
  responded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_session_id,athlete_id)
);

create table if not exists public.athlete_readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  sleep_hours numeric(4,1) not null check (sleep_hours between 0 and 16),
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  fatigue_level integer not null check (fatigue_level between 1 and 5),
  fuel_level integer not null check (fuel_level between 1 and 5),
  pain_flag boolean not null default false,
  readiness_score integer not null check (readiness_score between 0 and 100),
  readiness_state text not null check (readiness_state in ('ready','limited','unavailable','follow_up')),
  private_note text,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_session_id,athlete_id)
);

create index if not exists training_sessions_org_starts_idx on public.training_sessions(organization_id,starts_at,status);
create index if not exists training_sessions_team_starts_idx on public.training_sessions(team_id,starts_at,status);
create index if not exists training_sessions_coach_starts_idx on public.training_sessions(assigned_coach_user_id,starts_at,status) where assigned_coach_user_id is not null;
create index if not exists training_session_attendance_lookup_idx on public.training_session_attendance(training_session_id,athlete_id);
create unique index if not exists coach_evaluations_training_session_uq on public.coach_evaluations(training_session_id,athlete_id,coach_user_id) where training_session_id is not null;
create unique index if not exists player_assessments_training_session_uq on public.player_assessments(training_session_id,athlete_id) where training_session_id is not null;
create index if not exists performance_metrics_training_session_lookup_idx on public.performance_metrics(training_session_id,athlete_id,metric_code) where training_session_id is not null;
create index if not exists readiness_session_state_idx on public.athlete_readiness_checkins(training_session_id,readiness_state);
create index if not exists readiness_athlete_created_idx on public.athlete_readiness_checkins(athlete_id,created_at desc);
create index if not exists training_responses_session_status_idx on public.training_session_responses(training_session_id,response_status);

do $$
declare c record; vals text;
begin
  for c in select conname from pg_constraint where conrelid='public.training_session_attendance'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%attendance_status%' loop execute format('alter table public.training_session_attendance drop constraint %I',c.conname); end loop;
  select string_agg(quote_literal(v),',') into vals from (select distinct attendance_status::text v from public.training_session_attendance where attendance_status is not null union select unnest(array['present','absent','late','excused','partial','medical'])) s;
  execute 'alter table public.training_session_attendance add constraint training_session_attendance_status_check check (attendance_status in ('||vals||'))';
  for c in select conname from pg_constraint where conrelid='public.training_session_attendance'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%verification_status%' loop execute format('alter table public.training_session_attendance drop constraint %I',c.conname); end loop;
  select string_agg(quote_literal(v),',') into vals from (select distinct verification_status::text v from public.training_session_attendance where verification_status is not null union select unnest(array['unverified','pending','verified','rejected'])) s;
  execute 'alter table public.training_session_attendance add constraint training_session_attendance_verification_check check (verification_status in ('||vals||'))';
  for c in select conname from pg_constraint where conrelid='public.coach_evaluations'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%evaluation_type%' loop execute format('alter table public.coach_evaluations drop constraint %I',c.conname); end loop;
  select string_agg(quote_literal(v),',') into vals from (select distinct evaluation_type::text v from public.coach_evaluations where evaluation_type is not null union select unnest(array['training','match','periodic','trial','season','development'])) s;
  execute 'alter table public.coach_evaluations add constraint coach_evaluations_type_check check (evaluation_type in ('||vals||'))';
  for c in select conname from pg_constraint where conrelid='public.coach_evaluations'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%visibility%' loop execute format('alter table public.coach_evaluations drop constraint %I',c.conname); end loop;
  select string_agg(quote_literal(v),',') into vals from (select distinct visibility::text v from public.coach_evaluations where visibility is not null union select unnest(array['private','athlete','athlete_guardian','organization','network'])) s;
  execute 'alter table public.coach_evaluations add constraint coach_evaluations_visibility_check check (visibility in ('||vals||'))';
  for c in select conname from pg_constraint where conrelid='public.coach_evaluations'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop execute format('alter table public.coach_evaluations drop constraint %I',c.conname); end loop;
  select string_agg(quote_literal(v),',') into vals from (select distinct status::text v from public.coach_evaluations where status is not null union select unnest(array['draft','published','archived'])) s;
  execute 'alter table public.coach_evaluations add constraint coach_evaluations_status_check check (status in ('||vals||'))';
  for c in select conname from pg_constraint where conrelid='public.player_assessments'::regclass and contype='c' and (pg_get_constraintdef(oid) ilike '%assessment_type%' or pg_get_constraintdef(oid) ilike '%status%' or pg_get_constraintdef(oid) ilike '%visibility%' or pg_get_constraintdef(oid) ilike '%verification_source%') loop execute format('alter table public.player_assessments drop constraint %I',c.conname); end loop;
  alter table public.player_assessments add constraint player_assessments_type_check check (assessment_type in ('training_session','match','periodic','trial','season','development','coach')), add constraint player_assessments_status_check check (status in ('draft','submitted','approved','rejected','archived')), add constraint player_assessments_visibility_check check (visibility in ('private','athlete','athlete_guardian','organization','network','public')), add constraint player_assessments_verification_source_check check (verification_source in ('coach','organization','system','integration','manual'));
  for c in select conname from pg_constraint where conrelid='public.performance_metrics'::regclass and contype='c' and (pg_get_constraintdef(oid) ilike '%source_type%' or pg_get_constraintdef(oid) ilike '%verification_status%') loop execute format('alter table public.performance_metrics drop constraint %I',c.conname); end loop;
  select string_agg(quote_literal(v),',') into vals from (select distinct source_type::text v from public.performance_metrics where source_type is not null union select unnest(array['manual','coach','organization','system','integration','derived'])) s;
  execute 'alter table public.performance_metrics add constraint performance_metrics_source_type_check check (source_type in ('||vals||'))';
  select string_agg(quote_literal(v),',') into vals from (select distinct verification_status::text v from public.performance_metrics where verification_status is not null union select unnest(array['unverified','pending','verified','rejected'])) s;
  execute 'alter table public.performance_metrics add constraint performance_metrics_verification_check check (verification_status in ('||vals||'))';
end $$;

alter table public.training_session_plans enable row level security;
alter table public.training_session_responses enable row level security;
alter table public.athlete_readiness_checkins enable row level security;
revoke all on table public.training_session_plans from anon,authenticated;
revoke all on table public.training_session_responses from anon,authenticated;
revoke all on table public.athlete_readiness_checkins from anon,authenticated;
grant all on table public.training_session_plans to service_role;
grant all on table public.training_session_responses to service_role;
grant all on table public.athlete_readiness_checkins to service_role;;


-- MIGRATION 20261028154713 training_day_functions
create or replace function public.training_day_athlete_id(p_user_id uuid)
returns uuid language sql stable security definer set search_path=''
as $$ select ap.id from public.athlete_profiles ap where ap.user_id=p_user_id limit 1 $$;

create or replace function public.training_day_can_manage_team(p_team_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.teams t where t.id=p_team_id and (
      public.organization_user_has_permission(t.organization_id,p_user_id,'manage_events')
      or public.organization_user_has_permission(t.organization_id,p_user_id,'manage_members')
      or t.head_coach_user_id=p_user_id
      or exists(
        select 1 from public.organization_responsibility_assignments r
        where r.organization_id=t.organization_id and r.user_id=p_user_id and r.status='active'
          and r.responsibility_code in ('owner','executive','academy_admin','operations','coach','gate')
          and (r.starts_at is null or r.starts_at<=now())
          and (r.ends_at is null or r.ends_at>=now())
          and (r.responsibility_code<>'coach' or not (r.scope ? 'team_id') or r.scope->>'team_id'=t.id::text)
      )
    )
  )
$$;

create or replace function public.training_day_can_manage_session(p_training_session_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.training_sessions s
    where s.id=p_training_session_id
      and (s.assigned_coach_user_id=p_user_id or public.training_day_can_manage_team(s.team_id,p_user_id))
  )
$$;

create or replace function public.training_day_is_session_athlete(p_training_session_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.training_sessions s
    join public.team_athletes ta on ta.team_id=s.team_id and ta.status='active'
    join public.athlete_profiles ap on ap.id=ta.athlete_id
    where s.id=p_training_session_id and ap.user_id=p_user_id
  )
$$;

create or replace function public.training_day_session_entity(p_training_session_id uuid)
returns uuid language sql stable security definer set search_path=''
as $$ select e.id from public.entities e where e.training_session_id=p_training_session_id limit 1 $$;

create or replace function public.my_training_day_center(
  p_training_session_id uuid default null,
  p_organization_id uuid default null
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid(); v_session public.training_sessions%rowtype; v_session_id uuid:=p_training_session_id;
  v_org uuid:=p_organization_id; v_athlete uuid; v_mode text; v_can_manage boolean:=false; v_is_athlete boolean:=false;
  v_plan jsonb; v_roster jsonb; v_stats jsonb; v_own_response jsonb; v_own_readiness jsonb; v_own_evaluation jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.training_day_athlete_id(v_uid);
  if v_org is null then
    select (c->'selected'->>'organization_id')::uuid into v_org
    from (select public.my_context_center() c) x
    where c->'selected'->>'context_type'='organization';
  end if;
  if v_session_id is null then
    if v_athlete is not null then
      select s.id into v_session_id from public.training_sessions s
      join public.team_athletes ta on ta.team_id=s.team_id and ta.athlete_id=v_athlete and ta.status='active'
      where s.status in ('scheduled','in_progress') and s.starts_at>=now()-interval '12 hours'
      order by s.starts_at limit 1;
    end if;
    if v_session_id is null then
      select s.id into v_session_id from public.training_sessions s join public.teams t on t.id=s.team_id
      where s.status in ('scheduled','in_progress') and s.starts_at>=now()-interval '12 hours'
        and (s.assigned_coach_user_id=v_uid or t.head_coach_user_id=v_uid
          or (v_org is not null and s.organization_id=v_org and public.training_day_can_manage_team(s.team_id,v_uid)))
      order by s.starts_at limit 1;
    end if;
    if v_session_id is null and v_org is not null and public.pillar_user_has_org_access(v_org,v_uid) then
      select s.id into v_session_id from public.training_sessions s
      where s.organization_id=v_org and s.status in ('scheduled','in_progress') and s.starts_at>=now()-interval '12 hours'
      order by s.starts_at limit 1;
    end if;
    if v_session_id is null then
      if v_athlete is not null then
        select s.id into v_session_id from public.training_sessions s
        join public.team_athletes ta on ta.team_id=s.team_id and ta.athlete_id=v_athlete and ta.status='active'
        where s.starts_at<now() order by s.starts_at desc limit 1;
      elsif v_org is not null then
        select s.id into v_session_id from public.training_sessions s
        where s.organization_id=v_org and public.training_day_can_manage_team(s.team_id,v_uid)
        order by s.starts_at desc limit 1;
      end if;
    end if;
  end if;
  if v_session_id is null then
    return jsonb_build_object('session',null,'mode',case when v_athlete is not null then 'player' else 'organization' end,
      'can_create',v_org is not null and public.pillar_user_has_org_access(v_org,v_uid),'organization_id',v_org,'athlete_id',v_athlete);
  end if;
  select * into v_session from public.training_sessions where id=v_session_id;
  if not found then raise exception 'training_session_not_found'; end if;
  v_can_manage:=public.training_day_can_manage_session(v_session.id,v_uid);
  v_is_athlete:=public.training_day_is_session_athlete(v_session.id,v_uid);
  if not v_can_manage and not v_is_athlete then raise exception 'training_session_access_denied'; end if;
  v_mode:=case when v_is_athlete and not v_can_manage then 'player'
    when v_session.assigned_coach_user_id=v_uid
      or exists(select 1 from public.teams t where t.id=v_session.team_id and t.head_coach_user_id=v_uid)
      or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=v_session.organization_id and r.user_id=v_uid and r.status='active' and r.responsibility_code='coach')
    then 'coach' else 'academy' end;
  select case when v_mode='player' and p.status not in ('published','completed') then null else jsonb_build_object(
      'id',p.id,'status',p.status,'objectives',p.objectives,'phases',p.phases,'coach_notes',p.coach_notes,
      'total_duration_min',p.total_duration_min,'version',p.version,'published_at',p.published_at) end
  into v_plan from public.training_session_plans p where p.training_session_id=v_session.id;
  select coalesce(jsonb_agg(row_data order by row_data->>'name'),'[]'::jsonb) into v_roster
  from (
    select jsonb_build_object(
      'athlete_id',ap.id,'user_id',ap.user_id,'name',coalesce(pr.display_name,pr.name,'لاعب'),'avatar_url',pr.avatar_url,
      'position',coalesce(ta.primary_position,ap.primary_position),'jersey_number',ta.jersey_number,
      'response_status',case when v_mode='player' and ap.id<>v_athlete then null else rsp.response_status end,
      'responded_at',case when v_mode='player' and ap.id<>v_athlete then null else rsp.responded_at end,
      'readiness_state',case when v_mode='player' and ap.id<>v_athlete then null else rd.readiness_state end,
      'readiness_score',case when v_mode='player' and ap.id<>v_athlete then null else rd.readiness_score end,
      'attendance_status',case when v_mode='player' and ap.id<>v_athlete then null else att.attendance_status end,
      'minutes_participated',case when v_mode='player' and ap.id<>v_athlete then null else att.minutes_participated end,
      'perceived_exertion',case when v_mode='player' and ap.id<>v_athlete then null else att.perceived_exertion end,
      'evaluation',case when v_mode='player' and ap.id<>v_athlete then null when ev.id is null then null else jsonb_build_object(
        'id',ev.id,'technical_score',ev.technical_score,'tactical_score',ev.tactical_score,'physical_score',ev.physical_score,
        'mentality_score',ev.mentality_score,'notes',ev.notes,'evaluated_at',ev.evaluated_at,'status',ev.status) end
    ) row_data
    from public.team_athletes ta join public.athlete_profiles ap on ap.id=ta.athlete_id
    left join public.profiles pr on pr.id=ap.user_id
    left join public.training_session_responses rsp on rsp.training_session_id=v_session.id and rsp.athlete_id=ap.id
    left join public.athlete_readiness_checkins rd on rd.training_session_id=v_session.id and rd.athlete_id=ap.id
    left join lateral (select a.* from public.training_session_attendance a where a.training_session_id=v_session.id and a.athlete_id=ap.id order by a.updated_at desc limit 1) att on true
    left join public.coach_evaluations ev on ev.training_session_id=v_session.id and ev.athlete_id=ap.id and ev.status='published'
    where ta.team_id=v_session.team_id and ta.status='active'
  ) r;
  select jsonb_build_object(
    'roster',count(*),'confirmed',count(*) filter(where rsp.response_status='confirmed'),
    'declined',count(*) filter(where rsp.response_status='declined'),'awaiting_response',count(*) filter(where rsp.id is null),
    'ready',count(*) filter(where rd.readiness_state='ready'),'limited',count(*) filter(where rd.readiness_state='limited'),
    'unavailable',count(*) filter(where rd.readiness_state in ('unavailable','follow_up')),
    'present',count(*) filter(where att.attendance_status='present'),'late',count(*) filter(where att.attendance_status='late'),
    'absent',count(*) filter(where att.attendance_status='absent'),'evaluated',count(*) filter(where ev.id is not null)
  ) into v_stats
  from public.team_athletes ta join public.athlete_profiles ap on ap.id=ta.athlete_id
  left join public.training_session_responses rsp on rsp.training_session_id=v_session.id and rsp.athlete_id=ap.id
  left join public.athlete_readiness_checkins rd on rd.training_session_id=v_session.id and rd.athlete_id=ap.id
  left join lateral (select a.* from public.training_session_attendance a where a.training_session_id=v_session.id and a.athlete_id=ap.id order by a.updated_at desc limit 1) att on true
  left join public.coach_evaluations ev on ev.training_session_id=v_session.id and ev.athlete_id=ap.id and ev.status='published'
  where ta.team_id=v_session.team_id and ta.status='active';
  if v_athlete is not null then
    select to_jsonb(x) into v_own_response from (select id,response_status,reason,responded_at from public.training_session_responses where training_session_id=v_session.id and athlete_id=v_athlete) x;
    select jsonb_build_object('id',r.id,'sleep_hours',r.sleep_hours,'sleep_quality',r.sleep_quality,'fatigue_level',r.fatigue_level,
      'fuel_level',r.fuel_level,'pain_flag',r.pain_flag,'readiness_score',r.readiness_score,'readiness_state',r.readiness_state,
      'private_note',r.private_note,'updated_at',r.updated_at) into v_own_readiness
    from public.athlete_readiness_checkins r where r.training_session_id=v_session.id and r.athlete_id=v_athlete;
    select jsonb_build_object('id',e.id,'technical_score',e.technical_score,'tactical_score',e.tactical_score,
      'physical_score',e.physical_score,'mentality_score',e.mentality_score,'notes',e.notes,'evaluated_at',e.evaluated_at,'status',e.status)
    into v_own_evaluation from public.coach_evaluations e
    where e.training_session_id=v_session.id and e.athlete_id=v_athlete and e.status='published'
    order by e.evaluated_at desc limit 1;
  end if;
  return jsonb_build_object(
    'mode',v_mode,'can_manage',v_can_manage,'can_create',v_can_manage,
    'can_close',v_can_manage and v_session.status not in ('completed','cancelled'),'athlete_id',v_athlete,
    'session',jsonb_build_object('id',v_session.id,'title',v_session.title,'session_type',v_session.session_type,
      'starts_at',v_session.starts_at,'ends_at',v_session.ends_at,'venue_label',v_session.venue_label,'status',v_session.status,
      'team_id',v_session.team_id,'organization_id',v_session.organization_id,'assigned_coach_user_id',v_session.assigned_coach_user_id,
      'published_at',v_session.published_at,'closed_at',v_session.closed_at,'version',v_session.version,
      'session_brief',v_session.session_brief,'entity_id',public.training_day_session_entity(v_session.id)),
    'team',(select jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'season_label',t.season_label,'head_coach_user_id',t.head_coach_user_id) from public.teams t where t.id=v_session.team_id),
    'organization',(select jsonb_build_object('id',o.id,'name_ar',o.name_ar,'name_en',o.name_en,'city',o.city,'is_verified',o.is_verified) from public.organizations o where o.id=v_session.organization_id),
    'coach',(select jsonb_build_object('id',p.id,'name',coalesce(p.display_name,p.name),'avatar_url',p.avatar_url,'handle',p.handle) from public.profiles p where p.id=coalesce(v_session.assigned_coach_user_id,(select t.head_coach_user_id from public.teams t where t.id=v_session.team_id))),
    'plan',v_plan,'stats',v_stats,'roster',v_roster,'own_response',v_own_response,'own_readiness',v_own_readiness,'own_evaluation',v_own_evaluation
  );
end $$;

create or replace function public.create_my_training_day(
  p_organization_id uuid,p_team_id uuid,p_title text,p_session_type text,p_starts_at timestamptz,p_ends_at timestamptz,
  p_venue_label text default null,p_assigned_coach_user_id uuid default null,p_objectives jsonb default '[]'::jsonb,p_focus text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_session public.training_sessions%rowtype; v_coach uuid:=p_assigned_coach_user_id; v_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 2 and 180 then raise exception 'invalid_session_title'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at or p_ends_at>p_starts_at+interval '8 hours' then raise exception 'invalid_session_time'; end if;
  if p_objectives is null or jsonb_typeof(p_objectives)<>'array' or jsonb_array_length(p_objectives)>20 then raise exception 'invalid_session_objectives'; end if;
  if not exists(select 1 from public.teams t where t.id=p_team_id and t.organization_id=p_organization_id and t.status='active') then raise exception 'active_team_required'; end if;
  if not public.training_day_can_manage_team(p_team_id,v_uid) then raise exception 'training_session_manage_denied'; end if;
  if v_coach is null and exists(select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.user_id=v_uid and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')) then v_coach:=v_uid; end if;
  if v_coach is null then select head_coach_user_id into v_coach from public.teams where id=p_team_id; end if;
  if v_coach is not null and not (public.pillar_user_has_org_access(p_organization_id,v_coach) and (
    exists(select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.user_id=v_coach and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach'))
    or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=p_organization_id and r.user_id=v_coach and r.status='active' and r.responsibility_code='coach')
  )) then raise exception 'assigned_coach_invalid'; end if;
  insert into public.training_sessions(team_id,organization_id,title,session_type,starts_at,ends_at,venue_label,status,created_by_user_id,assigned_coach_user_id,session_brief)
  values(p_team_id,p_organization_id,trim(p_title),coalesce(nullif(trim(p_session_type),''),'training'),p_starts_at,p_ends_at,
    nullif(trim(coalesce(p_venue_label,'')),''),'scheduled',v_uid,v_coach,jsonb_build_object('focus',nullif(trim(coalesce(p_focus,'')),''),'objectives',p_objectives)) returning * into v_session;
  insert into public.training_session_plans(training_session_id,status,objectives,phases,coach_notes,total_duration_min,version,created_by_user_id)
  values(v_session.id,'draft',p_objectives,'[]'::jsonb,nullif(trim(coalesce(p_focus,'')),''),0,1,v_uid);
  insert into public.entities(entity_type,training_session_id,canonical_name,sport_code,status,visibility,metadata)
  values('training_session',v_session.id,v_session.title,'football','active','network',jsonb_build_object('organization_id',p_organization_id,'team_id',p_team_id))
  on conflict(training_session_id) where training_session_id is not null do update set canonical_name=excluded.canonical_name,updated_at=now() returning id into v_entity;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('training_session_created',(select id from public.entities where profile_id=v_uid limit 1),v_entity,
    (select id from public.entities where organization_id=p_organization_id limit 1),v_entity,'training_session',v_session.id,
    v_session.title,'تم إنشاء حصة تدريبية مشتركة','network','verified',jsonb_build_object('team_id',p_team_id,'starts_at',p_starts_at,'status','scheduled'))
  on conflict do nothing;
  return jsonb_build_object('changed',true,'session',to_jsonb(v_session),'entity_id',v_entity);
end $$;

create or replace function public.save_my_training_plan(
  p_training_session_id uuid,p_objectives jsonb,p_phases jsonb,p_coach_notes text default null,p_publish boolean default false
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_total integer; v_plan public.training_session_plans%rowtype; v_session public.training_sessions%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.training_day_can_manage_session(p_training_session_id,v_uid) then raise exception 'training_session_manage_denied'; end if;
  if p_objectives is null or jsonb_typeof(p_objectives)<>'array' or jsonb_array_length(p_objectives)>20 then raise exception 'invalid_plan_objectives'; end if;
  if p_phases is null or jsonb_typeof(p_phases)<>'array' or jsonb_array_length(p_phases)>30 then raise exception 'invalid_plan_phases'; end if;
  if exists(select 1 from jsonb_array_elements(p_phases) x where jsonb_typeof(x)<>'object' or not (x ? 'title')
    or char_length(trim(coalesce(x->>'title','')))<2 or coalesce(x->>'duration_min','') !~ '^[0-9]+$' or (x->>'duration_min')::integer not between 1 and 180)
  then raise exception 'invalid_plan_phase'; end if;
  select coalesce(sum((x->>'duration_min')::integer),0) into v_total from jsonb_array_elements(p_phases) x;
  if v_total>600 then raise exception 'plan_duration_too_long'; end if;
  insert into public.training_session_plans(training_session_id,status,objectives,phases,coach_notes,total_duration_min,version,published_by_user_id,published_at,created_by_user_id)
  values(p_training_session_id,case when p_publish then 'published' else 'draft' end,p_objectives,p_phases,nullif(trim(coalesce(p_coach_notes,'')),''),v_total,1,
    case when p_publish then v_uid else null end,case when p_publish then now() else null end,v_uid)
  on conflict(training_session_id) do update set status=case when p_publish then 'published' else public.training_session_plans.status end,
    objectives=excluded.objectives,phases=excluded.phases,coach_notes=excluded.coach_notes,total_duration_min=excluded.total_duration_min,
    version=public.training_session_plans.version+1,published_by_user_id=case when p_publish then v_uid else public.training_session_plans.published_by_user_id end,
    published_at=case when p_publish then now() else public.training_session_plans.published_at end,updated_at=now()
  returning * into v_plan;
  update public.training_sessions set published_at=case when p_publish then coalesce(published_at,now()) else published_at end,
    version=version+1,session_brief=coalesce(session_brief,'{}'::jsonb)||jsonb_build_object('objectives',p_objectives,'focus',nullif(trim(coalesce(p_coach_notes,'')),'')),updated_at=now()
  where id=p_training_session_id returning * into v_session;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values(case when p_publish then 'training_plan_published' else 'training_plan_updated' end,(select id from public.entities where profile_id=v_uid limit 1),
    public.training_day_session_entity(p_training_session_id),(select id from public.entities where organization_id=v_session.organization_id limit 1),
    public.training_day_session_entity(p_training_session_id),'training_session_plan',v_plan.id,v_session.title,
    case when p_publish then 'نُشرت خطة الحصة للاعبين' else 'حُدثت مسودة خطة الحصة' end,
    case when p_publish then 'network' else 'private' end,'verified',jsonb_build_object('session_id',p_training_session_id,'version',v_plan.version,'duration_min',v_total))
  on conflict do nothing;
  return jsonb_build_object('changed',true,'plan',to_jsonb(v_plan),'session',to_jsonb(v_session));
end $$;

create or replace function public.respond_my_training_day(p_training_session_id uuid,p_response_status text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_athlete uuid; v_row public.training_session_responses%rowtype; v_session public.training_sessions%rowtype; v_athlete_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_response_status not in ('confirmed','declined','maybe') then raise exception 'invalid_training_response'; end if;
  v_athlete:=public.training_day_athlete_id(v_uid);
  if v_athlete is null or not public.training_day_is_session_athlete(p_training_session_id,v_uid) then raise exception 'training_session_athlete_required'; end if;
  select * into v_session from public.training_sessions where id=p_training_session_id and status in ('scheduled','in_progress');
  if not found then raise exception 'training_session_not_open'; end if;
  insert into public.training_session_responses(training_session_id,athlete_id,response_status,reason,responded_by_user_id,responded_at)
  values(p_training_session_id,v_athlete,p_response_status,nullif(trim(coalesce(p_reason,'')),''),v_uid,now())
  on conflict(training_session_id,athlete_id) do update set response_status=excluded.response_status,reason=excluded.reason,responded_by_user_id=v_uid,responded_at=now(),updated_at=now()
  returning * into v_row;
  select e.id into v_athlete_entity from public.entities e join public.athlete_profiles ap on ap.user_id=e.profile_id where ap.id=v_athlete limit 1;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('training_response_updated',v_athlete_entity,v_athlete_entity,(select id from public.entities where organization_id=v_session.organization_id limit 1),
    public.training_day_session_entity(p_training_session_id),'training_session_response',v_row.id,'تحديث حضور الحصة',
    case p_response_status when 'confirmed' then 'أكد اللاعب الحضور' when 'declined' then 'اعتذر اللاعب عن الحضور' else 'لم يحسم اللاعب حضوره' end,
    'private','verified',jsonb_build_object('session_id',p_training_session_id,'response_status',p_response_status)) on conflict do nothing;
  return jsonb_build_object('changed',true,'response',to_jsonb(v_row));
end $$;

create or replace function public.save_my_training_readiness(
  p_training_session_id uuid,p_sleep_hours numeric,p_sleep_quality integer,p_fatigue_level integer,p_fuel_level integer,
  p_pain_flag boolean default false,p_private_note text default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_athlete uuid; v_org uuid; v_score integer; v_state text; v_row public.athlete_readiness_checkins%rowtype; v_athlete_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.training_day_athlete_id(v_uid);
  if v_athlete is null or not public.training_day_is_session_athlete(p_training_session_id,v_uid) then raise exception 'training_session_athlete_required'; end if;
  if p_sleep_hours not between 0 and 16 or p_sleep_quality not between 1 and 5 or p_fatigue_level not between 1 and 5 or p_fuel_level not between 1 and 5 then raise exception 'invalid_readiness_values'; end if;
  select organization_id into v_org from public.training_sessions where id=p_training_session_id and status in ('scheduled','in_progress');
  if v_org is null then raise exception 'training_session_not_open'; end if;
  v_score:=round(((least(p_sleep_hours,9)/9)*100 + p_sleep_quality*20 + (6-p_fatigue_level)*20 + p_fuel_level*20)/4)::integer;
  if coalesce(p_pain_flag,false) then v_score:=greatest(0,v_score-12); end if;
  v_score:=greatest(0,least(100,v_score));
  v_state:=case when coalesce(p_pain_flag,false) then 'follow_up' when v_score<45 then 'unavailable' when v_score<70 then 'limited' else 'ready' end;
  insert into public.athlete_readiness_checkins(training_session_id,organization_id,athlete_id,sleep_hours,sleep_quality,fatigue_level,fuel_level,pain_flag,readiness_score,readiness_state,private_note,created_by_user_id)
  values(p_training_session_id,v_org,v_athlete,p_sleep_hours,p_sleep_quality,p_fatigue_level,p_fuel_level,coalesce(p_pain_flag,false),v_score,v_state,nullif(trim(coalesce(p_private_note,'')),''),v_uid)
  on conflict(training_session_id,athlete_id) do update set sleep_hours=excluded.sleep_hours,sleep_quality=excluded.sleep_quality,
    fatigue_level=excluded.fatigue_level,fuel_level=excluded.fuel_level,pain_flag=excluded.pain_flag,readiness_score=excluded.readiness_score,
    readiness_state=excluded.readiness_state,private_note=excluded.private_note,created_by_user_id=v_uid,updated_at=now()
  returning * into v_row;
  select e.id into v_athlete_entity from public.entities e join public.athlete_profiles ap on ap.user_id=e.profile_id where ap.id=v_athlete limit 1;
  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('readiness_updated',v_athlete_entity,v_athlete_entity,(select id from public.entities where organization_id=v_org limit 1),
    public.training_day_session_entity(p_training_session_id),'readiness_checkin',v_row.id,'تحديث الجاهزية','حدّث اللاعب جاهزيته قبل الحصة','private','verified',
    jsonb_build_object('session_id',p_training_session_id,'readiness_state',v_state,'readiness_score',v_score)) on conflict do nothing;
  return jsonb_build_object('changed',true,'readiness',jsonb_build_object('id',v_row.id,'readiness_score',v_score,'readiness_state',v_state,
    'sleep_hours',v_row.sleep_hours,'sleep_quality',v_row.sleep_quality,'fatigue_level',v_row.fatigue_level,'fuel_level',v_row.fuel_level,
    'pain_flag',v_row.pain_flag,'private_note',v_row.private_note,'updated_at',v_row.updated_at));
end $$;

revoke all on function public.training_day_athlete_id(uuid) from public,anon,authenticated;
revoke all on function public.training_day_can_manage_team(uuid,uuid) from public,anon,authenticated;
revoke all on function public.training_day_can_manage_session(uuid,uuid) from public,anon,authenticated;
revoke all on function public.training_day_is_session_athlete(uuid,uuid) from public,anon,authenticated;
revoke all on function public.training_day_session_entity(uuid) from public,anon,authenticated;
revoke all on function public.my_training_day_center(uuid,uuid) from public,anon;
revoke all on function public.create_my_training_day(uuid,uuid,text,text,timestamptz,timestamptz,text,uuid,jsonb,text) from public,anon;
revoke all on function public.save_my_training_plan(uuid,jsonb,jsonb,text,boolean) from public,anon;
revoke all on function public.respond_my_training_day(uuid,text,text) from public,anon;
revoke all on function public.save_my_training_readiness(uuid,numeric,integer,integer,integer,boolean,text) from public,anon;
grant execute on function public.my_training_day_center(uuid,uuid) to authenticated;
grant execute on function public.create_my_training_day(uuid,uuid,text,text,timestamptz,timestamptz,text,uuid,jsonb,text) to authenticated;
grant execute on function public.save_my_training_plan(uuid,jsonb,jsonb,text,boolean) to authenticated;
grant execute on function public.respond_my_training_day(uuid,text,text) to authenticated;
grant execute on function public.save_my_training_readiness(uuid,numeric,integer,integer,integer,boolean,text) to authenticated;;


-- MIGRATION 20261028155432 training_day_index
create or replace function public.my_training_day_index(p_organization_id uuid default null,p_limit integer default 30)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_org uuid:=p_organization_id;v_athlete uuid;v_sessions jsonb;v_teams jsonb:='[]'::jsonb;v_coaches jsonb:='[]'::jsonb;v_can_create boolean:=false;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 v_athlete:=public.training_day_athlete_id(v_uid);
 if v_org is null then select (c->'selected'->>'organization_id')::uuid into v_org from (select public.my_context_center() c) x where c->'selected'->>'context_type'='organization'; end if;
 select coalesce(jsonb_agg(row_data order by row_data->>'starts_at' desc),'[]'::jsonb) into v_sessions
 from (
  select jsonb_build_object('id',s.id,'title',s.title,'starts_at',s.starts_at,'ends_at',s.ends_at,'venue_label',s.venue_label,'status',s.status,'published_at',s.published_at,'closed_at',s.closed_at,
    'team_id',s.team_id,'team_name',t.name,'age_category',t.age_category,'organization_id',s.organization_id,'organization_name',o.name_ar,
    'coach_name',coalesce(cp.display_name,cp.name),'plan_status',pl.status,
    'confirmed',(select count(*) from public.training_session_responses r where r.training_session_id=s.id and r.response_status='confirmed'),
    'roster',(select count(*) from public.team_athletes ta where ta.team_id=s.team_id and ta.status='active'),
    'present',(select count(*) from public.training_session_attendance a where a.training_session_id=s.id and a.attendance_status='present'),
    'evaluated',(select count(*) from public.coach_evaluations e where e.training_session_id=s.id and e.status='published')) row_data
  from public.training_sessions s join public.teams t on t.id=s.team_id join public.organizations o on o.id=s.organization_id
  left join public.profiles cp on cp.id=coalesce(s.assigned_coach_user_id,t.head_coach_user_id)
  left join public.training_session_plans pl on pl.training_session_id=s.id
  where (v_org is null or s.organization_id=v_org)
    and (public.training_day_can_manage_session(s.id,v_uid) or (v_athlete is not null and exists(select 1 from public.team_athletes ta where ta.team_id=s.team_id and ta.athlete_id=v_athlete and ta.status='active')))
  order by s.starts_at desc limit greatest(1,least(coalesce(p_limit,30),100))
 ) q;
 if v_org is not null and public.pillar_user_has_org_access(v_org,v_uid) then
  select exists(select 1 from public.teams t where t.organization_id=v_org and t.status='active' and public.training_day_can_manage_team(t.id,v_uid)) into v_can_create;
  if v_can_create then
   select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'season_label',t.season_label,'head_coach_user_id',t.head_coach_user_id) order by t.name),'[]'::jsonb)
   into v_teams from public.teams t where t.organization_id=v_org and t.status='active' and public.training_day_can_manage_team(t.id,v_uid);
   select coalesce(jsonb_agg(jsonb_build_object('user_id',p.id,'name',coalesce(p.display_name,p.name),'handle',p.handle,'avatar_url',p.avatar_url,'roles',roles.role_codes) order by coalesce(p.display_name,p.name)),'[]'::jsonb)
   into v_coaches from public.profiles p
   join lateral (select jsonb_agg(distinct m.role_code) role_codes from public.organization_memberships m where m.organization_id=v_org and m.user_id=p.id and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')) roles on roles.role_codes is not null;
  end if;
 end if;
 return jsonb_build_object('organization_id',v_org,'athlete_id',v_athlete,'can_create',v_can_create,'sessions',v_sessions,'teams',v_teams,'coaches',v_coaches);
end $$;
revoke all on function public.my_training_day_index(uuid,integer) from public,anon;
grant execute on function public.my_training_day_index(uuid,integer) to authenticated;;


-- MIGRATION 20261028201848 repair_training_day_plan_contract
alter table public.training_session_plans
  add column if not exists status text,
  add column if not exists objectives jsonb,
  add column if not exists phases jsonb,
  add column if not exists coach_notes text,
  add column if not exists total_duration_min integer,
  add column if not exists version integer,
  add column if not exists published_by_user_id uuid,
  add column if not exists published_at timestamptz;

update public.training_session_plans
set status=coalesce(status,'draft'),
    objectives=coalesce(objectives,case when objective is null or btrim(objective)='' then '[]'::jsonb else jsonb_build_array(objective) end),
    phases=coalesce(phases,'[]'::jsonb),
    coach_notes=coalesce(coach_notes,objective),
    total_duration_min=coalesce(total_duration_min,total_duration_minutes,0),
    version=coalesce(version,1)
where status is null or objectives is null or phases is null or total_duration_min is null or version is null;

alter table public.training_session_plans
  alter column status set default 'draft',
  alter column status set not null,
  alter column objectives set default '[]'::jsonb,
  alter column objectives set not null,
  alter column phases set default '[]'::jsonb,
  alter column phases set not null,
  alter column total_duration_min set default 0,
  alter column total_duration_min set not null,
  alter column version set default 1,
  alter column version set not null;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='training_session_plans_status_check' and conrelid='public.training_session_plans'::regclass) then
    alter table public.training_session_plans add constraint training_session_plans_status_check check(status in ('draft','published','completed','archived'));
  end if;
  if not exists(select 1 from pg_constraint where conname='training_session_plans_objectives_object_check' and conrelid='public.training_session_plans'::regclass) then
    alter table public.training_session_plans add constraint training_session_plans_objectives_object_check check(jsonb_typeof(objectives)='array');
  end if;
  if not exists(select 1 from pg_constraint where conname='training_session_plans_phases_array_check' and conrelid='public.training_session_plans'::regclass) then
    alter table public.training_session_plans add constraint training_session_plans_phases_array_check check(jsonb_typeof(phases)='array');
  end if;
  if not exists(select 1 from pg_constraint where conname='training_session_plans_duration_check' and conrelid='public.training_session_plans'::regclass) then
    alter table public.training_session_plans add constraint training_session_plans_duration_check check(total_duration_min between 0 and 600);
  end if;
end $$;

create or replace function public.create_my_training_day(
  p_organization_id uuid,
  p_team_id uuid,
  p_title text,
  p_session_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue_label text default null,
  p_assigned_coach_user_id uuid default null,
  p_objectives jsonb default '[]'::jsonb,
  p_focus text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_session public.training_sessions%rowtype;
  v_coach uuid:=p_assigned_coach_user_id;
  v_entity uuid;
  v_focus text:=nullif(trim(coalesce(p_focus,'')),'');
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 2 and 180 then raise exception 'invalid_session_title'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at or p_ends_at>p_starts_at+interval '8 hours' then raise exception 'invalid_session_time'; end if;
  if p_objectives is null or jsonb_typeof(p_objectives)<>'array' or jsonb_array_length(p_objectives)>20 then raise exception 'invalid_session_objectives'; end if;
  if not exists(select 1 from public.teams t where t.id=p_team_id and t.organization_id=p_organization_id and t.status='active') then raise exception 'active_team_required'; end if;
  if not public.training_day_can_manage_team(p_team_id,v_uid) then raise exception 'training_session_manage_denied'; end if;
  if v_coach is null and exists(select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.user_id=v_uid and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')) then v_coach:=v_uid; end if;
  if v_coach is null then select head_coach_user_id into v_coach from public.teams where id=p_team_id; end if;
  if v_coach is not null and not (public.pillar_user_has_org_access(p_organization_id,v_coach) and (
    exists(select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.user_id=v_coach and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach'))
    or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=p_organization_id and r.user_id=v_coach and r.status='active' and r.responsibility_code='coach')
  )) then raise exception 'assigned_coach_invalid'; end if;

  insert into public.training_sessions(team_id,organization_id,title,session_type,starts_at,ends_at,venue_label,status,created_by_user_id,assigned_coach_user_id,session_brief)
  values(p_team_id,p_organization_id,trim(p_title),coalesce(nullif(trim(p_session_type),''),'training'),p_starts_at,p_ends_at,
    nullif(trim(coalesce(p_venue_label,'')),''),'scheduled',v_uid,v_coach,jsonb_build_object('focus',v_focus,'objectives',p_objectives))
  returning * into v_session;

  insert into public.training_session_plans(
    training_session_id,organization_id,team_id,status,objectives,phases,coach_notes,total_duration_min,version,
    objective,total_duration_minutes,created_by_user_id,updated_by_user_id
  ) values(
    v_session.id,p_organization_id,p_team_id,'draft',p_objectives,'[]'::jsonb,v_focus,0,1,
    v_focus,0,v_uid,v_uid
  );

  insert into public.entities(entity_type,training_session_id,canonical_name,sport_code,status,visibility,metadata)
  values('training_session',v_session.id,v_session.title,'football','active','network',jsonb_build_object('organization_id',p_organization_id,'team_id',p_team_id))
  on conflict(training_session_id) where training_session_id is not null
  do update set canonical_name=excluded.canonical_name,updated_at=now()
  returning id into v_entity;

  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values('training_session_created',(select id from public.entities where profile_id=v_uid limit 1),v_entity,
    (select id from public.entities where organization_id=p_organization_id limit 1),v_entity,'training_session',v_session.id,
    v_session.title,'تم إنشاء حصة تدريبية مشتركة','network','verified',jsonb_build_object('team_id',p_team_id,'starts_at',p_starts_at,'status','scheduled'))
  on conflict do nothing;

  return jsonb_build_object('changed',true,'session',to_jsonb(v_session),'entity_id',v_entity);
end $$;

create or replace function public.save_my_training_plan(
  p_training_session_id uuid,
  p_objectives jsonb,
  p_phases jsonb,
  p_coach_notes text default null,
  p_publish boolean default false
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_total integer;
  v_plan public.training_session_plans%rowtype;
  v_session public.training_sessions%rowtype;
  v_notes text:=nullif(trim(coalesce(p_coach_notes,'')),'');
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.training_day_can_manage_session(p_training_session_id,v_uid) then raise exception 'training_session_manage_denied'; end if;
  if p_objectives is null or jsonb_typeof(p_objectives)<>'array' or jsonb_array_length(p_objectives)>20 then raise exception 'invalid_plan_objectives'; end if;
  if p_phases is null or jsonb_typeof(p_phases)<>'array' or jsonb_array_length(p_phases)>30 then raise exception 'invalid_plan_phases'; end if;
  if exists(select 1 from jsonb_array_elements(p_phases) x where jsonb_typeof(x)<>'object' or not (x ? 'title')
    or char_length(trim(coalesce(x->>'title','')))<2 or coalesce(x->>'duration_min','') !~ '^[0-9]+$' or (x->>'duration_min')::integer not between 1 and 180)
  then raise exception 'invalid_plan_phase'; end if;

  select * into v_session from public.training_sessions where id=p_training_session_id for update;
  if not found then raise exception 'training_session_not_found'; end if;
  if v_session.status in ('completed','cancelled') then raise exception 'training_session_locked'; end if;

  select coalesce(sum((x->>'duration_min')::integer),0) into v_total from jsonb_array_elements(p_phases) x;
  if v_total>600 then raise exception 'plan_duration_too_long'; end if;

  insert into public.training_session_plans(
    training_session_id,organization_id,team_id,status,objectives,phases,coach_notes,total_duration_min,version,
    objective,total_duration_minutes,published_by_user_id,published_at,created_by_user_id,updated_by_user_id
  ) values(
    p_training_session_id,v_session.organization_id,v_session.team_id,case when p_publish then 'published' else 'draft' end,
    p_objectives,p_phases,v_notes,v_total,1,v_notes,v_total,
    case when p_publish then v_uid else null end,case when p_publish then now() else null end,v_uid,v_uid
  )
  on conflict(training_session_id) do update set
    status=case when p_publish then 'published' else public.training_session_plans.status end,
    objectives=excluded.objectives,phases=excluded.phases,coach_notes=excluded.coach_notes,total_duration_min=excluded.total_duration_min,
    objective=excluded.objective,total_duration_minutes=excluded.total_duration_minutes,
    version=public.training_session_plans.version+1,
    published_by_user_id=case when p_publish then v_uid else public.training_session_plans.published_by_user_id end,
    published_at=case when p_publish then now() else public.training_session_plans.published_at end,
    updated_by_user_id=v_uid,updated_at=now()
  returning * into v_plan;

  update public.training_sessions set
    published_at=case when p_publish then coalesce(published_at,now()) else published_at end,
    version=version+1,
    session_brief=coalesce(session_brief,'{}'::jsonb)||jsonb_build_object('objectives',p_objectives,'focus',v_notes),
    updated_at=now()
  where id=p_training_session_id
  returning * into v_session;

  insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
  values(case when p_publish then 'training_plan_published' else 'training_plan_updated' end,
    (select id from public.entities where profile_id=v_uid limit 1),public.training_day_session_entity(p_training_session_id),
    (select id from public.entities where organization_id=v_session.organization_id limit 1),public.training_day_session_entity(p_training_session_id),
    'training_session_plan',v_plan.id,v_session.title,
    case when p_publish then 'نُشرت خطة الحصة للاعبين' else 'حُدثت مسودة خطة الحصة' end,
    case when p_publish then 'network' else 'private' end,'verified',
    jsonb_build_object('session_id',p_training_session_id,'version',v_plan.version,'duration_min',v_total))
  on conflict do nothing;

  return jsonb_build_object('changed',true,'plan',to_jsonb(v_plan),'session',to_jsonb(v_session));
end $$;

revoke all on function public.create_my_training_day(uuid,uuid,text,text,timestamptz,timestamptz,text,uuid,jsonb,text) from public,anon;
revoke all on function public.save_my_training_plan(uuid,jsonb,jsonb,text,boolean) from public,anon;
grant execute on function public.create_my_training_day(uuid,uuid,text,text,timestamptz,timestamptz,text,uuid,jsonb,text) to authenticated;
grant execute on function public.save_my_training_plan(uuid,jsonb,jsonb,text,boolean) to authenticated;

comment on table public.training_session_plans is 'Unified training-day plan contract compatible with legacy planner fields and the new multi-role workflow.';;


-- MIGRATION 20261028202115 complete_golden_training_day_contract
create or replace function public.my_training_day_index(p_organization_id uuid default null,p_limit integer default 30)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();v_org uuid:=p_organization_id;v_athlete uuid;v_sessions jsonb;v_teams jsonb:='[]'::jsonb;v_coaches jsonb:='[]'::jsonb;v_can_create boolean:=false;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.training_day_athlete_id(v_uid);
  if v_org is null then
    select (c->'selected'->>'organization_id')::uuid into v_org from (select public.my_context_center() c) x where c->'selected'->>'context_type'='organization';
  end if;
  select coalesce(jsonb_agg(row_data order by (row_data->>'starts_at')::timestamptz desc),'[]'::jsonb) into v_sessions
  from (
    select jsonb_build_object(
      'id',s.id,'title',s.title,'starts_at',s.starts_at,'ends_at',s.ends_at,'venue_label',s.venue_label,
      'status',s.status,'published_at',s.published_at,'closed_at',s.closed_at,
      'team_id',s.team_id,'team_name',t.name,'age_category',t.age_category,
      'organization_id',s.organization_id,'organization_name',o.name_ar,
      'coach_name',coalesce(cp.display_name,cp.name),
      'plan_status',coalesce(pl.status,case when pl.id is null then 'not_started' when s.published_at is not null then 'published' else 'draft' end),
      'confirmed',(select count(*) from public.training_session_responses r where r.training_session_id=s.id and r.response_status='confirmed'),
      'roster',(select count(*) from public.team_athletes ta where ta.team_id=s.team_id and ta.status='active'),
      'present',(select count(*) from public.training_session_attendance a where a.training_session_id=s.id and a.attendance_status in ('attended','partial')),
      'evaluated',(select count(distinct e.athlete_id) from public.coach_evaluations e where e.training_session_id=s.id and e.status='published')
    ) row_data
    from public.training_sessions s
    join public.teams t on t.id=s.team_id
    join public.organizations o on o.id=s.organization_id
    left join public.profiles cp on cp.id=coalesce(s.assigned_coach_user_id,t.head_coach_user_id)
    left join public.training_session_plans pl on pl.training_session_id=s.id
    where (v_org is null or s.organization_id=v_org)
      and (public.training_day_can_manage_session(s.id,v_uid)
        or (v_athlete is not null and exists(select 1 from public.team_athletes ta where ta.team_id=s.team_id and ta.athlete_id=v_athlete and ta.status='active')))
    order by s.starts_at desc
    limit greatest(1,least(coalesce(p_limit,30),100))
  ) q;
  if v_org is not null and public.pillar_user_has_org_access(v_org,v_uid) then
    select exists(select 1 from public.teams t where t.organization_id=v_org and t.status='active' and public.training_day_can_manage_team(t.id,v_uid)) into v_can_create;
    if v_can_create then
      select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'season_label',t.season_label,'head_coach_user_id',t.head_coach_user_id) order by t.name),'[]'::jsonb)
      into v_teams from public.teams t where t.organization_id=v_org and t.status='active' and public.training_day_can_manage_team(t.id,v_uid);
      select coalesce(jsonb_agg(jsonb_build_object('user_id',p.id,'name',coalesce(p.display_name,p.name),'handle',p.handle,'avatar_url',p.avatar_url,'roles',roles.role_codes) order by coalesce(p.display_name,p.name)),'[]'::jsonb)
      into v_coaches from public.profiles p
      join lateral (
        select jsonb_agg(distinct m.role_code) role_codes
        from public.organization_memberships m
        where m.organization_id=v_org and m.user_id=p.id and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')
      ) roles on roles.role_codes is not null;
    end if;
  end if;
  return jsonb_build_object('organization_id',v_org,'athlete_id',v_athlete,'can_create',v_can_create,'sessions',v_sessions,'teams',v_teams,'coaches',v_coaches);
end $$;

create or replace function public.evaluate_my_training_athlete(
  p_training_session_id uuid,
  p_athlete_id uuid,
  p_technical numeric default null,
  p_tactical numeric default null,
  p_physical numeric default null,
  p_mentality numeric default null,
  p_notes text default null,
  p_visibility text default 'athlete'
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_session public.training_sessions%rowtype;
  v_eval public.coach_evaluations%rowtype;
  v_athlete_entity uuid;
  v_session_entity uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.training_day_can_manage_session(p_training_session_id,v_uid) then raise exception 'training_session_manage_denied'; end if;
  select * into v_session from public.training_sessions where id=p_training_session_id;
  if not found then raise exception 'training_session_not_found'; end if;
  if v_session.status in ('completed','cancelled') then raise exception 'training_session_locked'; end if;
  if not exists(select 1 from public.team_athletes ta where ta.team_id=v_session.team_id and ta.athlete_id=p_athlete_id and ta.status='active') then raise exception 'athlete_not_on_training_team'; end if;
  if p_visibility not in ('athlete','athlete_guardian','organization','network','private') then raise exception 'invalid_visibility'; end if;
  if (p_technical is not null and (p_technical<0 or p_technical>10))
    or (p_tactical is not null and (p_tactical<0 or p_tactical>10))
    or (p_physical is not null and (p_physical<0 or p_physical>10))
    or (p_mentality is not null and (p_mentality<0 or p_mentality>10)) then
    raise exception 'evaluation_scores_must_be_between_0_and_10';
  end if;
  if num_nonnulls(p_technical,p_tactical,p_physical,p_mentality)=0 then raise exception 'evaluation_score_required'; end if;

  insert into public.coach_evaluations(
    athlete_id,coach_user_id,organization_id,evaluation_type,technical_score,tactical_score,physical_score,mentality_score,
    notes,visibility,evaluated_at,training_session_id,evidence,status
  ) values(
    p_athlete_id,v_uid,v_session.organization_id,'training',p_technical,p_tactical,p_physical,p_mentality,
    nullif(btrim(coalesce(p_notes,'')),''),p_visibility,now(),p_training_session_id,
    jsonb_build_object('training_session_id',p_training_session_id,'team_id',v_session.team_id,'source','golden_training_day'),'published'
  )
  on conflict(training_session_id,athlete_id,coach_user_id) where training_session_id is not null
  do update set technical_score=excluded.technical_score,tactical_score=excluded.tactical_score,
    physical_score=excluded.physical_score,mentality_score=excluded.mentality_score,notes=excluded.notes,
    visibility=excluded.visibility,evaluated_at=now(),evidence=excluded.evidence,status='published',updated_at=now()
  returning * into v_eval;

  select public.core_athlete_entity_id(p_athlete_id) into v_athlete_entity;
  select public.training_day_session_entity(p_training_session_id) into v_session_entity;
  insert into public.entity_activity_events(
    event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,
    title,summary,visibility,verification_status,payload
  ) values(
    'training_evaluation_published',(select id from public.entities where profile_id=v_uid limit 1),v_athlete_entity,
    (select id from public.entities where organization_id=v_session.organization_id limit 1),v_session_entity,
    'coach_evaluation',v_eval.id,'تقييم الحصة التدريبية',coalesce(v_eval.notes,'أضاف المدرب تقييمًا بعد الحصة'),
    case when p_visibility='network' then 'network' else 'private' end,'verified',
    jsonb_build_object('training_session_id',p_training_session_id,'athlete_id',p_athlete_id,
      'technical',p_technical,'tactical',p_tactical,'physical',p_physical,'mentality',p_mentality)
  ) on conflict do nothing;

  return jsonb_build_object('changed',true,'evaluation',to_jsonb(v_eval));
end $$;

create or replace function public.close_my_training_day(p_training_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_session public.training_sessions%rowtype;
  v_completion jsonb;
  v_eval record;
  v_assessment public.player_assessments%rowtype;
  v_count integer:=0;
  v_visibility text;
  v_avg numeric;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.training_day_can_manage_session(p_training_session_id,v_uid) then raise exception 'training_session_manage_denied'; end if;
  select * into v_session from public.training_sessions where id=p_training_session_id;
  if not found then raise exception 'training_session_not_found'; end if;

  v_completion:=public.complete_my_training_session(p_training_session_id);
  update public.training_sessions set closed_at=coalesce(closed_at,now()),updated_at=now() where id=p_training_session_id returning * into v_session;
  update public.training_session_plans set status='completed',updated_by_user_id=v_uid,updated_at=now()
    where training_session_id=p_training_session_id and status<>'archived';

  for v_eval in
    select distinct on(e.athlete_id) e.*
    from public.coach_evaluations e
    where e.training_session_id=p_training_session_id and e.status='published'
    order by e.athlete_id,e.evaluated_at desc
  loop
    v_visibility:=case v_eval.visibility
      when 'athlete' then 'athlete'
      when 'guardian' then 'athlete_guardian'
      when 'athlete_guardian' then 'athlete_guardian'
      when 'network' then 'network'
      when 'private' then 'private'
      else 'organization' end;
    insert into public.player_assessments(
      organization_id,team_id,season_id,athlete_id,assessment_type,period_label,summary,status,visibility,
      created_by_user_id,updated_by_user_id,approved_by_user_id,approved_at,verification_source,training_session_id
    ) values(
      v_session.organization_id,v_session.team_id,null,v_eval.athlete_id,'training_session',
      to_char(v_session.starts_at at time zone 'Asia/Riyadh','YYYY-MM-DD')||' · '||v_session.title,
      v_eval.notes,'approved',v_visibility,v_eval.coach_user_id,v_uid,v_uid,now(),'coach',p_training_session_id
    )
    on conflict(training_session_id,athlete_id) where training_session_id is not null
    do update set summary=excluded.summary,status='approved',visibility=excluded.visibility,
      updated_by_user_id=v_uid,approved_by_user_id=v_uid,approved_at=now(),verification_source='coach',updated_at=now()
    returning * into v_assessment;

    insert into public.player_assessment_dimensions(assessment_id,dimension_code,score,note)
    values
      (v_assessment.id,'technical',v_eval.technical_score,null),
      (v_assessment.id,'tactical',v_eval.tactical_score,null),
      (v_assessment.id,'physical',v_eval.physical_score,null),
      (v_assessment.id,'mentality',v_eval.mentality_score,null)
    on conflict(assessment_id,dimension_code) do update set score=excluded.score,note=excluded.note;

    for v_avg in select * from unnest(array[v_eval.technical_score,v_eval.tactical_score,v_eval.physical_score,v_eval.mentality_score]) loop
      null;
    end loop;

    insert into public.performance_metrics(athlete_id,training_session_id,metric_code,metric_value,unit,source_type,verification_status,recorded_at,metadata)
    select v_eval.athlete_id,p_training_session_id,x.code,x.value,'/10','coach','verified',coalesce(v_session.ends_at,now()),
      jsonb_build_object('coach_evaluation_id',v_eval.id,'assessment_id',v_assessment.id)
    from (values
      ('training_technical',v_eval.technical_score),
      ('training_tactical',v_eval.tactical_score),
      ('training_physical',v_eval.physical_score),
      ('training_mentality',v_eval.mentality_score)
    ) x(code,value)
    where x.value is not null and not exists(
      select 1 from public.performance_metrics pm
      where pm.athlete_id=v_eval.athlete_id and pm.training_session_id=p_training_session_id and pm.metric_code=x.code
    );
    v_count:=v_count+1;
  end loop;

  insert into public.entity_activity_events(
    event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,
    title,summary,visibility,verification_status,payload
  ) values(
    'training_day_closed',(select id from public.entities where profile_id=v_uid limit 1),
    public.training_day_session_entity(p_training_session_id),
    (select id from public.entities where organization_id=v_session.organization_id limit 1),
    public.training_day_session_entity(p_training_session_id),'training_session',p_training_session_id,
    v_session.title,'أُغلقت الحصة وتحدثت سجلات الأداء والهوية','network','verified',
    jsonb_build_object('training_session_id',p_training_session_id,'assessment_count',v_count,'attendance_rows',coalesce((v_completion->>'attendance_rows')::integer,0))
  ) on conflict do nothing;

  return jsonb_build_object('completed',true,'session',to_jsonb(v_session),'assessments_created',v_count,'completion',v_completion);
end $$;

create or replace function public.my_training_day_center(p_training_session_id uuid default null,p_organization_id uuid default null)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();v_session public.training_sessions%rowtype;v_session_id uuid:=p_training_session_id;
  v_org uuid:=p_organization_id;v_athlete uuid;v_mode text;v_can_manage boolean:=false;v_is_athlete boolean:=false;
  v_plan jsonb;v_roster jsonb;v_stats jsonb;v_own_response jsonb;v_own_readiness jsonb;v_own_evaluation jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_athlete:=public.training_day_athlete_id(v_uid);
  if v_org is null then select (c->'selected'->>'organization_id')::uuid into v_org from (select public.my_context_center() c) x where c->'selected'->>'context_type'='organization'; end if;
  if v_session_id is null then
    if v_athlete is not null then
      select s.id into v_session_id from public.training_sessions s
      join public.team_athletes ta on ta.team_id=s.team_id and ta.athlete_id=v_athlete and ta.status='active'
      where s.status in ('scheduled','in_progress') and s.starts_at>=now()-interval '12 hours'
      order by s.starts_at limit 1;
    end if;
    if v_session_id is null then
      select s.id into v_session_id from public.training_sessions s join public.teams t on t.id=s.team_id
      where s.status in ('scheduled','in_progress') and s.starts_at>=now()-interval '12 hours'
        and (s.assigned_coach_user_id=v_uid or t.head_coach_user_id=v_uid
          or (v_org is not null and s.organization_id=v_org and public.training_day_can_manage_team(s.team_id,v_uid)))
      order by s.starts_at limit 1;
    end if;
    if v_session_id is null and v_org is not null and public.pillar_user_has_org_access(v_org,v_uid) then
      select s.id into v_session_id from public.training_sessions s where s.organization_id=v_org
      order by case when s.status in ('scheduled','in_progress') and s.starts_at>=now()-interval '12 hours' then 0 else 1 end,s.starts_at desc limit 1;
    end if;
    if v_session_id is null and v_athlete is not null then
      select s.id into v_session_id from public.training_sessions s
      join public.team_athletes ta on ta.team_id=s.team_id and ta.athlete_id=v_athlete and ta.status='active'
      order by s.starts_at desc limit 1;
    end if;
  end if;
  if v_session_id is null then
    return jsonb_build_object('session',null,'mode',case when v_athlete is not null then 'player' else 'organization' end,
      'can_create',v_org is not null and public.pillar_user_has_org_access(v_org,v_uid),'organization_id',v_org,'athlete_id',v_athlete);
  end if;
  select * into v_session from public.training_sessions where id=v_session_id;
  if not found then raise exception 'training_session_not_found'; end if;
  v_can_manage:=public.training_day_can_manage_session(v_session.id,v_uid);
  v_is_athlete:=public.training_day_is_session_athlete(v_session.id,v_uid);
  if not v_can_manage and not v_is_athlete then raise exception 'training_session_access_denied'; end if;
  v_mode:=case when v_is_athlete and not v_can_manage then 'player'
    when v_session.assigned_coach_user_id=v_uid
      or exists(select 1 from public.teams t where t.id=v_session.team_id and t.head_coach_user_id=v_uid)
      or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=v_session.organization_id and r.user_id=v_uid and r.status='active' and r.responsibility_code='coach')
    then 'coach' else 'academy' end;

  select case when v_mode='player' and p.status not in ('published','completed') then null else jsonb_build_object(
    'id',p.id,'status',p.status,'objectives',p.objectives,'phases',p.phases,'coach_notes',p.coach_notes,
    'total_duration_min',p.total_duration_min,'version',p.version,'published_at',p.published_at) end
  into v_plan from public.training_session_plans p where p.training_session_id=v_session.id;

  select coalesce(jsonb_agg(row_data order by row_data->>'name'),'[]'::jsonb) into v_roster
  from (
    select jsonb_build_object(
      'athlete_id',ap.id,'user_id',ap.user_id,'name',coalesce(pr.display_name,pr.name,'لاعب'),'avatar_url',pr.avatar_url,
      'position',coalesce(ta.primary_position,ap.primary_position),'jersey_number',ta.jersey_number,
      'response_status',case when v_mode='player' and ap.id<>v_athlete then null else rsp.response_status end,
      'responded_at',case when v_mode='player' and ap.id<>v_athlete then null else rsp.responded_at end,
      'readiness_state',case when v_mode='player' and ap.id<>v_athlete then null else rd.readiness_state end,
      'readiness_score',case when v_mode='player' and ap.id<>v_athlete then null else rd.readiness_score end,
      'attendance_status',case when v_mode='player' and ap.id<>v_athlete then null else att.attendance_status end,
      'minutes_participated',case when v_mode='player' and ap.id<>v_athlete then null else att.minutes_participated end,
      'perceived_exertion',case when v_mode='player' and ap.id<>v_athlete then null else att.perceived_exertion end,
      'evaluation',case when v_mode='player' and ap.id<>v_athlete then null when ev.id is null then null else jsonb_build_object(
        'id',ev.id,'technical_score',ev.technical_score,'tactical_score',ev.tactical_score,'physical_score',ev.physical_score,
        'mentality_score',ev.mentality_score,'notes',ev.notes,'evaluated_at',ev.evaluated_at,'status',ev.status,'visibility',ev.visibility) end
    ) row_data
    from public.team_athletes ta
    join public.athlete_profiles ap on ap.id=ta.athlete_id
    left join public.profiles pr on pr.id=ap.user_id
    left join public.training_session_responses rsp on rsp.training_session_id=v_session.id and rsp.athlete_id=ap.id
    left join public.athlete_readiness_checkins rd on rd.training_session_id=v_session.id and rd.athlete_id=ap.id
    left join lateral (select a.* from public.training_session_attendance a where a.training_session_id=v_session.id and a.athlete_id=ap.id order by a.updated_at desc limit 1) att on true
    left join lateral (select e.* from public.coach_evaluations e where e.training_session_id=v_session.id and e.athlete_id=ap.id and e.status='published' order by e.evaluated_at desc limit 1) ev on true
    where ta.team_id=v_session.team_id and ta.status='active'
  ) r;

  select jsonb_build_object(
    'roster',count(*),'confirmed',count(*) filter(where rsp.response_status='confirmed'),
    'declined',count(*) filter(where rsp.response_status='declined'),'awaiting_response',count(*) filter(where rsp.id is null),
    'ready',count(*) filter(where rd.readiness_state='ready'),'limited',count(*) filter(where rd.readiness_state='limited'),
    'unavailable',count(*) filter(where rd.readiness_state in ('unavailable','follow_up')),
    'present',count(*) filter(where att.attendance_status='attended'),
    'partial',count(*) filter(where att.attendance_status='partial'),
    'missed',count(*) filter(where att.attendance_status='missed'),
    'excused',count(*) filter(where att.attendance_status='excused'),
    'late',count(*) filter(where att.attendance_status='partial'),
    'absent',count(*) filter(where att.attendance_status in ('missed','excused')),
    'evaluated',count(*) filter(where ev.id is not null)
  ) into v_stats
  from public.team_athletes ta
  join public.athlete_profiles ap on ap.id=ta.athlete_id
  left join public.training_session_responses rsp on rsp.training_session_id=v_session.id and rsp.athlete_id=ap.id
  left join public.athlete_readiness_checkins rd on rd.training_session_id=v_session.id and rd.athlete_id=ap.id
  left join lateral (select a.* from public.training_session_attendance a where a.training_session_id=v_session.id and a.athlete_id=ap.id order by a.updated_at desc limit 1) att on true
  left join lateral (select e.* from public.coach_evaluations e where e.training_session_id=v_session.id and e.athlete_id=ap.id and e.status='published' order by e.evaluated_at desc limit 1) ev on true
  where ta.team_id=v_session.team_id and ta.status='active';

  if v_athlete is not null then
    select to_jsonb(x) into v_own_response from (select id,response_status,reason,responded_at from public.training_session_responses where training_session_id=v_session.id and athlete_id=v_athlete) x;
    select jsonb_build_object('id',r.id,'sleep_hours',r.sleep_hours,'sleep_quality',r.sleep_quality,'fatigue_level',r.fatigue_level,
      'fuel_level',r.fuel_level,'pain_flag',r.pain_flag,'readiness_score',r.readiness_score,'readiness_state',r.readiness_state,
      'private_note',r.private_note,'updated_at',r.updated_at) into v_own_readiness
    from public.athlete_readiness_checkins r where r.training_session_id=v_session.id and r.athlete_id=v_athlete;
    select jsonb_build_object('id',e.id,'technical_score',e.technical_score,'tactical_score',e.tactical_score,
      'physical_score',e.physical_score,'mentality_score',e.mentality_score,'notes',e.notes,'evaluated_at',e.evaluated_at,
      'status',e.status,'visibility',e.visibility)
    into v_own_evaluation from public.coach_evaluations e
    where e.training_session_id=v_session.id and e.athlete_id=v_athlete and e.status='published'
    order by e.evaluated_at desc limit 1;
  end if;

  return jsonb_build_object(
    'mode',v_mode,'can_manage',v_can_manage,'can_create',v_can_manage,
    'can_close',v_can_manage and v_session.status not in ('completed','cancelled'),'athlete_id',v_athlete,
    'session',jsonb_build_object('id',v_session.id,'title',v_session.title,'session_type',v_session.session_type,
      'starts_at',v_session.starts_at,'ends_at',v_session.ends_at,'venue_label',v_session.venue_label,'status',v_session.status,
      'team_id',v_session.team_id,'organization_id',v_session.organization_id,'assigned_coach_user_id',v_session.assigned_coach_user_id,
      'published_at',v_session.published_at,'closed_at',v_session.closed_at,'version',v_session.version,
      'session_brief',v_session.session_brief,'entity_id',public.training_day_session_entity(v_session.id)),
    'team',(select jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'season_label',t.season_label,'head_coach_user_id',t.head_coach_user_id) from public.teams t where t.id=v_session.team_id),
    'organization',(select jsonb_build_object('id',o.id,'name_ar',o.name_ar,'name_en',o.name_en,'city',o.city,'is_verified',o.is_verified) from public.organizations o where o.id=v_session.organization_id),
    'coach',(select jsonb_build_object('id',p.id,'name',coalesce(p.display_name,p.name),'avatar_url',p.avatar_url,'handle',p.handle) from public.profiles p where p.id=coalesce(v_session.assigned_coach_user_id,(select t.head_coach_user_id from public.teams t where t.id=v_session.team_id))),
    'plan',v_plan,'stats',v_stats,'roster',v_roster,'own_response',v_own_response,'own_readiness',v_own_readiness,'own_evaluation',v_own_evaluation
  );
end $$;

revoke all on function public.evaluate_my_training_athlete(uuid,uuid,numeric,numeric,numeric,numeric,text,text) from public,anon;
revoke all on function public.close_my_training_day(uuid) from public,anon;
revoke all on function public.my_training_day_index(uuid,integer) from public,anon;
revoke all on function public.my_training_day_center(uuid,uuid) from public,anon;
grant execute on function public.evaluate_my_training_athlete(uuid,uuid,numeric,numeric,numeric,numeric,text,text) to authenticated;
grant execute on function public.close_my_training_day(uuid) to authenticated;
grant execute on function public.my_training_day_index(uuid,integer) to authenticated;
grant execute on function public.my_training_day_center(uuid,uuid) to authenticated;

comment on function public.evaluate_my_training_athlete(uuid,uuid,numeric,numeric,numeric,numeric,text,text) is 'Session-scoped coach evaluation for the Golden Training Day journey.';
comment on function public.close_my_training_day(uuid) is 'Closes one training day and propagates verified attendance, assessments, metrics, and identity timeline events.';;


-- MIGRATION 20261028203400 allow_zero_duration_training_plan_drafts
alter table public.training_session_plans
  drop constraint if exists training_session_plans_total_duration_minutes_check;
alter table public.training_session_plans
  add constraint training_session_plans_total_duration_minutes_check
  check (total_duration_minutes is null or (total_duration_minutes between 0 and 360));
comment on constraint training_session_plans_total_duration_minutes_check on public.training_session_plans is
  'Draft plans may start at zero minutes; published plans are validated by save_my_training_plan phases.';

-- MIGRATION 20261028203600 align_legacy_training_manager_with_assigned_coach
create or replace function private.training_user_can_manage_session(p_session_id uuid,p_user_id uuid)
returns boolean
language sql
stable security definer
set search_path=''
as $$
  select public.training_day_can_manage_session(p_session_id,p_user_id)
$$;
comment on function private.training_user_can_manage_session(uuid,uuid) is
  'Compatibility helper aligned with Golden Training Day assigned-coach and team responsibility permissions.';

-- MIGRATION 20261028203800 allow_training_session_performance_source
alter table public.performance_metrics
  drop constraint if exists performance_metrics_source_type_check;
alter table public.performance_metrics
  add constraint performance_metrics_source_type_check
  check (source_type = any(array['derived','integration','coach','manual','system','organization','technical_staff','training_session']));
comment on constraint performance_metrics_source_type_check on public.performance_metrics is
  'Includes direct verified metrics produced by a completed training session.';
