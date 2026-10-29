-- PlayIn365 — governed mass communications and periodic reports
-- One organization audience graph; no copied mailing lists.

begin;

alter table public.organization_access_roles
  add column if not exists can_manage_communications boolean not null default false;

update public.organization_access_roles
set can_manage_communications = true,
    updated_at = now()
where code in ('owner','admin');

create or replace function public.organization_user_has_permission(
  p_organization_id uuid,
  p_user_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
 select exists(
  select 1
  from public.organization_access_assignments a
  join public.organization_access_roles r
    on r.code=a.access_role_code and r.is_active
  where a.organization_id=p_organization_id
    and a.user_id=p_user_id
    and a.status='active'
    and case p_permission
      when 'manage_members' then r.can_manage_members
      when 'review_verifications' then r.can_review_verifications
      when 'manage_events' then r.can_manage_events
      when 'manage_profile' then r.can_manage_profile
      when 'manage_opportunities' then r.can_manage_opportunities
      when 'manage_contracts' then r.can_manage_contracts
      when 'manage_commerce' then r.can_manage_commerce
      when 'manage_finance' then r.can_manage_finance
      when 'manage_documents' then r.can_manage_documents
      when 'manage_integrations' then r.can_manage_integrations
      when 'manage_communications' then r.can_manage_communications
      else false
    end
 )
$function$;

create table if not exists public.organization_communication_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  code text not null,
  name_ar text not null,
  description_ar text,
  message_type text not null default 'announcement'
    check (message_type in ('announcement','reminder','urgent','report')),
  title_template text not null,
  body_template text not null,
  default_audience jsonb not null default '{}'::jsonb
    check (jsonb_typeof(default_audience)='object'),
  default_channels text[] not null default array['in_app']::text[],
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_communication_templates_system_code_uidx
  on public.organization_communication_templates(code)
  where organization_id is null;
create unique index if not exists organization_communication_templates_org_code_uidx
  on public.organization_communication_templates(organization_id,code)
  where organization_id is not null;

create table if not exists public.organization_broadcasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  actor_scope text not null check (actor_scope in ('organization','coach')),
  message_type text not null default 'announcement'
    check (message_type in ('announcement','reminder','urgent','report')),
  title text not null,
  body text not null,
  audience jsonb not null default '{}'::jsonb
    check (jsonb_typeof(audience)='object'),
  channels text[] not null default array['in_app']::text[],
  status text not null default 'draft'
    check (status in ('draft','scheduled','processing','sent','cancelled','failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  delivered_count integer not null default 0,
  read_count integer not null default 0,
  failed_count integer not null default 0,
  blocked_count integer not null default 0,
  external_pending_count integer not null default 0,
  report_run_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata)='object'),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(title)) between 1 and 180),
  check (char_length(trim(body)) between 1 and 12000)
);
create index if not exists organization_broadcasts_org_created_idx
  on public.organization_broadcasts(organization_id,created_at desc);
create index if not exists organization_broadcasts_due_idx
  on public.organization_broadcasts(scheduled_at)
  where status='scheduled';

create table if not exists public.organization_broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.organization_broadcasts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  relation_type text not null,
  team_id uuid references public.teams(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','delivered','read','external_pending','blocked','failed')),
  notification_id uuid references public.notifications(id) on delete set null,
  delivered_at timestamptz,
  read_at timestamptz,
  external_delivery jsonb not null default '{}'::jsonb
    check (jsonb_typeof(external_delivery)='object'),
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (broadcast_id,user_id)
);
create index if not exists organization_broadcast_recipients_user_idx
  on public.organization_broadcast_recipients(user_id,created_at desc);
create index if not exists organization_broadcast_recipients_broadcast_idx
  on public.organization_broadcast_recipients(broadcast_id,status);

create table if not exists public.organization_report_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  actor_scope text not null check (actor_scope in ('organization','coach')),
  name text not null,
  report_type text not null
    check (report_type in ('weekly_achievement','weekly_attendance','weekly_team_summary','monthly_management','monthly_financial','custom')),
  audience jsonb not null default '{}'::jsonb
    check (jsonb_typeof(audience)='object'),
  channels text[] not null default array['in_app']::text[],
  frequency text not null default 'weekly'
    check (frequency in ('daily','weekly','monthly')),
  day_of_week integer check (day_of_week between 0 and 6),
  day_of_month integer check (day_of_month between 1 and 28),
  send_time time not null default '18:00',
  timezone text not null default 'Asia/Riyadh',
  status text not null default 'active'
    check (status in ('active','paused','archived')),
  next_run_at timestamptz,
  last_run_at timestamptz,
  title_template text,
  body_template text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata)='object'),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organization_report_schedules_due_idx
  on public.organization_report_schedules(next_run_at)
  where status='active';
create index if not exists organization_report_schedules_org_idx
  on public.organization_report_schedules(organization_id,created_at desc);

create table if not exists public.organization_report_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.organization_report_schedules(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'generated'
    check (status in ('generated','sent','failed')),
  title text not null,
  body text not null,
  metrics jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metrics)='object'),
  broadcast_id uuid references public.organization_broadcasts(id) on delete set null,
  error_message text,
  generated_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists organization_report_runs_org_idx
  on public.organization_report_runs(organization_id,created_at desc);

alter table public.organization_broadcasts
  drop constraint if exists organization_broadcasts_report_run_id_fkey;
alter table public.organization_broadcasts
  add constraint organization_broadcasts_report_run_id_fkey
  foreign key (report_run_id) references public.organization_report_runs(id) on delete set null;

alter table public.organization_communication_templates enable row level security;
alter table public.organization_broadcasts enable row level security;
alter table public.organization_broadcast_recipients enable row level security;
alter table public.organization_report_schedules enable row level security;
alter table public.organization_report_runs enable row level security;

revoke all on public.organization_communication_templates from anon, authenticated;
revoke all on public.organization_broadcasts from anon, authenticated;
revoke all on public.organization_broadcast_recipients from anon, authenticated;
revoke all on public.organization_report_schedules from anon, authenticated;
revoke all on public.organization_report_runs from anon, authenticated;

