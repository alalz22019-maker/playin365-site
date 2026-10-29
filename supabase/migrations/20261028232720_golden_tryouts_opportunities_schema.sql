alter table public.opportunities
  add column if not exists sports_event_id uuid references public.sports_events(id) on delete set null,
  add column if not exists team_id uuid references public.teams(id) on delete set null,
  add column if not exists venue_id uuid references public.venues(id) on delete set null,
  add column if not exists capacity integer,
  add column if not exists guardian_gate_required boolean not null default false,
  add column if not exists requirements jsonb not null default '{}'::jsonb,
  add column if not exists application_form jsonb not null default '{}'::jsonb,
  add column if not exists evaluation_schema jsonb not null default '{"dimensions":[{"code":"technical","label_ar":"فني","weight":30},{"code":"tactical","label_ar":"تكتيكي","weight":25},{"code":"physical","label_ar":"بدني","weight":25},{"code":"mentality","label_ar":"ذهني","weight":20}]}'::jsonb,
  add column if not exists registration_fee_plan_id uuid references public.organization_fee_plans(id) on delete set null,
  add column if not exists published_at timestamptz,
  add column if not exists created_by_user_id uuid,
  add column if not exists is_demo boolean not null default false;

alter table public.opportunities
  drop constraint if exists opportunities_capacity_check,
  add constraint opportunities_capacity_check check (capacity is null or capacity > 0),
  drop constraint if exists opportunities_requirements_object_check,
  add constraint opportunities_requirements_object_check check (jsonb_typeof(requirements)='object'),
  drop constraint if exists opportunities_application_form_object_check,
  add constraint opportunities_application_form_object_check check (jsonb_typeof(application_form)='object'),
  drop constraint if exists opportunities_evaluation_schema_object_check,
  add constraint opportunities_evaluation_schema_object_check check (jsonb_typeof(evaluation_schema)='object'),
  drop constraint if exists opportunities_date_order_check,
  add constraint opportunities_date_order_check check (closes_at is null or opens_at is null or closes_at > opens_at);

alter table public.opportunity_candidates
  add column if not exists event_registration_id uuid references public.event_registrations(id) on delete set null,
  add column if not exists application_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists application_answers jsonb not null default '{}'::jsonb,
  add column if not exists eligibility_status text not null default 'pending',
  add column if not exists document_status text not null default 'not_required',
  add column if not exists check_in_status text not null default 'not_required',
  add column if not exists checked_in_at timestamptz,
  add column if not exists evaluated_at timestamptz,
  add column if not exists final_score numeric(5,2),
  add column if not exists recommendation text,
  add column if not exists accepted_at timestamptz,
  add column if not exists withdrawn_at timestamptz,
  add column if not exists updated_by_user_id uuid,
  add column if not exists is_demo boolean not null default false;

alter table public.opportunity_candidates
  drop constraint if exists opportunity_candidates_stage_check,
  add constraint opportunity_candidates_stage_check check (stage = any(array[
    'invited','applied','review','shortlisted','trial','waitlisted','offer','accepted','rejected','withdrawn'
  ])),
  drop constraint if exists opportunity_candidates_eligibility_status_check,
  add constraint opportunity_candidates_eligibility_status_check check (eligibility_status = any(array['pending','eligible','needs_info','ineligible'])),
  drop constraint if exists opportunity_candidates_document_status_check,
  add constraint opportunity_candidates_document_status_check check (document_status = any(array['not_required','pending','complete','rejected'])),
  drop constraint if exists opportunity_candidates_check_in_status_check,
  add constraint opportunity_candidates_check_in_status_check check (check_in_status = any(array['not_required','pending','checked_in','no_show'])),
  drop constraint if exists opportunity_candidates_application_snapshot_object_check,
  add constraint opportunity_candidates_application_snapshot_object_check check (jsonb_typeof(application_snapshot)='object'),
  drop constraint if exists opportunity_candidates_application_answers_object_check,
  add constraint opportunity_candidates_application_answers_object_check check (jsonb_typeof(application_answers)='object'),
  drop constraint if exists opportunity_candidates_final_score_check,
  add constraint opportunity_candidates_final_score_check check (final_score is null or (final_score between 0 and 100));

