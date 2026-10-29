-- Cover communication/report foreign keys used by recipient resolution,
-- read tracking, report linkage, and sender history.

create index if not exists organization_broadcast_recipients_notification_idx
  on public.organization_broadcast_recipients(notification_id)
  where notification_id is not null;

create index if not exists organization_broadcast_recipients_organization_idx
  on public.organization_broadcast_recipients(organization_id, created_at desc);

create index if not exists organization_broadcast_recipients_team_idx
  on public.organization_broadcast_recipients(team_id, created_at desc)
  where team_id is not null;

create index if not exists organization_broadcasts_created_by_idx
  on public.organization_broadcasts(created_by_user_id, created_at desc);

create index if not exists organization_broadcasts_report_run_idx
  on public.organization_broadcasts(report_run_id)
  where report_run_id is not null;

create index if not exists organization_communication_templates_created_by_idx
  on public.organization_communication_templates(created_by_user_id, created_at desc)
  where created_by_user_id is not null;

create index if not exists organization_report_runs_broadcast_idx
  on public.organization_report_runs(broadcast_id)
  where broadcast_id is not null;

create index if not exists organization_report_runs_schedule_idx
  on public.organization_report_runs(schedule_id, created_at desc)
  where schedule_id is not null;

create index if not exists organization_report_schedules_created_by_idx
  on public.organization_report_schedules(created_by_user_id, created_at desc);
