-- PlayIn365 — scheduled broadcasts and periodic report worker
begin;
create extension if not exists pg_cron with schema extensions;
do $block$
declare v_job bigint;
begin
  for v_job in select jobid from cron.job where jobname='playin-organization-communications-dispatch' loop
    perform cron.unschedule(v_job);
  end loop;
  perform cron.schedule(
    'playin-organization-communications-dispatch',
    '*/5 * * * *',
    $job$select private.process_due_organization_communications(100);$job$
  );
end
$block$;
commit;