alter table public.athlete_offers
  add column if not exists candidate_id uuid references public.opportunity_candidates(id) on delete set null,
  add column if not exists team_id uuid references public.teams(id) on delete set null,
  add column if not exists offered_by_user_id uuid,
  add column if not exists message text,
  add column if not exists accepted_at timestamptz,
  add column if not exists decided_by_user_id uuid;

create unique index if not exists athlete_offers_candidate_active_uq
  on public.athlete_offers(candidate_id)
  where candidate_id is not null and status in ('draft','sent','pending_guardian','accepted');

create index if not exists opportunities_org_status_closes_idx
  on public.opportunities(organization_id,status,closes_at desc);
create index if not exists opportunities_event_idx on public.opportunities(sports_event_id);
create index if not exists opportunities_team_idx on public.opportunities(team_id);
create index if not exists opportunity_candidates_pipeline_idx
  on public.opportunity_candidates(opportunity_id,stage,created_at desc);
create index if not exists opportunity_candidates_event_registration_idx
  on public.opportunity_candidates(event_registration_id);

create table if not exists public.opportunity_candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.opportunity_candidates(id) on delete cascade,
  document_type text not null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  storage_path text,
  checksum_sha256 text,
  status text not null default 'submitted' check (status in ('submitted','verified','rejected','not_required')),
  visibility text not null default 'organization' check (visibility in ('private','guardian','organization')),
  note text,
  uploaded_by_user_id uuid not null,
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunity_candidate_documents_candidate_idx
  on public.opportunity_candidate_documents(candidate_id,status,created_at desc);
alter table public.opportunity_candidate_documents enable row level security;
revoke all on public.opportunity_candidate_documents from anon,authenticated;

create table if not exists public.opportunity_evaluations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.opportunity_candidates(id) on delete cascade,
  evaluator_user_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sports_event_id uuid references public.sports_events(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published','void')),
  recommendation text check (recommendation is null or recommendation in ('select','waitlist','reject','observe')),
  overall_score numeric(5,2) check (overall_score is null or overall_score between 0 and 100),
  athlete_summary text,
  staff_note text,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence)='object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_id,evaluator_user_id)
);
create index if not exists opportunity_evaluations_candidate_idx
  on public.opportunity_evaluations(candidate_id,status,created_at desc);
create index if not exists opportunity_evaluations_org_idx
  on public.opportunity_evaluations(organization_id,status,created_at desc);
alter table public.opportunity_evaluations enable row level security;
revoke all on public.opportunity_evaluations from anon,authenticated;