insert into public.organization_communication_templates(
  organization_id,code,name_ar,description_ar,message_type,title_template,body_template,default_audience,default_channels,is_system
)
values
  (null,'training_reminder','تذكير التدريب','إرسال موعد وموقع الحصة للاعبين وأولياء الأمور.','reminder','تذكير: {{session_title}}','موعد الحصة {{session_date}} في {{venue}}. يرجى تأكيد الحضور وتحديث الجاهزية.',jsonb_build_object('roles',jsonb_build_array('players','guardians')),array['in_app'],true),
  (null,'match_reminder','تذكير المباراة','إرسال تفاصيل المباراة والقائمة للفريق وأولياء الأمور.','reminder','مباراة: {{match_title}}','المباراة يوم {{match_date}} في {{venue}}. راجع جاهزيتك وتعليمات الفريق.',jsonb_build_object('roles',jsonb_build_array('players','guardians')),array['in_app'],true),
  (null,'weekly_achievement','الإنجاز الأسبوعي','ملخص تلقائي للحضور والتدريب والمباريات والتقييمات.','report','الإنجاز الأسبوعي — {{organization_name}}','هذا ملخص أسبوعك الرياضي الموثق داخل PlayIn365.',jsonb_build_object('roles',jsonb_build_array('players','guardians','coaches')),array['in_app'],true),
  (null,'payment_reminder','تذكير الاستحقاق','تذكير أولياء الأمور بالاستحقاقات المفتوحة دون كشف تفاصيل لغير المخولين.','reminder','تذكير باستحقاق مالي','يوجد استحقاق مالي مفتوح. افتح رحلة الاشتراك والدفع لمراجعة التفاصيل.',jsonb_build_object('roles',jsonb_build_array('guardians')),array['in_app'],true),
  (null,'guardian_consent','طلب موافقة ولي الأمر','إشعار ولي الأمر بقرار يحتاج موافقته.','urgent','موافقة مطلوبة','يوجد قرار جديد متعلق بابنك يحتاج موافقتك داخل PlayIn365.',jsonb_build_object('roles',jsonb_build_array('guardians')),array['in_app'],true)
on conflict do nothing;

