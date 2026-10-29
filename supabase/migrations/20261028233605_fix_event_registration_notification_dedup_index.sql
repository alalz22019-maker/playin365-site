create unique index if not exists notifications_registration_dedup_uq
on public.notifications(user_id,notification_type,(data->>'registration_id'))
where data ? 'registration_id';

comment on index public.notifications_registration_dedup_uq is 'Supports idempotent event registration notifications by user, notification type, and registration id.';