create table if not exists public.opportunity_evaluation_dimensions (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.opportunity_evaluations(id) on delete cascade,
  dimension_code text not null,
  label_ar text,
  score numeric(5,2) not null check (score between 0 and 100),
  weight numeric(6,3) not null default 1 check (weight > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(evaluation_id,dimension_code)
);
create index if not exists opportunity_evaluation_dimensions_eval_idx
  on public.opportunity_evaluation_dimensions(evaluation_id);
alter table public.opportunity_evaluation_dimensions enable row level security;
revoke all on public.opportunity_evaluation_dimensions from anon,authenticated;

create table if not exists public.opportunity_stage_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.opportunity_candidates(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  actor_user_id uuid,
  actor_organization_id uuid references public.organizations(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  occurred_at timestamptz not null default now()
);
create index if not exists opportunity_stage_events_candidate_idx
  on public.opportunity_stage_events(candidate_id,occurred_at desc);
alter table public.opportunity_stage_events enable row level security;
revoke all on public.opportunity_stage_events from anon,authenticated;

create table if not exists public.opportunity_admissions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.opportunity_candidates(id) on delete cascade,
  offer_id uuid unique references public.athlete_offers(id) on delete set null,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  membership_id uuid references public.organization_memberships(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  fee_plan_id uuid references public.organization_fee_plans(id) on delete set null,
  status text not null default 'pending_activation' check (status in ('pending_guardian','pending_player','pending_finance','pending_activation','active','rejected','cancelled')),
  accepted_at timestamptz,
  activated_at timestamptz,
  activated_by_user_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunity_admissions_org_status_idx
  on public.opportunity_admissions(organization_id,status,created_at desc);
create index if not exists opportunity_admissions_athlete_idx
  on public.opportunity_admissions(athlete_id,created_at desc);
alter table public.opportunity_admissions enable row level security;
revoke all on public.opportunity_admissions from anon,authenticated;

create or replace function private.capture_opportunity_stage_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='INSERT' then
    insert into public.opportunity_stage_events(candidate_id,from_stage,to_stage,actor_user_id,actor_organization_id,metadata)
    select new.id,null,new.stage,auth.uid(),o.organization_id,jsonb_build_object('source','candidate_insert')
    from public.opportunities o where o.id=new.opportunity_id;
  elsif new.stage is distinct from old.stage then
    insert into public.opportunity_stage_events(candidate_id,from_stage,to_stage,actor_user_id,actor_organization_id,metadata)
    select new.id,old.stage,new.stage,auth.uid(),o.organization_id,jsonb_build_object('source','candidate_update')
    from public.opportunities o where o.id=new.opportunity_id;
  end if;
  return new;
end $$;
revoke all on function private.capture_opportunity_stage_change() from public,anon,authenticated;

drop trigger if exists trg_opportunity_candidate_stage_history on public.opportunity_candidates;
create trigger trg_opportunity_candidate_stage_history
after insert or update of stage on public.opportunity_candidates
for each row execute function private.capture_opportunity_stage_change();

create or replace function private.opportunity_user_can_manage(p_opportunity_id uuid,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1 from public.opportunities o
    where o.id=p_opportunity_id
      and public.organization_user_has_permission(o.organization_id,p_user_id,'manage_opportunities')
  )
$$;

create or replace function private.opportunity_user_can_evaluate(p_opportunity_id uuid,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.opportunities o
    where o.id=p_opportunity_id and (
      public.organization_user_has_permission(o.organization_id,p_user_id,'manage_opportunities')
      or exists(
        select 1 from public.organization_memberships m
        where m.organization_id=o.organization_id and m.user_id=p_user_id and m.status='active'
          and m.role_code in ('coach','head_coach','assistant_coach','technical_staff','performance_analyst','performance')
      )
      or exists(
        select 1 from public.teams t
        where t.id=o.team_id and t.head_coach_user_id=p_user_id
      )
    )
  )
$$;

create or replace function private.opportunity_user_can_read_candidate(p_candidate_id uuid,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.opportunity_candidates c
    join public.athlete_profiles ap on ap.id=c.athlete_id
    where c.id=p_candidate_id and (
      ap.user_id=p_user_id
      or exists(select 1 from public.guardianships g where g.athlete_id=c.athlete_id and g.guardian_user_id=p_user_id and g.status='verified')
      or private.opportunity_user_can_manage(c.opportunity_id,p_user_id)
      or private.opportunity_user_can_evaluate(c.opportunity_id,p_user_id)
    )
  )
$$;

revoke all on function private.opportunity_user_can_manage(uuid,uuid) from public,anon,authenticated;
revoke all on function private.opportunity_user_can_evaluate(uuid,uuid) from public,anon,authenticated;
revoke all on function private.opportunity_user_can_read_candidate(uuid,uuid) from public,anon,authenticated;

drop policy if exists opp_all on public.opportunities;
revoke insert,update,delete on public.opportunities from authenticated;
revoke insert,update,delete on public.opportunity_candidates from authenticated;
revoke insert,update,delete on public.athlete_offers from authenticated;
