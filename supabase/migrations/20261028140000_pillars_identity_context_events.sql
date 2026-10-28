-- PlayIn365 pillars foundation
-- Individuals + organizations + events, with one account, multiple work contexts,
-- independent identities, shared achievements, decisions and activity timelines.

create table if not exists public.organization_responsibility_catalog (
  code text primary key,
  label_ar text not null,
  label_en text not null,
  home_mode text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.organization_responsibility_catalog(code,label_ar,label_en,home_mode,sort_order,metadata)
values
 ('owner','المالك','Owner','executive',10,'{"decision_scope":"all"}'::jsonb),
 ('executive','الرئيس التنفيذي','Executive','executive',20,'{"decision_scope":"strategic"}'::jsonb),
 ('academy_admin','مدير الأكاديمية','Academy Administrator','operations',30,'{"decision_scope":"organization"}'::jsonb),
 ('finance','الإدارة المالية','Finance','finance',40,'{"decision_scope":"finance"}'::jsonb),
 ('hr','الموارد البشرية','Human Resources','people',50,'{"decision_scope":"people"}'::jsonb),
 ('operations','التشغيل','Operations','operations',60,'{"decision_scope":"operations"}'::jsonb),
 ('registration','التسجيل والقبول','Registration & Admissions','registration',70,'{"decision_scope":"admissions"}'::jsonb),
 ('marketing','التسويق والنمو','Marketing & Growth','growth',80,'{"decision_scope":"growth"}'::jsonb),
 ('cashier','الكاشير والتحصيل','Cashier & Collection','cashier',90,'{"decision_scope":"collection"}'::jsonb),
 ('gate','البوابة والحضور','Gate & Attendance','gate',100,'{"decision_scope":"attendance"}'::jsonb),
 ('coach','المدرب','Coach','coach',110,'{"decision_scope":"technical"}'::jsonb),
 ('content','المحتوى والهوية','Content & Identity','content',120,'{"decision_scope":"publishing"}'::jsonb)
on conflict(code) do update set
 label_ar=excluded.label_ar,label_en=excluded.label_en,home_mode=excluded.home_mode,
 sort_order=excluded.sort_order,metadata=excluded.metadata,is_active=true,updated_at=now();

create table if not exists public.organization_responsibility_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  responsibility_code text not null references public.organization_responsibility_catalog(code),
  status text not null default 'active' check (status in ('active','paused','revoked','ended')),
  scope jsonb not null default '{}'::jsonb check (jsonb_typeof(scope)='object'),
  starts_at timestamptz,
  ends_at timestamptz,
  granted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create unique index if not exists organization_responsibility_active_uq
  on public.organization_responsibility_assignments(organization_id,user_id,responsibility_code)
  where status='active';
create index if not exists organization_responsibility_user_idx
  on public.organization_responsibility_assignments(user_id,status,organization_id);
create index if not exists organization_responsibility_org_idx
  on public.organization_responsibility_assignments(organization_id,responsibility_code,status);

create table if not exists public.user_context_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_context_type text not null default 'personal' check (active_context_type in ('personal','organization')),
  active_organization_id uuid references public.organizations(id) on delete set null,
  active_responsibility_code text references public.organization_responsibility_catalog(code),
  updated_at timestamptz not null default now(),
  check (
    (active_context_type='personal' and active_organization_id is null and active_responsibility_code is null)
    or
    (active_context_type='organization' and active_organization_id is not null)
  )
);