create or replace function private.communication_actor_scope(
  p_organization_id uuid,
  p_user_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if p_user_id is null then return null; end if;

  if public.organization_user_has_permission(p_organization_id,p_user_id,'manage_communications')
     or exists(
       select 1
       from public.organization_responsibility_assignments r
       where r.organization_id=p_organization_id
         and r.user_id=p_user_id
         and r.status='active'
         and (r.starts_at is null or r.starts_at<=now())
         and (r.ends_at is null or r.ends_at>now())
         and r.responsibility_code in ('owner','executive','academy_admin','operations','marketing','content','registration','hr','finance')
     )
  then return 'organization'; end if;

  if exists(
       select 1
       from public.organization_memberships m
       where m.organization_id=p_organization_id
         and m.user_id=p_user_id
         and m.status='active'
         and m.role_code in ('coach','head_coach','assistant_coach','technical_staff','performance_analyst','strength_conditioning')
     )
     or exists(
       select 1
       from public.organization_responsibility_assignments r
       where r.organization_id=p_organization_id
         and r.user_id=p_user_id
         and r.status='active'
         and r.responsibility_code='coach'
     )
     or exists(
       select 1 from public.teams t
       where t.organization_id=p_organization_id
         and t.status='active'
         and t.head_coach_user_id=p_user_id
     )
     or exists(
       select 1 from public.training_sessions s
       where s.organization_id=p_organization_id
         and s.assigned_coach_user_id=p_user_id
     )
  then return 'coach'; end if;

  return null;
end
$function$;

create or replace function private.communication_managed_team_ids(
  p_organization_id uuid,
  p_user_id uuid
)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(array_agg(distinct q.team_id),'{}'::uuid[])
  from (
    select t.id as team_id
    from public.teams t
    where t.organization_id=p_organization_id
      and t.status='active'
      and t.head_coach_user_id=p_user_id
    union
    select s.team_id
    from public.training_sessions s
    where s.organization_id=p_organization_id
      and s.assigned_coach_user_id=p_user_id
      and s.team_id is not null
    union
    select m.home_team_id
    from public.matches m
    join public.teams t on t.id=m.home_team_id and t.organization_id=p_organization_id
    where m.assigned_coach_user_id=p_user_id
    union
    select m.away_team_id
    from public.matches m
    join public.teams t on t.id=m.away_team_id and t.organization_id=p_organization_id
    where m.assigned_coach_user_id=p_user_id
  ) q
  where q.team_id is not null
$function$;

create or replace function private.communication_validate_audience(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_audience jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_scope text;
  v_roles text[];
  v_team_ids uuid[];
  v_managed uuid[];
  v_invalid uuid[];
begin
  if p_audience is null or jsonb_typeof(p_audience)<>'object' then
    raise exception 'audience_must_be_object';
  end if;
  v_scope:=private.communication_actor_scope(p_organization_id,p_actor_user_id);
  if v_scope is null then raise exception 'communication_scope_required'; end if;

  select coalesce(array_agg(lower(value)),'{}'::text[]) into v_roles
  from jsonb_array_elements_text(coalesce(p_audience->'roles','[]'::jsonb));
  if cardinality(v_roles)=0 then v_roles:=array['players']::text[]; end if;
  if exists(select 1 from unnest(v_roles) r where r not in ('all','players','coaches','staff','guardians','management')) then
    raise exception 'invalid_audience_role';
  end if;

  begin
    select coalesce(array_agg(value::uuid),'{}'::uuid[]) into v_team_ids
    from jsonb_array_elements_text(coalesce(p_audience->'team_ids','[]'::jsonb));
  exception when invalid_text_representation then
    raise exception 'invalid_team_id';
  end;

  if exists(
    select 1 from unnest(v_team_ids) x
    where not exists(select 1 from public.teams t where t.id=x and t.organization_id=p_organization_id and t.status='active')
  ) then raise exception 'team_outside_organization'; end if;

  if v_scope='coach' then
    if exists(select 1 from unnest(v_roles) r where r not in ('players','guardians')) then
      raise exception 'coach_audience_restricted';
    end if;
    v_managed:=private.communication_managed_team_ids(p_organization_id,p_actor_user_id);
    if cardinality(v_managed)=0 then raise exception 'coach_has_no_managed_team'; end if;
    if cardinality(v_team_ids)=0 then v_team_ids:=v_managed; end if;
    select coalesce(array_agg(x),'{}'::uuid[]) into v_invalid
    from unnest(v_team_ids) x where not (x=any(v_managed));
    if cardinality(v_invalid)>0 then raise exception 'coach_team_scope_violation'; end if;
  end if;

  return jsonb_build_object(
    'actor_scope',v_scope,
    'roles',to_jsonb(v_roles),
    'team_ids',to_jsonb(v_team_ids),
    'include_guardians',('guardians'=any(v_roles) or 'all'=any(v_roles))
  );
end
$function$;

create or replace function private.communication_audience_users(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_audience jsonb
)
returns table(user_id uuid, relation_type text, team_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $function$
with validated as (
  select private.communication_validate_audience(p_organization_id,p_actor_user_id,p_audience) as v
), filters as (
  select
    array(select jsonb_array_elements_text(v->'roles'))::text[] as roles,
    array(select jsonb_array_elements_text(v->'team_ids'))::uuid[] as team_ids
  from validated
), org_members as (
  select m.user_id,m.role_code,p.display_name,p.name
  from public.organization_memberships m
  join public.profiles p on p.id=m.user_id
  where m.organization_id=p_organization_id and m.status='active'
), player_links as (
  select distinct om.user_id,ta.team_id,coalesce(p.display_name,p.name,'لاعب') as display_name
  from org_members om
  join public.athlete_profiles ap on ap.user_id=om.user_id
  left join public.team_athletes ta on ta.athlete_id=ap.id and ta.status='active'
  cross join filters f
  where om.role_code='player'
    and (cardinality(f.team_ids)=0 or ta.team_id=any(f.team_ids))
), coach_links as (
  select distinct om.user_id,t.id as team_id,coalesce(om.display_name,om.name,'مدرب') as display_name
  from org_members om
  left join public.teams t on t.organization_id=p_organization_id
    and t.status='active'
    and (t.head_coach_user_id=om.user_id or exists(
      select 1 from public.training_sessions s
      where s.team_id=t.id and s.assigned_coach_user_id=om.user_id
    ))
  cross join filters f
  where om.role_code in ('coach','head_coach','assistant_coach','technical_staff','performance_analyst','strength_conditioning')
    and (cardinality(f.team_ids)=0 or t.id=any(f.team_ids))
), guardian_links as (
  select distinct g.guardian_user_id as user_id,pl.team_id,coalesce(gp.display_name,gp.name,'ولي أمر') as display_name
  from player_links pl
  join public.athlete_profiles ap on ap.user_id=pl.user_id
  join public.guardianships g on g.athlete_id=ap.id and g.status='verified'
  join public.profiles gp on gp.id=g.guardian_user_id
), staff_links as (
  select distinct om.user_id,null::uuid as team_id,coalesce(om.display_name,om.name,'عضو') as display_name
  from org_members om
  where om.role_code not in ('player','coach','head_coach','assistant_coach','technical_staff','performance_analyst','strength_conditioning')
), management_links as (
  select distinct r.user_id,null::uuid as team_id,coalesce(p.display_name,p.name,'إداري') as display_name
  from public.organization_responsibility_assignments r
  join public.profiles p on p.id=r.user_id
  where r.organization_id=p_organization_id
    and r.status='active'
    and r.responsibility_code in ('owner','executive','academy_admin','operations','marketing','content','registration','hr','finance')
), unioned as (
  select p.user_id,'player'::text as relation_type,p.team_id,p.display_name
  from player_links p cross join filters f
  where 'players'=any(f.roles) or 'all'=any(f.roles)
  union all
  select c.user_id,'coach',c.team_id,c.display_name
  from coach_links c cross join filters f
  where 'coaches'=any(f.roles) or 'all'=any(f.roles)
  union all
  select g.user_id,'guardian',g.team_id,g.display_name
  from guardian_links g cross join filters f
  where 'guardians'=any(f.roles) or 'all'=any(f.roles)
  union all
  select s.user_id,'staff',s.team_id,s.display_name
  from staff_links s cross join filters f
  where 'staff'=any(f.roles) or 'all'=any(f.roles)
  union all
  select m.user_id,'management',m.team_id,m.display_name
  from management_links m cross join filters f
  where 'management'=any(f.roles) or 'all'=any(f.roles)
), explicit_users as (
  select p.id as user_id,'explicit'::text as relation_type,null::uuid as team_id,coalesce(p.display_name,p.name,'مستخدم') display_name
  from public.profiles p
  where p.id in (
    select value::uuid
    from jsonb_array_elements_text(coalesce(p_audience->'user_ids','[]'::jsonb))
  )
  and exists(
    select 1 from public.organization_memberships m
    where m.organization_id=p_organization_id and m.user_id=p.id and m.status='active'
  )
)
select distinct on (x.user_id) x.user_id,x.relation_type,x.team_id,x.display_name
from (
  select * from unioned
  union all
  select * from explicit_users
) x
where x.user_id<>p_actor_user_id
order by x.user_id,case x.relation_type when 'player' then 1 when 'guardian' then 2 when 'coach' then 3 else 4 end
$function$;

create or replace function private.communication_provider_state(
  p_organization_id uuid,
  p_channel text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when p_channel='in_app' then jsonb_build_object('mode','native','ready',true)
    else coalesce((
      select jsonb_build_object(
        'mode','experimental',
        'ready',false,
        'provider_code',i.provider_code,
        'status',i.status,
        'credential_state',i.credential_state,
        'reason','provider_delivery_not_activated'
      )
      from public.organization_integrations i
      where i.organization_id=p_organization_id
        and i.provider_code=case p_channel
          when 'whatsapp' then 'unifonic'
          when 'sms' then 'unifonic'
          when 'voice' then 'unifonic'
          when 'push' then 'firebase-cloud-messaging'
          when 'email' then 'resend'
          else p_channel
        end
      order by i.updated_at desc limit 1
    ),jsonb_build_object('mode','experimental','ready',false,'reason','provider_not_configured'))
  end
$function$;

create or replace function private.dispatch_organization_broadcast(
  p_broadcast_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_b public.organization_broadcasts%rowtype;
  v_rec record;
  v_notification_id uuid;
  v_external text[];
  v_external_state jsonb:='{}'::jsonb;
  v_count integer:=0;
  v_delivered integer:=0;
  v_external_pending integer:=0;
  v_kind text;
begin
  select * into v_b from public.organization_broadcasts where id=p_broadcast_id for update;
  if not found then raise exception 'broadcast_not_found'; end if;
  if v_b.status in ('sent','cancelled') then return jsonb_build_object('changed',false,'status',v_b.status); end if;

  update public.organization_broadcasts set status='processing',updated_at=now() where id=v_b.id;

  v_external:=array(select x from unnest(v_b.channels) x where x<>'in_app');
  foreach v_kind in array v_external loop
    v_external_state:=v_external_state||jsonb_build_object(v_kind,private.communication_provider_state(v_b.organization_id,v_kind));
  end loop;

  for v_rec in
    select * from private.communication_audience_users(v_b.organization_id,v_b.created_by_user_id,v_b.audience)
  loop
    v_count:=v_count+1;
    v_notification_id:=null;

    if 'in_app'=any(v_b.channels) then
      insert into public.notifications(user_id,kind,title,body,notification_type,data,read,read_at,created_at)
      values(
        v_rec.user_id,
        case when v_b.message_type='report' then 'report' else 'general' end,
        v_b.title,
        v_b.body,
        'organization_broadcast',
        jsonb_build_object(
          'route','communicationInbox',
          'broadcast_id',v_b.id,
          'organization_id',v_b.organization_id,
          'message_type',v_b.message_type,
          'team_id',v_rec.team_id,
          'sender_scope',v_b.actor_scope
        ),
        false,null,now()
      ) returning id into v_notification_id;
      v_delivered:=v_delivered+1;
    end if;

    if cardinality(v_external)>0 then v_external_pending:=v_external_pending+1; end if;

    insert into public.organization_broadcast_recipients(
      broadcast_id,organization_id,user_id,relation_type,team_id,status,notification_id,delivered_at,external_delivery
    ) values(
      v_b.id,v_b.organization_id,v_rec.user_id,v_rec.relation_type,v_rec.team_id,
      case when v_notification_id is not null then 'delivered' when cardinality(v_external)>0 then 'external_pending' else 'blocked' end,
      v_notification_id,case when v_notification_id is not null then now() else null end,v_external_state
    )
    on conflict (broadcast_id,user_id) do update
      set relation_type=excluded.relation_type,
          team_id=excluded.team_id,
          status=excluded.status,
          notification_id=coalesce(public.organization_broadcast_recipients.notification_id,excluded.notification_id),
          delivered_at=coalesce(public.organization_broadcast_recipients.delivered_at,excluded.delivered_at),
          external_delivery=excluded.external_delivery,
          updated_at=now();
  end loop;

  update public.organization_broadcasts
  set status=case when v_count=0 then 'failed' else 'sent' end,
      sent_at=case when v_count>0 then now() else null end,
      recipient_count=v_count,
      delivered_count=v_delivered,
      external_pending_count=v_external_pending,
      failed_count=case when v_count=0 then 1 else 0 end,
      metadata=metadata||jsonb_build_object(
        'external_channels',to_jsonb(v_external),
        'external_provider_state',v_external_state,
        'external_delivery_mode','experimental_not_activated'
      ),
      updated_at=now()
  where id=v_b.id;

  return jsonb_build_object(
    'changed',true,'broadcast_id',v_b.id,'recipients',v_count,'delivered_in_app',v_delivered,
    'external_pending',v_external_pending,'external_provider_state',v_external_state
  );
exception when others then
  update public.organization_broadcasts
  set status='failed',failed_count=greatest(failed_count,1),metadata=metadata||jsonb_build_object('dispatch_error',sqlerrm),updated_at=now()
  where id=p_broadcast_id;
  raise;
end
$function$;

create or replace function private.communication_next_run(
  p_frequency text,
  p_day_of_week integer,
  p_day_of_month integer,
  p_send_time time,
  p_timezone text,
  p_after timestamptz default now()
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_local timestamp;
  v_candidate timestamp;
  v_days integer;
begin
  v_local:=p_after at time zone coalesce(nullif(p_timezone,''),'Asia/Riyadh');
  if p_frequency='daily' then
    v_candidate:=date_trunc('day',v_local)+p_send_time;
    if v_candidate<=v_local then v_candidate:=v_candidate+interval '1 day'; end if;
  elsif p_frequency='weekly' then
    v_days:=((coalesce(p_day_of_week,0)-extract(dow from v_local)::integer)+7)%7;
    v_candidate:=date_trunc('day',v_local)+(v_days||' days')::interval+p_send_time;
    if v_candidate<=v_local then v_candidate:=v_candidate+interval '7 days'; end if;
  elsif p_frequency='monthly' then
    v_candidate:=date_trunc('month',v_local)+((least(greatest(coalesce(p_day_of_month,1),1),28)-1)||' days')::interval+p_send_time;
    if v_candidate<=v_local then
      v_candidate:=date_trunc('month',v_local+interval '1 month')+((least(greatest(coalesce(p_day_of_month,1),1),28)-1)||' days')::interval+p_send_time;
    end if;
  else
    raise exception 'invalid_frequency';
  end if;
  return v_candidate at time zone coalesce(nullif(p_timezone,''),'Asia/Riyadh');
end
$function$;

create or replace function private.organization_report_metrics(
  p_organization_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_audience jsonb default '{}'::jsonb
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
with session_stats as (
  select count(*)::integer sessions,
         count(*) filter(where s.status in ('completed','closed'))::integer completed_sessions
  from public.training_sessions s
  where s.organization_id=p_organization_id and s.starts_at>=p_period_start and s.starts_at<p_period_end
), attendance_stats as (
  select count(*)::integer attendance_records,
         count(*) filter(where a.attendance_status in ('present','attended','late'))::integer attended,
         count(*) filter(where a.attendance_status in ('absent','excused_absence'))::integer absent
  from public.training_session_attendance a
  join public.training_sessions s on s.id=a.training_session_id
  where s.organization_id=p_organization_id and s.starts_at>=p_period_start and s.starts_at<p_period_end
), match_stats as (
  select count(distinct m.id)::integer matches,
         count(distinct m.id) filter(where m.status in ('completed','final','closed'))::integer completed_matches
  from public.matches m
  where (m.organizer_organization_id=p_organization_id or exists(
    select 1 from public.teams t where t.organization_id=p_organization_id and t.id in (m.home_team_id,m.away_team_id)
  ))
  and coalesce(m.starts_at,m.kickoff_at,m.created_at)>=p_period_start
  and coalesce(m.starts_at,m.kickoff_at,m.created_at)<p_period_end
), evaluation_stats as (
  select count(*)::integer evaluations,
         round(avg((coalesce(e.technical_score,0)+coalesce(e.tactical_score,0)+coalesce(e.physical_score,0)+coalesce(e.mentality_score,0))/nullif((case when e.technical_score is not null then 1 else 0 end+case when e.tactical_score is not null then 1 else 0 end+case when e.physical_score is not null then 1 else 0 end+case when e.mentality_score is not null then 1 else 0 end),0)),1) average_score
  from public.coach_evaluations e
  where e.organization_id=p_organization_id and e.evaluated_at>=p_period_start and e.evaluated_at<p_period_end
), member_stats as (
  select count(*) filter(where m.status='active')::integer active_members,
         count(*) filter(where m.created_at>=p_period_start and m.created_at<p_period_end)::integer new_members
  from public.organization_memberships m where m.organization_id=p_organization_id
), opportunity_stats as (
  select count(distinct o.id)::integer opportunities,
         count(c.id)::integer applications,
         count(c.id) filter(where c.stage in ('accepted','admitted'))::integer accepted_candidates
  from public.opportunities o
  left join public.opportunity_candidates c on c.opportunity_id=o.id and c.created_at>=p_period_start and c.created_at<p_period_end
  where o.organization_id=p_organization_id and o.created_at<p_period_end
), finance_stats as (
  select count(distinct i.id)::integer invoices,
         coalesce(sum(i.total_amount) filter(where i.issued_at>=p_period_start and i.issued_at<p_period_end),0)::numeric issued_amount,
         coalesce((select sum(p.amount) from public.payments p where p.payee_organization_id=p_organization_id and p.status in ('paid','completed','captured') and p.paid_at>=p_period_start and p.paid_at<p_period_end),0)::numeric collected_amount
  from public.invoices i
  where i.issuer_organization_id=p_organization_id and i.issued_at<p_period_end
)
select jsonb_build_object(
  'period_start',p_period_start,'period_end',p_period_end,
  'training',to_jsonb(s),'attendance',to_jsonb(a),'matches',to_jsonb(m),
  'evaluations',to_jsonb(e),'members',to_jsonb(mm),'opportunities',to_jsonb(o),'finance',to_jsonb(f),
  'attendance_rate',case when a.attendance_records>0 then round((a.attended::numeric/a.attendance_records::numeric)*100,1) else 0 end,
  'privacy',jsonb_build_object('medical_data_included',false,'private_coach_notes_included',false,'individual_financial_details_included',false)
)
from session_stats s,attendance_stats a,match_stats m,evaluation_stats e,member_stats mm,opportunity_stats o,finance_stats f
$function$;

create or replace function private.generate_organization_report_run(
  p_schedule_id uuid,
  p_period_end timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_s public.organization_report_schedules%rowtype;
  v_org public.organizations%rowtype;
  v_start timestamptz;
  v_metrics jsonb;
  v_title text;
  v_body text;
  v_run_id uuid;
  v_broadcast_id uuid;
  v_attendance text;
begin
  select * into v_s from public.organization_report_schedules where id=p_schedule_id for update;
  if not found then raise exception 'schedule_not_found'; end if;
  select * into v_org from public.organizations where id=v_s.organization_id;
  v_start:=case v_s.frequency when 'daily' then p_period_end-interval '1 day' when 'monthly' then p_period_end-interval '1 month' else p_period_end-interval '7 days' end;
  v_metrics:=private.organization_report_metrics(v_s.organization_id,v_start,p_period_end,v_s.audience);
  v_attendance:=coalesce(v_metrics->>'attendance_rate','0');
  v_title:=coalesce(nullif(trim(coalesce(v_s.title_template,'')),''),case v_s.report_type
    when 'weekly_attendance' then 'تقرير الحضور الأسبوعي — '
    when 'weekly_team_summary' then 'ملخص الفريق الأسبوعي — '
    when 'monthly_management' then 'التقرير الإداري الشهري — '
    when 'monthly_financial' then 'الملخص المالي الشهري — '
    else 'الإنجاز الأسبوعي — ' end||coalesce(v_org.name_ar,v_org.name_en,'الأكاديمية'));
  v_body:=coalesce(nullif(trim(coalesce(v_s.body_template,'')),''),
    'الفترة: '||to_char(v_start at time zone v_s.timezone,'YYYY-MM-DD')||' — '||to_char(p_period_end at time zone v_s.timezone,'YYYY-MM-DD')||E'\n'||
    'الحصص: '||coalesce(v_metrics#>>'{training,sessions}','0')||' · نسبة الحضور: '||v_attendance||'٪'||E'\n'||
    'المباريات: '||coalesce(v_metrics#>>'{matches,matches}','0')||' · التقييمات: '||coalesce(v_metrics#>>'{evaluations,evaluations}','0')||E'\n'||
    'الأعضاء الجدد: '||coalesce(v_metrics#>>'{members,new_members}','0')||' · طلبات الفرص: '||coalesce(v_metrics#>>'{opportunities,applications}','0')||E'\n'||
    'المعلومات مبنية على النشاط الموثق في PlayIn365 ولا تتضمن بيانات طبية أو ملاحظات فنية خاصة.');

  insert into public.organization_report_runs(schedule_id,organization_id,report_type,period_start,period_end,status,title,body,metrics)
  values(v_s.id,v_s.organization_id,v_s.report_type,v_start,p_period_end,'generated',v_title,v_body,v_metrics)
  returning id into v_run_id;

  insert into public.organization_broadcasts(
    organization_id,created_by_user_id,actor_scope,message_type,title,body,audience,channels,status,scheduled_at,report_run_id,metadata,is_demo
  ) values(
    v_s.organization_id,v_s.created_by_user_id,v_s.actor_scope,'report',v_title,v_body,v_s.audience,v_s.channels,'draft',now(),v_run_id,
    jsonb_build_object('report_type',v_s.report_type,'schedule_id',v_s.id,'metrics',v_metrics),v_s.is_demo
  ) returning id into v_broadcast_id;

  update public.organization_report_runs set broadcast_id=v_broadcast_id where id=v_run_id;
  perform private.dispatch_organization_broadcast(v_broadcast_id);
  update public.organization_report_runs set status='sent',sent_at=now() where id=v_run_id;
  update public.organization_report_schedules
  set last_run_at=p_period_end,
      next_run_at=private.communication_next_run(frequency,day_of_week,day_of_month,send_time,timezone,p_period_end),
      updated_at=now()
  where id=v_s.id;
  return v_run_id;
exception when others then
  if v_run_id is not null then update public.organization_report_runs set status='failed',error_message=sqlerrm where id=v_run_id; end if;
  raise;
end
$function$;

create or replace function private.process_due_organization_communications(
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row record;
  v_broadcasts integer:=0;
  v_reports integer:=0;
  v_errors integer:=0;
begin
  for v_row in
    select id from public.organization_broadcasts
    where status='scheduled' and scheduled_at<=now()
    order by scheduled_at
    for update skip locked
    limit least(greatest(coalesce(p_limit,50),1),200)
  loop
    begin perform private.dispatch_organization_broadcast(v_row.id); v_broadcasts:=v_broadcasts+1;
    exception when others then v_errors:=v_errors+1; end;
  end loop;

  for v_row in
    select id from public.organization_report_schedules
    where status='active' and next_run_at is not null and next_run_at<=now()
    order by next_run_at
    for update skip locked
    limit least(greatest(coalesce(p_limit,50),1),200)
  loop
    begin perform private.generate_organization_report_run(v_row.id,now()); v_reports:=v_reports+1;
    exception when others then v_errors:=v_errors+1; end;
  end loop;

  return jsonb_build_object('broadcasts_processed',v_broadcasts,'reports_processed',v_reports,'errors',v_errors,'processed_at',now());
end
$function$;

create or replace function private.sync_broadcast_recipient_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_broadcast uuid;
begin
  if new.read_at is not null and old.read_at is null then
    update public.organization_broadcast_recipients
    set status='read',read_at=new.read_at,updated_at=now()
    where notification_id=new.id
    returning broadcast_id into v_broadcast;
    if v_broadcast is not null then
      update public.organization_broadcasts b
      set read_count=(select count(*) from public.organization_broadcast_recipients r where r.broadcast_id=b.id and r.read_at is not null),updated_at=now()
      where b.id=v_broadcast;
    end if;
  end if;
  return new;
end
$function$;

drop trigger if exists sync_broadcast_recipient_read on public.notifications;
create trigger sync_broadcast_recipient_read
after update of read_at on public.notifications
for each row execute function private.sync_broadcast_recipient_read();

create or replace function public.preview_my_organization_communication_audience(
  p_organization_id uuid,
  p_audience jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_valid jsonb;
  v_rows jsonb;
  v_count integer;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_valid:=private.communication_validate_audience(p_organization_id,v_uid,p_audience);
  select count(*),coalesce(jsonb_agg(jsonb_build_object('user_id',x.user_id,'relation_type',x.relation_type,'team_id',x.team_id,'display_name',x.display_name) order by x.relation_type,x.display_name),'[]'::jsonb)
  into v_count,v_rows
  from private.communication_audience_users(p_organization_id,v_uid,p_audience) x;
  return jsonb_build_object('count',v_count,'audience',v_valid,'sample',coalesce(v_rows,'[]'::jsonb));
end
$function$;

create or replace function public.my_organization_communication_center(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_scope text;
  v_teams jsonb;
  v_templates jsonb;
  v_broadcasts jsonb;
  v_schedules jsonb;
  v_integrations jsonb;
  v_unread integer;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_scope:=private.communication_actor_scope(p_organization_id,v_uid);
  if v_scope is null then raise exception 'communication_scope_required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'age_category',t.age_category,'managed',v_scope='organization' or t.id=any(private.communication_managed_team_ids(p_organization_id,v_uid))) order by t.name),'[]'::jsonb)
  into v_teams from public.teams t where t.organization_id=p_organization_id and t.status='active';

  select coalesce(jsonb_agg(to_jsonb(x) order by x.is_system desc,x.name_ar),'[]'::jsonb) into v_templates
  from (
    select id,organization_id,code,name_ar,description_ar,message_type,title_template,body_template,default_audience,default_channels,is_system,is_active
    from public.organization_communication_templates
    where is_active and (organization_id is null or organization_id=p_organization_id)
  ) x;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_broadcasts
  from (
    select b.id,b.message_type,b.title,b.body,b.audience,b.channels,b.status,b.scheduled_at,b.sent_at,b.recipient_count,b.delivered_count,b.read_count,b.failed_count,b.blocked_count,b.external_pending_count,b.metadata,b.created_at
    from public.organization_broadcasts b
    where b.organization_id=p_organization_id and (v_scope='organization' or b.created_by_user_id=v_uid)
    order by b.created_at desc limit 100
  ) x;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_schedules
  from (
    select s.id,s.name,s.report_type,s.audience,s.channels,s.frequency,s.day_of_week,s.day_of_month,s.send_time,s.timezone,s.status,s.next_run_at,s.last_run_at,s.actor_scope,s.created_at
    from public.organization_report_schedules s
    where s.organization_id=p_organization_id and (v_scope='organization' or s.created_by_user_id=v_uid)
    order by s.created_at desc limit 100
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('provider_code',i.provider_code,'system_type',i.system_type,'status',i.status,'credential_state',i.credential_state,'last_success_at',i.last_success_at) order by i.provider_code),'[]'::jsonb)
  into v_integrations
  from public.organization_integrations i
  where i.organization_id=p_organization_id and i.provider_code in ('unifonic','firebase-cloud-messaging','resend');

  select count(*) into v_unread from public.organization_broadcast_recipients r where r.user_id=v_uid and r.organization_id=p_organization_id and r.read_at is null;

  return jsonb_build_object(
    'actor_scope',v_scope,
    'organization_id',p_organization_id,
    'managed_team_ids',to_jsonb(private.communication_managed_team_ids(p_organization_id,v_uid)),
    'teams',v_teams,'templates',v_templates,'broadcasts',v_broadcasts,'schedules',v_schedules,
    'integrations',v_integrations,'unread',v_unread,
    'channels',jsonb_build_array(
      jsonb_build_object('code','in_app','label','داخل PlayIn365','state','ready'),
      jsonb_build_object('code','push','label','إشعار الجوال','state','experimental'),
      jsonb_build_object('code','whatsapp','label','واتساب','state','experimental'),
      jsonb_build_object('code','sms','label','رسالة نصية','state','experimental'),
      jsonb_build_object('code','email','label','البريد الإلكتروني','state','experimental')
    ),
    'principle',jsonb_build_object('dynamic_audience',true,'copied_lists',false,'coach_team_scope',true,'guardian_verified_links_only',true,'external_channels_experimental',true)
  );
end
$function$;

create or replace function public.create_my_organization_broadcast(
  p_organization_id uuid,
  p_message_type text,
  p_title text,
  p_body text,
  p_audience jsonb,
  p_channels text[] default array['in_app']::text[],
  p_scheduled_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_scope text;
  v_valid jsonb;
  v_channels text[];
  v_row public.organization_broadcasts%rowtype;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_scope:=private.communication_actor_scope(p_organization_id,v_uid);
  if v_scope is null then raise exception 'communication_scope_required'; end if;
  if p_message_type not in ('announcement','reminder','urgent','report') then raise exception 'invalid_message_type'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 1 and 180 then raise exception 'invalid_title'; end if;
  if char_length(trim(coalesce(p_body,''))) not between 1 and 12000 then raise exception 'invalid_body'; end if;
  if p_metadata is null or jsonb_typeof(p_metadata)<>'object' then raise exception 'metadata_must_be_object'; end if;
  v_valid:=private.communication_validate_audience(p_organization_id,v_uid,p_audience);
  select coalesce(array_agg(distinct lower(x)),'{}'::text[]) into v_channels from unnest(coalesce(p_channels,array['in_app']::text[])) x;
  if cardinality(v_channels)=0 then v_channels:=array['in_app']; end if;
  if exists(select 1 from unnest(v_channels) x where x not in ('in_app','push','whatsapp','sms','email','voice')) then raise exception 'invalid_channel'; end if;

  insert into public.organization_broadcasts(
    organization_id,created_by_user_id,actor_scope,message_type,title,body,audience,channels,status,scheduled_at,metadata,is_demo
  ) values(
    p_organization_id,v_uid,v_scope,p_message_type,trim(p_title),trim(p_body),p_audience,v_channels,
    case when p_scheduled_at is not null and p_scheduled_at>now() then 'scheduled' else 'draft' end,
    p_scheduled_at,p_metadata||jsonb_build_object('validated_audience',v_valid),coalesce((p_metadata->>'demo')::boolean,false)
  ) returning * into v_row;

  if v_row.status='draft' then v_result:=private.dispatch_organization_broadcast(v_row.id);
  else v_result:=jsonb_build_object('changed',true,'broadcast_id',v_row.id,'status','scheduled','scheduled_at',v_row.scheduled_at); end if;

  return v_result||jsonb_build_object('broadcast_id',v_row.id,'actor_scope',v_scope);
end
$function$;

create or replace function public.cancel_my_organization_broadcast(
  p_broadcast_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid(); v_row public.organization_broadcasts%rowtype; v_scope text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_row from public.organization_broadcasts where id=p_broadcast_id for update;
  if not found then raise exception 'broadcast_not_found'; end if;
  v_scope:=private.communication_actor_scope(v_row.organization_id,v_uid);
  if v_scope is null or (v_scope='coach' and v_row.created_by_user_id<>v_uid) then raise exception 'communication_scope_required'; end if;
  if v_row.status not in ('draft','scheduled') then raise exception 'broadcast_cannot_be_cancelled'; end if;
  update public.organization_broadcasts set status='cancelled',updated_at=now() where id=v_row.id;
  return jsonb_build_object('changed',true,'broadcast_id',v_row.id,'status','cancelled');
end
$function$;

create or replace function public.my_communication_inbox(
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid(); v_rows jsonb; v_unread integer;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select count(*) into v_unread from public.organization_broadcast_recipients r where r.user_id=v_uid and r.read_at is null;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_rows
  from (
    select b.id as broadcast_id,b.organization_id,coalesce(o.name_ar,o.name_en,'الجهة') organization_name,
           b.message_type,b.title,b.body,b.channels,b.sent_at,b.created_at,b.metadata,
           r.relation_type,r.team_id,r.status,r.delivered_at,r.read_at,(r.read_at is null) is_unread
    from public.organization_broadcast_recipients r
    join public.organization_broadcasts b on b.id=r.broadcast_id
    join public.organizations o on o.id=b.organization_id
    where r.user_id=v_uid
    order by b.created_at desc
    limit least(greatest(coalesce(p_limit,100),1),200)
  ) x;
  return jsonb_build_object('summary',jsonb_build_object('unread',v_unread),'items',v_rows);
end
$function$;

create or replace function public.mark_my_communication_read(
  p_broadcast_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid(); v_notification uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  update public.organization_broadcast_recipients
  set status='read',read_at=coalesce(read_at,now()),updated_at=now()
  where broadcast_id=p_broadcast_id and user_id=v_uid
  returning notification_id into v_notification;
  if not found then raise exception 'communication_not_found'; end if;
  if v_notification is not null then update public.notifications set read=true,read_at=coalesce(read_at,now()) where id=v_notification and user_id=v_uid; end if;
  update public.organization_broadcasts b set read_count=(select count(*) from public.organization_broadcast_recipients r where r.broadcast_id=b.id and r.read_at is not null),updated_at=now() where b.id=p_broadcast_id;
  return jsonb_build_object('changed',true,'broadcast_id',p_broadcast_id,'read_at',now());
end
$function$;

create or replace function public.save_my_organization_communication_template(
  p_organization_id uuid,
  p_template_id uuid,
  p_code text,
  p_name_ar text,
  p_description_ar text,
  p_message_type text,
  p_title_template text,
  p_body_template text,
  p_default_audience jsonb,
  p_default_channels text[],
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare v_uid uuid:=auth.uid(); v_scope text; v_row public.organization_communication_templates%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_scope:=private.communication_actor_scope(p_organization_id,v_uid);
  if v_scope<>'organization' then raise exception 'organization_communication_admin_required'; end if;
  perform private.communication_validate_audience(p_organization_id,v_uid,p_default_audience);
  if p_message_type not in ('announcement','reminder','urgent','report') then raise exception 'invalid_message_type'; end if;
  insert into public.organization_communication_templates(id,organization_id,code,name_ar,description_ar,message_type,title_template,body_template,default_audience,default_channels,is_system,is_active,created_by_user_id)
  values(coalesce(p_template_id,gen_random_uuid()),p_organization_id,lower(trim(p_code)),trim(p_name_ar),nullif(trim(coalesce(p_description_ar,'')),''),p_message_type,trim(p_title_template),trim(p_body_template),p_default_audience,coalesce(p_default_channels,array['in_app']),false,coalesce(p_is_active,true),v_uid)
  on conflict (organization_id,code) where organization_id is not null do update
    set name_ar=excluded.name_ar,description_ar=excluded.description_ar,message_type=excluded.message_type,title_template=excluded.title_template,body_template=excluded.body_template,default_audience=excluded.default_audience,default_channels=excluded.default_channels,is_active=excluded.is_active,updated_at=now()
  returning * into v_row;
  return jsonb_build_object('changed',true,'template',to_jsonb(v_row));
end
$function$;

create or replace function public.save_my_organization_report_schedule(
  p_organization_id uuid,
  p_schedule_id uuid,
  p_name text,
  p_report_type text,
  p_audience jsonb,
  p_channels text[],
  p_frequency text,
  p_day_of_week integer,
  p_day_of_month integer,
  p_send_time time,
  p_timezone text default 'Asia/Riyadh',
  p_title_template text default null,
  p_body_template text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid(); v_scope text; v_valid jsonb; v_row public.organization_report_schedules%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  v_scope:=private.communication_actor_scope(p_organization_id,v_uid);
  if v_scope is null then raise exception 'communication_scope_required'; end if;
  if p_report_type not in ('weekly_achievement','weekly_attendance','weekly_team_summary','monthly_management','monthly_financial','custom') then raise exception 'invalid_report_type'; end if;
  if v_scope='coach' and p_report_type not in ('weekly_achievement','weekly_attendance','weekly_team_summary','custom') then raise exception 'coach_report_scope_restricted'; end if;
  v_valid:=private.communication_validate_audience(p_organization_id,v_uid,p_audience);
  if p_frequency not in ('daily','weekly','monthly') then raise exception 'invalid_frequency'; end if;

  insert into public.organization_report_schedules(
    id,organization_id,created_by_user_id,actor_scope,name,report_type,audience,channels,frequency,day_of_week,day_of_month,send_time,timezone,status,next_run_at,title_template,body_template,metadata
  ) values(
    coalesce(p_schedule_id,gen_random_uuid()),p_organization_id,v_uid,v_scope,trim(p_name),p_report_type,p_audience,coalesce(p_channels,array['in_app']),p_frequency,p_day_of_week,p_day_of_month,coalesce(p_send_time,'18:00'),coalesce(nullif(p_timezone,''),'Asia/Riyadh'),'active',
    private.communication_next_run(p_frequency,p_day_of_week,p_day_of_month,coalesce(p_send_time,'18:00'),coalesce(nullif(p_timezone,''),'Asia/Riyadh'),now()),p_title_template,p_body_template,coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('validated_audience',v_valid)
  )
  on conflict (id) do update
    set name=excluded.name,report_type=excluded.report_type,audience=excluded.audience,channels=excluded.channels,frequency=excluded.frequency,day_of_week=excluded.day_of_week,day_of_month=excluded.day_of_month,send_time=excluded.send_time,timezone=excluded.timezone,next_run_at=excluded.next_run_at,title_template=excluded.title_template,body_template=excluded.body_template,metadata=excluded.metadata,updated_at=now()
    where public.organization_report_schedules.organization_id=p_organization_id
      and (v_scope='organization' or public.organization_report_schedules.created_by_user_id=v_uid)
  returning * into v_row;
  if not found then raise exception 'schedule_not_found_or_forbidden'; end if;
  return jsonb_build_object('changed',true,'schedule',to_jsonb(v_row));
end
$function$;

create or replace function public.act_my_organization_report_schedule(
  p_schedule_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid(); v_row public.organization_report_schedules%rowtype; v_scope text; v_run uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_row from public.organization_report_schedules where id=p_schedule_id for update;
  if not found then raise exception 'schedule_not_found'; end if;
  v_scope:=private.communication_actor_scope(v_row.organization_id,v_uid);
  if v_scope is null or (v_scope='coach' and v_row.created_by_user_id<>v_uid) then raise exception 'communication_scope_required'; end if;
  if p_action='pause' then update public.organization_report_schedules set status='paused',updated_at=now() where id=v_row.id;
  elsif p_action='resume' then update public.organization_report_schedules set status='active',next_run_at=private.communication_next_run(frequency,day_of_week,day_of_month,send_time,timezone,now()),updated_at=now() where id=v_row.id;
  elsif p_action='archive' then update public.organization_report_schedules set status='archived',updated_at=now() where id=v_row.id;
  elsif p_action='run_now' then v_run:=private.generate_organization_report_run(v_row.id,now());
  else raise exception 'invalid_schedule_action'; end if;
  return jsonb_build_object('changed',true,'schedule_id',v_row.id,'action',p_action,'run_id',v_run);
end
$function$;

revoke all on function public.preview_my_organization_communication_audience(uuid,jsonb) from public, anon;
revoke all on function public.my_organization_communication_center(uuid) from public, anon;
revoke all on function public.create_my_organization_broadcast(uuid,text,text,text,jsonb,text[],timestamptz,jsonb) from public, anon;
revoke all on function public.cancel_my_organization_broadcast(uuid) from public, anon;
revoke all on function public.my_communication_inbox(integer) from public, anon;
revoke all on function public.mark_my_communication_read(uuid) from public, anon;
revoke all on function public.save_my_organization_communication_template(uuid,uuid,text,text,text,text,text,text,jsonb,text[],boolean) from public, anon;
revoke all on function public.save_my_organization_report_schedule(uuid,uuid,text,text,jsonb,text[],text,integer,integer,time,text,text,text,jsonb) from public, anon;
revoke all on function public.act_my_organization_report_schedule(uuid,text) from public, anon;

grant execute on function public.preview_my_organization_communication_audience(uuid,jsonb) to authenticated;
grant execute on function public.my_organization_communication_center(uuid) to authenticated;
grant execute on function public.create_my_organization_broadcast(uuid,text,text,text,jsonb,text[],timestamptz,jsonb) to authenticated;
grant execute on function public.cancel_my_organization_broadcast(uuid) to authenticated;
grant execute on function public.my_communication_inbox(integer) to authenticated;
grant execute on function public.mark_my_communication_read(uuid) to authenticated;
grant execute on function public.save_my_organization_communication_template(uuid,uuid,text,text,text,text,text,text,jsonb,text[],boolean) to authenticated;
grant execute on function public.save_my_organization_report_schedule(uuid,uuid,text,text,jsonb,text[],text,integer,integer,time,text,text,text,jsonb) to authenticated;
grant execute on function public.act_my_organization_report_schedule(uuid,text) to authenticated;

revoke all on function private.communication_actor_scope(uuid,uuid) from public, anon, authenticated;
revoke all on function private.communication_managed_team_ids(uuid,uuid) from public, anon, authenticated;
revoke all on function private.communication_validate_audience(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function private.communication_audience_users(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function private.communication_provider_state(uuid,text) from public, anon, authenticated;
revoke all on function private.dispatch_organization_broadcast(uuid) from public, anon, authenticated;
revoke all on function private.communication_next_run(text,integer,integer,time,text,timestamptz) from public, anon, authenticated;
revoke all on function private.organization_report_metrics(uuid,timestamptz,timestamptz,jsonb) from public, anon, authenticated;
revoke all on function private.generate_organization_report_run(uuid,timestamptz) from public, anon, authenticated;
revoke all on function private.process_due_organization_communications(integer) from public, anon, authenticated;
revoke all on function private.sync_broadcast_recipient_read() from public, anon, authenticated;

commit;