create table if not exists public.identity_pages (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null unique references public.entities(id) on delete cascade,
  public_slug text not null unique,
  geometry_orientation text not null check (geometry_orientation in ('BR','BL','TL','TR')),
  headline_ar text,
  headline_en text,
  bio_ar text,
  bio_en text,
  visibility text not null default 'network' check (visibility in ('public','network','private')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  sections jsonb not null default '{}'::jsonb check (jsonb_typeof(sections)='object'),
  theme jsonb not null default '{}'::jsonb check (jsonb_typeof(theme)='object'),
  managed_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists identity_pages_visibility_idx on public.identity_pages(visibility,verification_status);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  source_event_entity_id uuid references public.entities(id) on delete set null,
  source_organization_id uuid references public.organizations(id) on delete set null,
  achievement_type text not null check (achievement_type in (
    'championship','award','milestone','record','qualification','promotion','selection','certification','project','other'
  )),
  title text not null check (char_length(trim(title)) between 2 and 240),
  description text,
  achieved_at timestamptz not null,
  verification_status text not null default 'pending' check (verification_status in ('unverified','pending','verified','rejected','revoked')),
  visibility text not null default 'network' check (visibility in ('public','network','private')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence)='object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists achievements_org_idx on public.achievements(source_organization_id,achieved_at desc);
create index if not exists achievements_event_idx on public.achievements(source_event_entity_id);
create index if not exists achievements_public_idx on public.achievements(verification_status,visibility,achieved_at desc);

create table if not exists public.achievement_credits (
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  credit_role text not null default 'participant' check (credit_role in (
    'winner','participant','coach','staff','organization','team','organizer','issuer','contributor','other'
  )),
  visibility text not null default 'inherit' check (visibility in ('inherit','public','network','private')),
  display_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key(achievement_id,entity_id,credit_role)
);
create index if not exists achievement_credits_entity_idx on public.achievement_credits(entity_id,created_at desc);

create table if not exists public.work_type_catalog (
  code text primary key,
  label_ar text not null,
  label_en text not null,
  category text not null,
  default_responsibility_code text references public.organization_responsibility_catalog(code),
  decision_required boolean not null default false,
  default_priority text not null default 'normal' check (default_priority in ('low','normal','high','critical')),
  default_sla_hours integer,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.work_type_catalog(code,label_ar,label_en,category,default_responsibility_code,decision_required,default_priority,default_sla_hours)
values
 ('player_registration','تسجيل لاعب','Player Registration','admissions','registration',true,'high',24),
 ('trial_application','طلب تجربة أداء','Trial Application','admissions','registration',true,'high',24),
 ('discount_request','طلب خصم','Discount Request','finance','finance',true,'normal',24),
 ('refund_request','طلب استرداد','Refund Request','finance','finance',true,'high',24),
 ('expense_approval','اعتماد مصروف','Expense Approval','finance','finance',true,'high',24),
 ('payment_reconciliation','مطابقة دفعة','Payment Reconciliation','finance','finance',true,'normal',24),
 ('leave_request','طلب إجازة','Leave Request','people','hr',true,'normal',48),
 ('document_expiry','مستند قارب على الانتهاء','Document Expiry','people','hr',false,'high',72),
 ('session_change','تعديل حصة','Training Session Change','operations','operations',true,'normal',12),
 ('match_approval','اعتماد مباراة','Match Approval','operations','operations',true,'high',24),
 ('attendance_exception','استثناء حضور','Attendance Exception','operations','gate',true,'normal',12),
 ('achievement_publish','نشر إنجاز','Achievement Publishing','identity','content',true,'normal',48),
 ('identity_update','تحديث الهوية','Identity Update','identity','content',true,'normal',48),
 ('campaign_approval','اعتماد حملة','Campaign Approval','growth','marketing',true,'normal',48),
 ('customer_support','طلب دعم عميل','Customer Support','service','operations',false,'normal',24),
 ('purchase_request','طلب شراء','Purchase Request','finance','finance',true,'normal',48),
 ('technical_followup','متابعة فنية','Technical Follow-up','technical','coach',false,'normal',24),
 ('general_task','مهمة عامة','General Task','general','operations',false,'normal',48)
on conflict(code) do update set
 label_ar=excluded.label_ar,label_en=excluded.label_en,category=excluded.category,
 default_responsibility_code=excluded.default_responsibility_code,
 decision_required=excluded.decision_required,default_priority=excluded.default_priority,
 default_sla_hours=excluded.default_sla_hours,is_active=true,updated_at=now();

create table if not exists public.organization_workflow_routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  work_type_code text not null references public.work_type_catalog(code),
  responsibility_code text not null references public.organization_responsibility_catalog(code),
  secondary_responsibility_code text references public.organization_responsibility_catalog(code),
  min_amount numeric(14,2),
  max_amount numeric(14,2),
  priority integer not null default 100,
  sla_hours integer,
  conditions jsonb not null default '{}'::jsonb check (jsonb_typeof(conditions)='object'),
  is_active boolean not null default true,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_amount is null or min_amount>=0),
  check (max_amount is null or max_amount>=0),
  check (max_amount is null or min_amount is null or max_amount>=min_amount)
);
create index if not exists organization_workflow_routes_lookup_idx
 on public.organization_workflow_routes(work_type_code,organization_id,is_active,priority);

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  context_entity_id uuid references public.entities(id) on delete set null,
  event_entity_id uuid references public.entities(id) on delete set null,
  work_type_code text not null references public.work_type_catalog(code),
  title text not null check (char_length(trim(title)) between 2 and 240),
  description text,
  status text not null default 'pending' check (status in (
    'draft','pending','in_progress','waiting','approved','rejected','completed','cancelled','expired'
  )),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  requested_by_user_id uuid not null references auth.users(id) on delete restrict,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  assigned_responsibility_code text references public.organization_responsibility_catalog(code),
  secondary_responsibility_code text references public.organization_responsibility_catalog(code),
  decision_required boolean not null default false,
  due_at timestamptz,
  action_route text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  resolution jsonb not null default '{}'::jsonb check (jsonb_typeof(resolution)='object'),
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_items_assignee_idx on public.work_items(assigned_to_user_id,status,due_at);
create index if not exists work_items_responsibility_idx on public.work_items(organization_id,assigned_responsibility_code,status,due_at);
create index if not exists work_items_requester_idx on public.work_items(requested_by_user_id,status,created_at desc);
create index if not exists work_items_org_idx on public.work_items(organization_id,status,priority,due_at);

create table if not exists public.work_item_events (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  event_type text not null check (event_type in (
    'created','assigned','started','commented','approved','rejected','completed','cancelled','reopened','escalated','updated'
  )),
  actor_user_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  occurred_at timestamptz not null default now()
);
create index if not exists work_item_events_item_idx on public.work_item_events(work_item_id,occurred_at desc);

create table if not exists public.entity_activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_entity_id uuid references public.entities(id) on delete set null,
  subject_entity_id uuid references public.entities(id) on delete cascade,
  context_entity_id uuid references public.entities(id) on delete set null,
  event_entity_id uuid references public.entities(id) on delete set null,
  source_type text not null,
  source_id uuid,
  title text not null,
  summary text,
  visibility text not null default 'network' check (visibility in ('public','network','private')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected','revoked')),
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null default now(),
  check (actor_entity_id is not null or subject_entity_id is not null or context_entity_id is not null)
);
create unique index if not exists entity_activity_source_uq
 on public.entity_activity_events(source_type,source_id,event_type,coalesce(subject_entity_id,'00000000-0000-0000-0000-000000000000'::uuid))
 where source_id is not null;
create index if not exists entity_activity_subject_idx on public.entity_activity_events(subject_entity_id,occurred_at desc);
create index if not exists entity_activity_context_idx on public.entity_activity_events(context_entity_id,occurred_at desc);
create index if not exists entity_activity_event_idx on public.entity_activity_events(event_entity_id,occurred_at desc);

alter table public.organization_responsibility_catalog enable row level security;
alter table public.organization_responsibility_assignments enable row level security;
alter table public.user_context_preferences enable row level security;
alter table public.identity_pages enable row level security;
alter table public.achievements enable row level security;
alter table public.achievement_credits enable row level security;
alter table public.work_type_catalog enable row level security;
alter table public.organization_workflow_routes enable row level security;
alter table public.work_items enable row level security;
alter table public.work_item_events enable row level security;
alter table public.entity_activity_events enable row level security;

revoke all on table public.organization_responsibility_catalog from anon,authenticated;
revoke all on table public.organization_responsibility_assignments from anon,authenticated;
revoke all on table public.user_context_preferences from anon,authenticated;
revoke all on table public.identity_pages from anon,authenticated;
revoke all on table public.achievements from anon,authenticated;
revoke all on table public.achievement_credits from anon,authenticated;
revoke all on table public.work_type_catalog from anon,authenticated;
revoke all on table public.organization_workflow_routes from anon,authenticated;
revoke all on table public.work_items from anon,authenticated;
revoke all on table public.work_item_events from anon,authenticated;
revoke all on table public.entity_activity_events from anon,authenticated;

grant all on table public.organization_responsibility_catalog to service_role;
grant all on table public.organization_responsibility_assignments to service_role;
grant all on table public.user_context_preferences to service_role;
grant all on table public.identity_pages to service_role;
grant all on table public.achievements to service_role;
grant all on table public.achievement_credits to service_role;
grant all on table public.work_type_catalog to service_role;
grant all on table public.organization_workflow_routes to service_role;
grant all on table public.work_items to service_role;
grant all on table public.work_item_events to service_role;
grant all on table public.entity_activity_events to service_role;

-- Exact approved orientation is data, not redrawn geometry.
create or replace function public.pillar_entity_orientation(p_entity_id uuid)
returns text
language sql
stable
security definer
set search_path=''
as $$
  select case
    when e.entity_type='organization' then 'TL'
    when e.entity_type='person' and p.role='player' then 'BR'
    when e.entity_type='person' and p.role='coach' then 'BL'
    when e.entity_type='person' then 'TR'
    else 'TL'
  end
  from public.entities e
  left join public.profiles p on p.id=e.profile_id
  where e.id=p_entity_id
$$;

create or replace function public.pillar_user_has_org_access(p_organization_id uuid,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
 select exists(
   select 1 from public.organization_memberships m
   where m.organization_id=p_organization_id and m.user_id=p_user_id and m.status='active'
 ) or exists(
   select 1 from public.organization_access_assignments a
   where a.organization_id=p_organization_id and a.user_id=p_user_id and a.status='active'
 ) or exists(
   select 1 from public.organization_responsibility_assignments r
   where r.organization_id=p_organization_id and r.user_id=p_user_id and r.status='active'
     and (r.starts_at is null or r.starts_at<=now()) and (r.ends_at is null or r.ends_at>=now())
 )
$$;

create or replace function public.pillar_can_manage_entity(p_entity_id uuid,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
 select exists(
   select 1 from public.entities e
   where e.id=p_entity_id and (
     e.profile_id=p_user_id
     or (e.organization_id is not null and public.organization_user_has_permission(e.organization_id,p_user_id,'manage_profile'))
     or (e.team_id is not null and exists(
       select 1 from public.teams t where t.id=e.team_id
       and public.organization_user_has_permission(t.organization_id,p_user_id,'manage_profile')
     ))
     or (e.sports_event_id is not null and exists(
       select 1 from public.sports_events se where se.id=e.sports_event_id
       and se.organizer_organization_id is not null
       and public.organization_user_has_permission(se.organizer_organization_id,p_user_id,'manage_events')
     ))
   )
 )
$$;

create or replace function public.my_context_center()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid(); v_profile jsonb; v_person_entity uuid; v_pref jsonb; v_contexts jsonb; v_suggested jsonb;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 select jsonb_build_object(
   'id',p.id,'name',p.name,'display_name',coalesce(p.display_name,p.name),'handle',p.handle,
   'role',p.role,'organization_name',p.org,'position',p.pos,'avatar_url',p.avatar_url,
   'visibility',coalesce(p.profile_visibility,'network')
 ) into v_profile from public.profiles p where p.id=v_uid;
 if v_profile is null then raise exception 'profile_not_found'; end if;
 select e.id into v_person_entity from public.entities e where e.profile_id=v_uid limit 1;

 select jsonb_build_object(
   'context_type',u.active_context_type,'organization_id',u.active_organization_id,
   'responsibility_code',u.active_responsibility_code,'updated_at',u.updated_at
 ) into v_pref from public.user_context_preferences u where u.user_id=v_uid;

 select coalesce(jsonb_agg(ctx order by (ctx->>'sort_order')::integer,ctx->>'organization_name'),'[]'::jsonb)
 into v_contexts
 from (
   select jsonb_build_object(
     'context_type','organization','organization_id',o.id,'organization_entity_id',oe.id,
     'organization_name',o.name_ar,'organization_name_en',o.name_en,'organization_type',o.organization_type,
     'city',o.city,'is_verified',o.is_verified,'identity_slug',ip.public_slug,
     'access_role',(select a.access_role_code from public.organization_access_assignments a where a.organization_id=o.id and a.user_id=v_uid and a.status='active' limit 1),
     'membership_roles',coalesce((select jsonb_agg(jsonb_build_object('membership_id',m.id,'role_code',m.role_code,'label_ar',rc.label_ar,'verification_status',m.verification_status) order by rc.label_ar)
       from public.organization_memberships m left join public.role_catalog rc on rc.code=m.role_code
       where m.organization_id=o.id and m.user_id=v_uid and m.status='active'),'[]'::jsonb),
     'responsibilities',coalesce((select jsonb_agg(jsonb_build_object('code',r.responsibility_code,'label_ar',c.label_ar,'label_en',c.label_en,'home_mode',c.home_mode,'scope',r.scope) order by c.sort_order)
       from public.organization_responsibility_assignments r join public.organization_responsibility_catalog c on c.code=r.responsibility_code and c.is_active
       where r.organization_id=o.id and r.user_id=v_uid and r.status='active'
         and (r.starts_at is null or r.starts_at<=now()) and (r.ends_at is null or r.ends_at>=now())),'[]'::jsonb),
     'default_responsibility',coalesce(
       (select r.responsibility_code from public.organization_responsibility_assignments r join public.organization_responsibility_catalog c on c.code=r.responsibility_code
        where r.organization_id=o.id and r.user_id=v_uid and r.status='active' order by c.sort_order limit 1),
       case (select a.access_role_code from public.organization_access_assignments a where a.organization_id=o.id and a.user_id=v_uid and a.status='active' limit 1)
         when 'owner' then 'owner' when 'admin' then 'academy_admin' else null end,
       case
         when exists(select 1 from public.organization_memberships m where m.organization_id=o.id and m.user_id=v_uid and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')) then 'coach'
         when exists(select 1 from public.organization_memberships m where m.organization_id=o.id and m.user_id=v_uid and m.status='active' and m.role_code in ('academy','admin_staff','manager','director')) then 'operations'
         else null
       end
     ),
     'sort_order',case when exists(select 1 from public.organization_access_assignments a where a.organization_id=o.id and a.user_id=v_uid and a.status='active' and a.access_role_code='owner') then 10 else 100 end
   ) ctx
   from public.organizations o
   left join public.entities oe on oe.organization_id=o.id
   left join public.identity_pages ip on ip.entity_id=oe.id
   where public.pillar_user_has_org_access(o.id,v_uid)
 ) s;

 if v_pref is not null then
   if v_pref->>'context_type'='personal' then
     v_suggested:=v_pref;
   elsif v_pref->>'context_type'='organization' and public.pillar_user_has_org_access((v_pref->>'organization_id')::uuid,v_uid) then
     v_suggested:=v_pref;
   end if;
 end if;
 if v_suggested is null then
   if jsonb_array_length(v_contexts)>0 and (v_profile->>'role') in ('academy','coach','admin') then
     v_suggested:=jsonb_build_object('context_type','organization','organization_id',v_contexts->0->>'organization_id','responsibility_code',v_contexts->0->>'default_responsibility');
   else
     v_suggested:=jsonb_build_object('context_type','personal','organization_id',null,'responsibility_code',null);
   end if;
 end if;

 return jsonb_build_object(
   'profile',v_profile,
   'personal',jsonb_build_object('context_type','personal','entity_id',v_person_entity,'identity_slug',(select public_slug from public.identity_pages where entity_id=v_person_entity),'role',v_profile->>'role'),
   'organizations',v_contexts,
   'preference',v_pref,
   'selected',v_suggested
 );
end $$;

create or replace function public.save_my_context_preference(
 p_context_type text,p_organization_id uuid default null,p_responsibility_code text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_row public.user_context_preferences%rowtype;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_context_type not in ('personal','organization') then raise exception 'invalid_context_type'; end if;
 if p_context_type='personal' then p_organization_id:=null; p_responsibility_code:=null; end if;
 if p_context_type='organization' then
   if p_organization_id is null or not public.pillar_user_has_org_access(p_organization_id,v_uid) then raise exception 'organization_access_denied'; end if;
   if p_responsibility_code is not null and not (
      exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=p_organization_id and r.user_id=v_uid and r.responsibility_code=p_responsibility_code and r.status='active')
      or (p_responsibility_code='owner' and exists(select 1 from public.organization_access_assignments a where a.organization_id=p_organization_id and a.user_id=v_uid and a.status='active' and a.access_role_code='owner'))
      or (p_responsibility_code='academy_admin' and exists(select 1 from public.organization_access_assignments a where a.organization_id=p_organization_id and a.user_id=v_uid and a.status='active' and a.access_role_code='admin'))
      or (p_responsibility_code='coach' and exists(select 1 from public.organization_memberships m where m.organization_id=p_organization_id and m.user_id=v_uid and m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')))
   ) then raise exception 'responsibility_access_denied'; end if;
 end if;
 insert into public.user_context_preferences(user_id,active_context_type,active_organization_id,active_responsibility_code)
 values(v_uid,p_context_type,p_organization_id,p_responsibility_code)
 on conflict(user_id) do update set active_context_type=excluded.active_context_type,
   active_organization_id=excluded.active_organization_id,active_responsibility_code=excluded.active_responsibility_code,updated_at=now()
 returning * into v_row;
 return jsonb_build_object('changed',true,'context',to_jsonb(v_row));
end $$;

create or replace function public.my_unified_home(
 p_context_type text default null,p_organization_id uuid default null,p_responsibility_code text default null
) returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid(); v_context jsonb; v_type text; v_org uuid; v_resp text; v_person_entity uuid; v_context_entity uuid;
 v_can_finance boolean:=false; v_can_members boolean:=false; v_can_events boolean:=false;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 v_context:=public.my_context_center();
 v_type:=coalesce(nullif(p_context_type,''),v_context->'selected'->>'context_type','personal');
 if v_type='organization' then
   v_org:=coalesce(p_organization_id,(v_context->'selected'->>'organization_id')::uuid);
   v_resp:=coalesce(nullif(p_responsibility_code,''),v_context->'selected'->>'responsibility_code');
   if v_org is null or not public.pillar_user_has_org_access(v_org,v_uid) then raise exception 'organization_access_denied'; end if;
   select id into v_context_entity from public.entities where organization_id=v_org limit 1;
   v_can_finance:=public.organization_user_has_permission(v_org,v_uid,'manage_finance');
   v_can_members:=public.organization_user_has_permission(v_org,v_uid,'manage_members');
   v_can_events:=public.organization_user_has_permission(v_org,v_uid,'manage_events');
 else
   v_type:='personal'; v_org:=null; v_resp:=null;
   select id into v_person_entity from public.entities where profile_id=v_uid limit 1;
   v_context_entity:=v_person_entity;
 end if;

 return jsonb_build_object(
  'context',jsonb_build_object('context_type',v_type,'organization_id',v_org,'responsibility_code',v_resp,'entity_id',v_context_entity),
  'identity',(
    select jsonb_build_object('entity_id',e.id,'entity_type',e.entity_type,'name',e.canonical_name,'identity_slug',ip.public_slug,
      'orientation',coalesce(ip.geometry_orientation,public.pillar_entity_orientation(e.id)),'headline_ar',ip.headline_ar,'verification_status',coalesce(ip.verification_status,'unverified'))
    from public.entities e left join public.identity_pages ip on ip.entity_id=e.id where e.id=v_context_entity
  ),
  'metrics',case when v_type='organization' then jsonb_build_object(
    'active_members',(select count(*) from public.organization_memberships m where m.organization_id=v_org and m.status='active'),
    'active_teams',(select count(*) from public.teams t where t.organization_id=v_org and t.status='active'),
    'upcoming_sessions',(select count(*) from public.training_sessions s where s.organization_id=v_org and s.status='scheduled' and s.starts_at>=now()),
    'pending_decisions',(select count(*) from public.work_items w where w.organization_id=v_org and w.status in ('pending','in_progress','waiting') and (
      w.assigned_to_user_id=v_uid or w.assigned_responsibility_code=v_resp or (v_can_members and w.assigned_to_user_id is null)
    )),
    'unpaid_invoices',case when v_can_finance then (select count(*) from public.invoices i where i.issuer_organization_id=v_org and i.status in ('issued','partially_paid','overdue')) else null end
  ) else jsonb_build_object(
    'pending_actions',(select count(*) from public.work_items w where w.status in ('pending','in_progress','waiting') and (w.assigned_to_user_id=v_uid or w.requested_by_user_id=v_uid)),
    'unread_notifications',(select count(*) from public.notifications n where n.user_id=v_uid and coalesce(n.read,false)=false),
    'upcoming_sessions',(select count(*) from public.training_sessions s where s.status='scheduled' and s.starts_at>=now() and s.team_id in (
       select ta.team_id from public.team_athletes ta join public.athlete_profiles ap on ap.id=ta.athlete_id where ap.user_id=v_uid and ta.status='active'
    )),
    'verified_achievements',(select count(*) from public.achievement_credits c join public.achievements a on a.id=c.achievement_id where c.entity_id=v_person_entity and a.verification_status='verified')
  ) end,
  'decisions',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',w.id,'source','work_item','work_type',w.work_type_code,'label_ar',wt.label_ar,'title',w.title,'description',w.description,
      'status',w.status,'priority',w.priority,'decision_required',w.decision_required,'due_at',w.due_at,'action_route',w.action_route,
      'organization_id',w.organization_id,'assigned_responsibility_code',w.assigned_responsibility_code,'created_at',w.created_at
    ) order by case w.priority when 'critical' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,w.due_at nulls last,w.created_at desc)
    from public.work_items w join public.work_type_catalog wt on wt.code=w.work_type_code
    where w.status in ('pending','in_progress','waiting') and (
      w.assigned_to_user_id=v_uid or w.requested_by_user_id=v_uid
      or (v_type='organization' and w.organization_id=v_org and (w.assigned_responsibility_code=v_resp or (v_can_members and w.assigned_to_user_id is null)))
    ) limit 30
  ),'[]'::jsonb),
  'approvals',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'request_type',a.request_type,'status',a.status,'payload',a.payload,'expires_at',a.expires_at,'created_at',a.created_at) order by a.created_at desc)
    from public.approval_requests a where a.status='pending' and (a.assigned_to_user_id=v_uid or a.requested_by_user_id=v_uid) limit 20),'[]'::jsonb),
  'upcoming',case when v_type='organization' then jsonb_build_object(
    'training',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'type','training','title',s.title,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',s.status,'team_id',s.team_id,'venue_label',s.venue_label) order by s.starts_at)
      from (select * from public.training_sessions where organization_id=v_org and starts_at>=now() order by starts_at limit 12)s),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'type','sports_event','title',e.title,'starts_at',e.starts_at,'ends_at',e.ends_at,'status',e.status,'event_type',e.event_type) order by e.starts_at)
      from (select * from public.sports_events where organizer_organization_id=v_org and starts_at>=now() order by starts_at limit 12)e),'[]'::jsonb),
    'matches',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'type','match','title',m.title,'starts_at',coalesce(m.starts_at,m.kickoff_at,(m.match_date::text||' '||coalesce(m.match_time,'00:00'))::timestamptz),'status',m.status,'team_a',m.team_a,'team_b',m.team_b) order by coalesce(m.starts_at,m.kickoff_at))
      from (select m.* from public.matches m where (m.home_team_id in (select t.id from public.teams t where t.organization_id=v_org) or m.away_team_id in (select t.id from public.teams t where t.organization_id=v_org)) and coalesce(m.starts_at,m.kickoff_at,now())>=now()-interval '12 hours' order by coalesce(m.starts_at,m.kickoff_at) limit 12)m),'[]'::jsonb)
  ) else jsonb_build_object(
    'training',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'type','training','title',s.title,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',s.status,'team_id',s.team_id,'venue_label',s.venue_label) order by s.starts_at)
      from (select s.* from public.training_sessions s where s.starts_at>=now() and s.team_id in (select ta.team_id from public.team_athletes ta join public.athlete_profiles ap on ap.id=ta.athlete_id where ap.user_id=v_uid and ta.status='active') order by s.starts_at limit 12)s),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'type','sports_event','title',e.title,'starts_at',e.starts_at,'ends_at',e.ends_at,'status',e.status,'event_type',e.event_type) order by e.starts_at)
      from (select * from public.sports_events where starts_at>=now() and visibility in ('public','network') order by starts_at limit 12)e),'[]'::jsonb),
    'opportunities',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'type','opportunity','title',o.title,'opportunity_type',o.opportunity_type,'city',o.city,'closes_at',o.closes_at,'organization_id',o.organization_id) order by o.closes_at nulls last,o.created_at desc)
      from (select * from public.opportunities where status='open' and visibility='public' order by closes_at nulls last,created_at desc limit 12)o),'[]'::jsonb)
  ) end,
  'updates',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'event_type',x.event_type,'title',x.title,'summary',x.summary,'occurred_at',x.occurred_at,'verification_status',x.verification_status,'visibility',x.visibility,'payload',x.payload) order by x.occurred_at desc)
    from (select ae.* from public.entity_activity_events ae where
      (v_type='personal' and (ae.subject_entity_id=v_person_entity or ae.actor_entity_id=v_person_entity or ae.context_entity_id=v_person_entity))
      or (v_type='organization' and (ae.context_entity_id=v_context_entity or ae.subject_entity_id=v_context_entity or ae.actor_entity_id=v_context_entity))
      order by ae.occurred_at desc limit 30)x),'[]'::jsonb),
  'notifications',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'title',n.title,'body',n.body,'read',n.read,'created_at',n.created_at,'data',n.data) order by n.created_at desc)
    from (select * from public.notifications where user_id=v_uid order by created_at desc limit 20)n),'[]'::jsonb)
 );
end $$;

create or replace function public.my_identity_center(p_entity_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_entity public.entities%rowtype; v_id uuid:=p_entity_id; v_allowed boolean:=false;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if v_id is null then select id into v_id from public.entities where profile_id=v_uid limit 1; end if;
 select * into v_entity from public.entities where id=v_id;
 if not found then raise exception 'entity_not_found'; end if;
 v_allowed:=v_entity.visibility='public' or v_entity.profile_id=v_uid or public.pillar_can_manage_entity(v_id,v_uid)
   or (v_entity.organization_id is not null and public.pillar_user_has_org_access(v_entity.organization_id,v_uid));
 if not v_allowed then raise exception 'identity_access_denied'; end if;
 return jsonb_build_object(
  'entity',jsonb_build_object('id',v_entity.id,'entity_type',v_entity.entity_type,'canonical_name',v_entity.canonical_name,'sport_code',v_entity.sport_code,'status',v_entity.status,'visibility',v_entity.visibility,
    'profile_id',v_entity.profile_id,'organization_id',v_entity.organization_id,'team_id',v_entity.team_id,'sports_event_id',v_entity.sports_event_id,'match_id',v_entity.match_id,'training_session_id',v_entity.training_session_id),
  'identity_page',coalesce((select to_jsonb(ip) from public.identity_pages ip where ip.entity_id=v_id),jsonb_build_object('entity_id',v_id,'geometry_orientation',public.pillar_entity_orientation(v_id),'visibility',v_entity.visibility)),
  'profile',case when v_entity.profile_id is null then null else (select jsonb_build_object('id',p.id,'name',p.name,'display_name',coalesce(p.display_name,p.name),'handle',p.handle,'role',p.role,'organization_name',p.org,'position',p.pos,'age',p.age,'shirt',p.shirt,'city',p.city,'country_code',p.country_code,'avatar_url',p.avatar_url) from public.profiles p where p.id=v_entity.profile_id) end,
  'organization',case when v_entity.organization_id is null then null else (select jsonb_build_object('id',o.id,'name_ar',o.name_ar,'name_en',o.name_en,'slug',o.slug,'organization_type',o.organization_type,'city',o.city,'country_code',o.country_code,'is_verified',o.is_verified,'public_profile',o.public_profile,'metadata',o.metadata) from public.organizations o where o.id=v_entity.organization_id) end,
  'roles',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'role_code',r.role_code,'label_ar',c.label_ar,'label_en',c.label_en,'context_entity_id',r.context_entity_id,'status',r.status,'verification_status',r.verification_status,'source_type',r.source_type,'starts_at',r.starts_at,'ends_at',r.ends_at) order by r.starts_at desc nulls last) from public.entity_roles r left join public.role_catalog c on c.code=r.role_code where r.entity_id=v_id and r.status in ('active','historical')),'[]'::jsonb),
  'credentials',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'credential_type',c.credential_type,'title',c.title,'credential_code',c.credential_code,'status',c.status,'verification_status',c.verification_status,'issued_at',c.issued_at,'expires_at',c.expires_at,'visibility',c.visibility,'issuer_entity_id',c.issuer_entity_id) order by c.issued_at desc nulls last) from public.credentials c where c.entity_id=v_id and (c.visibility<>'private' or public.pillar_can_manage_entity(v_id,v_uid))),'[]'::jsonb),
  'achievements',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'achievement_type',a.achievement_type,'title',a.title,'description',a.description,'achieved_at',a.achieved_at,'verification_status',a.verification_status,'visibility',case when c.visibility='inherit' then a.visibility else c.visibility end,'credit_role',c.credit_role,'evidence',case when public.pillar_can_manage_entity(v_id,v_uid) then a.evidence else '{}'::jsonb end,'source_organization_id',a.source_organization_id) order by a.achieved_at desc) from public.achievement_credits c join public.achievements a on a.id=c.achievement_id where c.entity_id=v_id and (public.pillar_can_manage_entity(v_id,v_uid) or (a.visibility in ('public','network') and c.visibility<>'private'))),'[]'::jsonb),
  'timeline',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'event_type',e.event_type,'title',e.title,'summary',e.summary,'occurred_at',e.occurred_at,'visibility',e.visibility,'verification_status',e.verification_status,'event_entity_id',e.event_entity_id,'context_entity_id',e.context_entity_id,'payload',e.payload) order by e.occurred_at desc) from (select * from public.entity_activity_events where actor_entity_id=v_id or subject_entity_id=v_id or context_entity_id=v_id order by occurred_at desc limit 100)e),'[]'::jsonb),
  'can_edit',public.pillar_can_manage_entity(v_id,v_uid)
 );
end $$;

create or replace function public.save_my_identity_page(
 p_entity_id uuid,p_headline_ar text default null,p_headline_en text default null,
 p_bio_ar text default null,p_bio_en text default null,p_visibility text default 'network',
 p_sections jsonb default '{}'::jsonb,p_theme jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_row public.identity_pages%rowtype; v_slug text; v_entity public.entities%rowtype;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if not public.pillar_can_manage_entity(p_entity_id,v_uid) then raise exception 'identity_manage_denied'; end if;
 if p_visibility not in ('public','network','private') then raise exception 'invalid_visibility'; end if;
 if p_sections is null or jsonb_typeof(p_sections)<>'object' or p_theme is null or jsonb_typeof(p_theme)<>'object' then raise exception 'invalid_identity_payload'; end if;
 select * into v_entity from public.entities where id=p_entity_id; if not found then raise exception 'entity_not_found'; end if;
 select public_slug into v_slug from public.identity_pages where entity_id=p_entity_id;
 if v_slug is null then
   v_slug:=case when v_entity.entity_type='organization' then 'org-' else 'person-' end||left(p_entity_id::text,8);
 end if;
 insert into public.identity_pages(entity_id,public_slug,geometry_orientation,headline_ar,headline_en,bio_ar,bio_en,visibility,verification_status,sections,theme,managed_by_user_id)
 values(p_entity_id,v_slug,public.pillar_entity_orientation(p_entity_id),nullif(trim(coalesce(p_headline_ar,'')),''),nullif(trim(coalesce(p_headline_en,'')),''),nullif(trim(coalesce(p_bio_ar,'')),''),nullif(trim(coalesce(p_bio_en,'')),''),p_visibility,
   case when v_entity.entity_type='organization' and exists(select 1 from public.organizations o where o.id=v_entity.organization_id and o.is_verified) then 'verified' else 'unverified' end,
   p_sections,p_theme,v_uid)
 on conflict(entity_id) do update set
   geometry_orientation=public.pillar_entity_orientation(excluded.entity_id),headline_ar=excluded.headline_ar,headline_en=excluded.headline_en,
   bio_ar=excluded.bio_ar,bio_en=excluded.bio_en,visibility=excluded.visibility,sections=excluded.sections,theme=excluded.theme,
   managed_by_user_id=v_uid,updated_at=now()
 returning * into v_row;
 insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
 values('identity_updated',(select id from public.entities where profile_id=v_uid limit 1),p_entity_id,
   case when v_entity.organization_id is not null then p_entity_id else null end,'identity_page',v_row.id,'تحديث الهوية','تم تحديث صفحة الهوية',
   case when p_visibility='public' then 'public' else 'private' end,'verified',jsonb_build_object('orientation',v_row.geometry_orientation))
 on conflict do nothing;
 return jsonb_build_object('changed',true,'identity_page',to_jsonb(v_row));
end $$;

create or replace function public.set_my_organization_responsibility(
 p_organization_id uuid,p_target_handle text,p_responsibility_code text,p_status text default 'active',p_scope jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_target uuid; v_row public.organization_responsibility_assignments%rowtype;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_members') then raise exception 'manage_members_required'; end if;
 if p_status not in ('active','paused','revoked','ended') then raise exception 'invalid_responsibility_status'; end if;
 if p_scope is null or jsonb_typeof(p_scope)<>'object' then raise exception 'scope_must_be_object'; end if;
 select id into v_target from public.profiles where lower(handle)=lower(trim(both '@' from p_target_handle)) limit 1;
 if v_target is null then raise exception 'target_profile_not_found'; end if;
 if not public.pillar_user_has_org_access(p_organization_id,v_target) then raise exception 'target_not_in_organization'; end if;
 if p_status='active' then
   insert into public.organization_responsibility_assignments(organization_id,user_id,responsibility_code,status,scope,granted_by_user_id)
   values(p_organization_id,v_target,p_responsibility_code,'active',p_scope,v_uid)
   on conflict(organization_id,user_id,responsibility_code) where status='active' do update set scope=excluded.scope,updated_at=now(),granted_by_user_id=v_uid
   returning * into v_row;
 else
   update public.organization_responsibility_assignments set status=p_status,updated_at=now(),ends_at=coalesce(ends_at,now()),granted_by_user_id=v_uid
   where organization_id=p_organization_id and user_id=v_target and responsibility_code=p_responsibility_code and status='active'
   returning * into v_row;
   if not found then raise exception 'responsibility_assignment_not_found'; end if;
 end if;
 return jsonb_build_object('changed',true,'assignment',to_jsonb(v_row));
end $$;

create or replace function public.create_my_work_item(
 p_organization_id uuid,p_work_type_code text,p_title text,p_description text default null,
 p_context_entity_id uuid default null,p_event_entity_id uuid default null,
 p_assigned_to_user_id uuid default null,p_assigned_responsibility_code text default null,
 p_priority text default null,p_due_at timestamptz default null,p_action_route text default null,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_uid uuid:=auth.uid(); v_catalog public.work_type_catalog%rowtype; v_resp text; v_secondary text; v_priority text; v_due timestamptz; v_amount numeric; v_row public.work_items%rowtype; v_actor_entity uuid; v_context_entity uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_organization_id is not null and not public.pillar_user_has_org_access(p_organization_id,v_uid) then raise exception 'organization_access_denied'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'payload_must_be_object'; end if;
 select * into v_catalog from public.work_type_catalog where code=p_work_type_code and is_active; if not found then raise exception 'work_type_not_found'; end if;
 v_amount:=case when (p_payload->>'amount') ~ '^[0-9]+([.][0-9]+)?$' then (p_payload->>'amount')::numeric else null end;
 select r.responsibility_code,r.secondary_responsibility_code into v_resp,v_secondary
 from public.organization_workflow_routes r
 where r.is_active and r.work_type_code=p_work_type_code and (r.organization_id=p_organization_id or r.organization_id is null)
   and (r.min_amount is null or v_amount is null or v_amount>=r.min_amount)
   and (r.max_amount is null or v_amount is null or v_amount<=r.max_amount)
 order by case when r.organization_id=p_organization_id then 0 else 1 end,r.priority limit 1;
 v_resp:=coalesce(nullif(p_assigned_responsibility_code,''),v_resp,v_catalog.default_responsibility_code);
 v_priority:=coalesce(nullif(p_priority,''),v_catalog.default_priority);
 if v_priority not in ('low','normal','high','critical') then raise exception 'invalid_priority'; end if;
 v_due:=coalesce(p_due_at,case when v_catalog.default_sla_hours is not null then now()+make_interval(hours=>v_catalog.default_sla_hours) else null end);
 if p_context_entity_id is not null then v_context_entity:=p_context_entity_id;
 elsif p_organization_id is not null then select id into v_context_entity from public.entities where organization_id=p_organization_id limit 1;
 else select id into v_context_entity from public.entities where profile_id=v_uid limit 1; end if;
 insert into public.work_items(organization_id,context_entity_id,event_entity_id,work_type_code,title,description,status,priority,requested_by_user_id,assigned_to_user_id,assigned_responsibility_code,secondary_responsibility_code,decision_required,due_at,action_route,payload)
 values(p_organization_id,v_context_entity,p_event_entity_id,p_work_type_code,trim(p_title),nullif(trim(coalesce(p_description,'')),''),'pending',v_priority,v_uid,p_assigned_to_user_id,v_resp,v_secondary,v_catalog.decision_required,v_due,nullif(trim(coalesce(p_action_route,'')),''),p_payload)
 returning * into v_row;
 insert into public.work_item_events(work_item_id,event_type,actor_user_id,to_status,note,metadata)
 values(v_row.id,'created',v_uid,'pending','تم إنشاء الطلب',jsonb_build_object('responsibility',v_resp));
 select id into v_actor_entity from public.entities where profile_id=v_uid limit 1;
 insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
 values('work_item_created',v_actor_entity,coalesce(v_context_entity,v_actor_entity),v_context_entity,p_event_entity_id,'work_item',v_row.id,v_row.title,v_row.description,'private','verified',jsonb_build_object('work_type',p_work_type_code,'priority',v_priority,'status','pending'));
 return jsonb_build_object('changed',true,'work_item',to_jsonb(v_row));
end $$;

create or replace function public.act_my_work_item(
 p_work_item_id uuid,p_action text,p_note text default null,p_resolution jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_row public.work_items%rowtype; v_from text; v_to text; v_allowed boolean:=false; v_actor_entity uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_resolution is null or jsonb_typeof(p_resolution)<>'object' then raise exception 'resolution_must_be_object'; end if;
 select * into v_row from public.work_items where id=p_work_item_id for update; if not found then raise exception 'work_item_not_found'; end if;
 v_allowed:=v_row.requested_by_user_id=v_uid or v_row.assigned_to_user_id=v_uid
   or (v_row.organization_id is not null and (
      public.organization_user_has_permission(v_row.organization_id,v_uid,'manage_members')
      or exists(select 1 from public.organization_responsibility_assignments r where r.organization_id=v_row.organization_id and r.user_id=v_uid and r.status='active' and r.responsibility_code in (v_row.assigned_responsibility_code,v_row.secondary_responsibility_code))
   ));
 if not v_allowed then raise exception 'work_item_action_denied'; end if;
 v_from:=v_row.status;
 v_to:=case p_action
   when 'start' then 'in_progress' when 'wait' then 'waiting' when 'approve' then 'approved'
   when 'reject' then 'rejected' when 'complete' then 'completed' when 'cancel' then 'cancelled'
   when 'reopen' then 'pending' else null end;
 if v_to is null then raise exception 'invalid_work_item_action'; end if;
 if p_action in ('approve','reject') and not v_row.decision_required then raise exception 'decision_not_required'; end if;
 update public.work_items set status=v_to,resolution=case when p_action in ('approve','reject','complete','cancel') then p_resolution else resolution end,
   resolved_by_user_id=case when p_action in ('approve','reject','complete','cancel') then v_uid else null end,
   resolved_at=case when p_action in ('approve','reject','complete','cancel') then now() else null end,updated_at=now()
 where id=p_work_item_id returning * into v_row;
 insert into public.work_item_events(work_item_id,event_type,actor_user_id,from_status,to_status,note,metadata)
 values(v_row.id,case p_action when 'start' then 'started' when 'wait' then 'updated' when 'approve' then 'approved' when 'reject' then 'rejected' when 'complete' then 'completed' when 'cancel' then 'cancelled' else 'reopened' end,v_uid,v_from,v_to,nullif(trim(coalesce(p_note,'')),''),p_resolution);
 select id into v_actor_entity from public.entities where profile_id=v_uid limit 1;
 insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
 values('work_item_'||p_action,v_actor_entity,v_row.context_entity_id,v_row.context_entity_id,v_row.event_entity_id,'work_item',v_row.id,v_row.title,nullif(trim(coalesce(p_note,'')),''),'private','verified',jsonb_build_object('from_status',v_from,'to_status',v_to,'resolution',p_resolution))
 on conflict do nothing;
 return jsonb_build_object('changed',true,'work_item',to_jsonb(v_row));
end $$;

create or replace function public.create_my_achievement(
 p_source_organization_id uuid,p_source_event_entity_id uuid,p_achievement_type text,p_title text,p_description text,
 p_achieved_at timestamptz,p_visibility text default 'network',p_evidence jsonb default '{}'::jsonb,p_credits jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_row public.achievements%rowtype; v_credit jsonb; v_self_entity uuid; v_context_entity uuid; v_verified text:='pending';
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 if p_evidence is null or jsonb_typeof(p_evidence)<>'object' or p_credits is null or jsonb_typeof(p_credits)<>'array' then raise exception 'invalid_achievement_payload'; end if;
 if p_visibility not in ('public','network','private') then raise exception 'invalid_visibility'; end if;
 select id into v_self_entity from public.entities where profile_id=v_uid limit 1;
 if p_source_organization_id is not null then
   if not (public.organization_user_has_permission(p_source_organization_id,v_uid,'manage_profile') or public.organization_user_has_permission(p_source_organization_id,v_uid,'manage_events')) then raise exception 'achievement_manage_denied'; end if;
   select id into v_context_entity from public.entities where organization_id=p_source_organization_id limit 1;
   v_verified:='verified';
 elsif jsonb_array_length(p_credits)>1 or not exists(select 1 from jsonb_array_elements(p_credits) c where (c->>'entity_id')::uuid=v_self_entity) then
   raise exception 'personal_achievement_must_credit_self';
 end if;
 insert into public.achievements(source_event_entity_id,source_organization_id,achievement_type,title,description,achieved_at,verification_status,visibility,evidence,created_by_user_id,approved_by_user_id,approved_at)
 values(p_source_event_entity_id,p_source_organization_id,p_achievement_type,trim(p_title),nullif(trim(coalesce(p_description,'')),''),p_achieved_at,v_verified,p_visibility,p_evidence,v_uid,case when v_verified='verified' then v_uid else null end,case when v_verified='verified' then now() else null end)
 returning * into v_row;
 for v_credit in select value from jsonb_array_elements(p_credits) loop
   insert into public.achievement_credits(achievement_id,entity_id,credit_role,visibility,display_order,metadata,verified_at)
   values(v_row.id,(v_credit->>'entity_id')::uuid,coalesce(nullif(v_credit->>'credit_role',''),'participant'),coalesce(nullif(v_credit->>'visibility',''),'inherit'),coalesce((v_credit->>'display_order')::integer,100),coalesce(v_credit->'metadata','{}'::jsonb),case when v_verified='verified' then now() else null end);
   insert into public.entity_activity_events(event_type,actor_entity_id,subject_entity_id,context_entity_id,event_entity_id,source_type,source_id,title,summary,visibility,verification_status,payload)
   values('achievement_recorded',v_self_entity,(v_credit->>'entity_id')::uuid,coalesce(v_context_entity,(v_credit->>'entity_id')::uuid),p_source_event_entity_id,'achievement',v_row.id,v_row.title,v_row.description,p_visibility,v_verified,jsonb_build_object('achievement_type',p_achievement_type,'credit_role',coalesce(v_credit->>'credit_role','participant')))
   on conflict do nothing;
 end loop;
 return jsonb_build_object('changed',true,'achievement',to_jsonb(v_row));
end $$;

create or replace function public.public_identity_page(p_public_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_page public.identity_pages%rowtype; v_entity public.entities%rowtype;
begin
 select * into v_page from public.identity_pages where public_slug=p_public_slug and visibility='public';
 if not found then raise exception 'public_identity_not_found'; end if;
 select * into v_entity from public.entities where id=v_page.entity_id and visibility='public';
 if not found then raise exception 'public_identity_not_found'; end if;
 return jsonb_build_object(
  'entity',jsonb_build_object('id',v_entity.id,'entity_type',v_entity.entity_type,'canonical_name',v_entity.canonical_name,'sport_code',v_entity.sport_code,'status',v_entity.status),
  'identity_page',jsonb_build_object('public_slug',v_page.public_slug,'geometry_orientation',v_page.geometry_orientation,'headline_ar',v_page.headline_ar,'headline_en',v_page.headline_en,'bio_ar',v_page.bio_ar,'bio_en',v_page.bio_en,'verification_status',v_page.verification_status,'sections',v_page.sections,'theme',v_page.theme),
  'profile',case when v_entity.profile_id is null then null else (select jsonb_build_object('display_name',coalesce(p.display_name,p.name),'handle',p.handle,'role',p.role,'position',p.pos,'city',p.city,'country_code',p.country_code,'avatar_url',p.avatar_url) from public.profiles p where p.id=v_entity.profile_id) end,
  'organization',case when v_entity.organization_id is null then null else (select jsonb_build_object('name_ar',o.name_ar,'name_en',o.name_en,'slug',o.slug,'organization_type',o.organization_type,'city',o.city,'country_code',o.country_code,'is_verified',o.is_verified) from public.organizations o where o.id=v_entity.organization_id and o.public_profile) end,
  'roles',coalesce((select jsonb_agg(jsonb_build_object('role_code',r.role_code,'label_ar',c.label_ar,'label_en',c.label_en,'verification_status',r.verification_status,'starts_at',r.starts_at,'ends_at',r.ends_at) order by r.starts_at desc nulls last) from public.entity_roles r left join public.role_catalog c on c.code=r.role_code where r.entity_id=v_entity.id and r.status in ('active','historical') and r.verification_status='verified'),'[]'::jsonb),
  'credentials',coalesce((select jsonb_agg(jsonb_build_object('credential_type',c.credential_type,'title',c.title,'credential_code',c.credential_code,'verification_status',c.verification_status,'issued_at',c.issued_at,'expires_at',c.expires_at) order by c.issued_at desc nulls last) from public.credentials c where c.entity_id=v_entity.id and c.visibility='public' and c.status='active' and c.verification_status='verified'),'[]'::jsonb),
  'achievements',coalesce((select jsonb_agg(jsonb_build_object('achievement_type',a.achievement_type,'title',a.title,'description',a.description,'achieved_at',a.achieved_at,'credit_role',c.credit_role,'verification_status',a.verification_status) order by a.achieved_at desc) from public.achievement_credits c join public.achievements a on a.id=c.achievement_id where c.entity_id=v_entity.id and a.visibility='public' and a.verification_status='verified' and c.visibility in ('inherit','public')),'[]'::jsonb),
  'timeline',coalesce((select jsonb_agg(jsonb_build_object('event_type',e.event_type,'title',e.title,'summary',e.summary,'occurred_at',e.occurred_at,'verification_status',e.verification_status) order by e.occurred_at desc) from (select * from public.entity_activity_events where (actor_entity_id=v_entity.id or subject_entity_id=v_entity.id or context_entity_id=v_entity.id) and visibility='public' and verification_status='verified' order by occurred_at desc limit 50)e),'[]'::jsonb)
 );
end $$;

-- Default routes. Organization-specific rules can override these later.
insert into public.organization_workflow_routes(organization_id,work_type_code,responsibility_code,secondary_responsibility_code,min_amount,max_amount,priority,sla_hours,conditions)
select null,v.code,v.default_responsibility_code,
 case v.code when 'discount_request' then 'owner' when 'expense_approval' then 'owner' when 'purchase_request' then 'owner' else null end,
 case when v.code='discount_request' then 0 else null end,
 case when v.code='discount_request' then 999999999 else null end,
 100,v.default_sla_hours,'{}'::jsonb
from public.work_type_catalog v
where v.default_responsibility_code is not null
and not exists(select 1 from public.organization_workflow_routes r where r.organization_id is null and r.work_type_code=v.code and r.responsibility_code=v.default_responsibility_code);

-- Seed responsibility assignments from existing trusted access/membership records.
insert into public.organization_responsibility_assignments(organization_id,user_id,responsibility_code,status,scope,granted_by_user_id)
select a.organization_id,a.user_id,case a.access_role_code when 'owner' then 'owner' else 'academy_admin' end,'active','{"source":"existing_access"}'::jsonb,a.granted_by_user_id
from public.organization_access_assignments a
where a.status='active' and a.access_role_code in ('owner','admin')
on conflict(organization_id,user_id,responsibility_code) where status='active' do nothing;

insert into public.organization_responsibility_assignments(organization_id,user_id,responsibility_code,status,scope)
select m.organization_id,m.user_id,'coach','active',jsonb_build_object('source','membership','role_code',m.role_code)
from public.organization_memberships m
where m.status='active' and m.role_code in ('coach','head_coach','assistant_coach')
on conflict(organization_id,user_id,responsibility_code) where status='active' do nothing;

-- Create identity pages for existing individuals and organizations without changing public visibility rules.
insert into public.identity_pages(entity_id,public_slug,geometry_orientation,headline_ar,visibility,verification_status,managed_by_user_id,sections,theme)
select e.id,'person-'||left(e.id::text,8),public.pillar_entity_orientation(e.id),coalesce(p.pos,p.role),
 case when coalesce(p.profile_visibility,'network')='public' then 'public' when coalesce(p.profile_visibility,'network')='private' then 'private' else 'network' end,
 'unverified',p.id,'{}'::jsonb,jsonb_build_object('orientation',public.pillar_entity_orientation(e.id),'source','approved_geometry')
from public.entities e join public.profiles p on p.id=e.profile_id
where e.entity_type='person'
on conflict(entity_id) do nothing;

insert into public.identity_pages(entity_id,public_slug,geometry_orientation,headline_ar,visibility,verification_status,managed_by_user_id,sections,theme)
select e.id,'org-'||left(e.id::text,8),'TL',case o.organization_type when 'academy' then 'أكاديمية رياضية' when 'club' then 'نادي رياضي' when 'federation' then 'اتحاد رياضي' when 'venue' then 'منشأة رياضية' else 'جهة رياضية' end,
 case when o.public_profile then 'public' else 'private' end,
 case when o.is_verified then 'verified' else 'unverified' end,o.created_by,'{}'::jsonb,'{"orientation":"TL","source":"approved_geometry"}'::jsonb
from public.entities e join public.organizations o on o.id=e.organization_id
where e.entity_type='organization'
on conflict(entity_id) do nothing;

-- Function permissions. All direct table access stays closed; RPCs validate the authenticated user.
revoke all on function public.pillar_entity_orientation(uuid) from public,anon,authenticated;
revoke all on function public.pillar_user_has_org_access(uuid,uuid) from public,anon,authenticated;
revoke all on function public.pillar_can_manage_entity(uuid,uuid) from public,anon,authenticated;
revoke all on function public.my_context_center() from public,anon;
revoke all on function public.save_my_context_preference(text,uuid,text) from public,anon;
revoke all on function public.my_unified_home(text,uuid,text) from public,anon;
revoke all on function public.my_identity_center(uuid) from public,anon;
revoke all on function public.save_my_identity_page(uuid,text,text,text,text,text,jsonb,jsonb) from public,anon;
revoke all on function public.set_my_organization_responsibility(uuid,text,text,text,jsonb) from public,anon;
revoke all on function public.create_my_work_item(uuid,text,text,text,uuid,uuid,uuid,text,text,timestamptz,text,jsonb) from public,anon;
revoke all on function public.act_my_work_item(uuid,text,text,jsonb) from public,anon;
revoke all on function public.create_my_achievement(uuid,uuid,text,text,text,timestamptz,text,jsonb,jsonb) from public,anon;
revoke all on function public.public_identity_page(text) from public;

grant execute on function public.my_context_center() to authenticated;
grant execute on function public.save_my_context_preference(text,uuid,text) to authenticated;
grant execute on function public.my_unified_home(text,uuid,text) to authenticated;
grant execute on function public.my_identity_center(uuid) to authenticated;
grant execute on function public.save_my_identity_page(uuid,text,text,text,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.set_my_organization_responsibility(uuid,text,text,text,jsonb) to authenticated;
grant execute on function public.create_my_work_item(uuid,text,text,text,uuid,uuid,uuid,text,text,timestamptz,text,jsonb) to authenticated;
grant execute on function public.act_my_work_item(uuid,text,text,jsonb) to authenticated;
grant execute on function public.create_my_achievement(uuid,uuid,text,text,text,timestamptz,text,jsonb,jsonb) to authenticated;
grant execute on function public.public_identity_page(text) to anon,authenticated;

comment on table public.identity_pages is 'Independent identity presentation for any canonical entity. Orientation is derived from the approved PlayIn365 geometry: player BR, coach BL, organization TL, other individuals TR.';
comment on table public.achievements is 'One verified achievement record that can be credited to multiple individuals, teams and organizations without duplication.';
comment on table public.work_items is 'Context-aware tasks and decisions routed to users or organization responsibilities.';
comment on table public.entity_activity_events is 'Shared timeline connecting individuals, organizations and event entities.';
