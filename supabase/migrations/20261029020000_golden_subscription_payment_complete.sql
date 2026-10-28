-- PlayIn365 — Golden Subscription & Payment
-- One governed financial journey across academy, guardian/payer and player.

begin;

alter table public.organization_subscriptions
  add column if not exists payer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists auto_renew boolean not null default true,
  add column if not exists cancelled_at timestamptz;

update public.organization_subscriptions s
set payer_user_id=coalesce(
  (
    select g.guardian_user_id
    from public.guardianships g
    where g.athlete_id=s.athlete_id and g.status='verified'
    order by g.verified_at desc nulls last,g.created_at desc
    limit 1
  ),
  s.user_id
)
where s.payer_user_id is null;

create index if not exists organization_subscriptions_payer_idx
  on public.organization_subscriptions(payer_user_id,status)
  where payer_user_id is not null;

create unique index if not exists financial_accounts_org_code_currency_uidx
  on public.financial_accounts(owner_organization_id,account_code,currency)
  where owner_type='organization' and owner_organization_id is not null;

create table if not exists public.subscription_payment_submissions(
  id uuid primary key default gen_random_uuid(),
  submission_reference text not null unique,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  subscription_id uuid references public.organization_subscriptions(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid references public.athlete_profiles(id) on delete set null,
  payer_user_id uuid not null references auth.users(id) on delete restrict,
  payment_method text not null check(payment_method in ('bank_transfer','cash','card_terminal','gateway')),
  provider_code text,
  provider_reference text,
  amount numeric(14,2) not null check(amount>0),
  currency text not null default 'SAR' check(char_length(currency)=3),
  payer_note text,
  status text not null default 'submitted' check(status in ('submitted','pending_provider','approved','rejected','cancelled')),
  idempotency_key text not null,
  payment_id uuid references public.payments(id) on delete set null,
  receipt_id uuid,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payer_user_id,idempotency_key)
);

create table if not exists public.subscription_payment_receipts(
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  subscription_id uuid references public.organization_subscriptions(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  athlete_id uuid references public.athlete_profiles(id) on delete set null,
  payer_user_id uuid references auth.users(id) on delete set null,
  amount numeric(14,2) not null check(amount>0),
  currency text not null default 'SAR' check(char_length(currency)=3),
  issued_by_user_id uuid references auth.users(id) on delete set null,
  issued_at timestamptz not null default now(),
  verification_status text not null default 'verified' check(verification_status in ('pending','verified','void')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.subscription_payment_submissions
  drop constraint if exists subscription_payment_submissions_receipt_id_fkey;
alter table public.subscription_payment_submissions
  add constraint subscription_payment_submissions_receipt_id_fkey
  foreign key(receipt_id) references public.subscription_payment_receipts(id) on delete set null;

create table if not exists public.subscription_access_entitlements(
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.organization_subscriptions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid references public.athlete_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  entitlement_code text not null default 'academy_membership',
  status text not null default 'active' check(status in ('active','suspended','expired','revoked')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source_invoice_id uuid references public.invoices(id) on delete set null,
  source_payment_id uuid references public.payments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subscription_id,entitlement_code)
);

create index if not exists subscription_payment_submissions_invoice_idx
  on public.subscription_payment_submissions(invoice_id,created_at desc);
create index if not exists subscription_payment_submissions_org_status_idx
  on public.subscription_payment_submissions(organization_id,status,created_at desc);
create index if not exists subscription_payment_submissions_payer_idx
  on public.subscription_payment_submissions(payer_user_id,created_at desc);
create index if not exists subscription_payment_receipts_org_idx
  on public.subscription_payment_receipts(organization_id,issued_at desc);
create index if not exists subscription_payment_receipts_payer_idx
  on public.subscription_payment_receipts(payer_user_id,issued_at desc)
  where payer_user_id is not null;
create index if not exists subscription_entitlements_athlete_idx
  on public.subscription_access_entitlements(athlete_id,status)
  where athlete_id is not null;
create index if not exists subscription_entitlements_user_idx
  on public.subscription_access_entitlements(user_id,status)
  where user_id is not null;

alter table public.subscription_payment_submissions enable row level security;
alter table public.subscription_payment_receipts enable row level security;
alter table public.subscription_access_entitlements enable row level security;

drop policy if exists subscription_payment_submissions_rpc_only on public.subscription_payment_submissions;
create policy subscription_payment_submissions_rpc_only
  on public.subscription_payment_submissions for all to authenticated
  using(false) with check(false);

drop policy if exists subscription_payment_receipts_rpc_only on public.subscription_payment_receipts;
create policy subscription_payment_receipts_rpc_only
  on public.subscription_payment_receipts for all to authenticated
  using(false) with check(false);

drop policy if exists subscription_access_entitlements_rpc_only on public.subscription_access_entitlements;
create policy subscription_access_entitlements_rpc_only
  on public.subscription_access_entitlements for all to authenticated
  using(false) with check(false);

revoke all on public.subscription_payment_submissions from anon,authenticated;
revoke all on public.subscription_payment_receipts from anon,authenticated;
revoke all on public.subscription_access_entitlements from anon,authenticated;

drop trigger if exists subscription_payment_submissions_touch on public.subscription_payment_submissions;
create trigger subscription_payment_submissions_touch
before update on public.subscription_payment_submissions
for each row execute function public.erp_touch_updated_at();

drop trigger if exists subscription_access_entitlements_touch on public.subscription_access_entitlements;
create trigger subscription_access_entitlements_touch
before update on public.subscription_access_entitlements
for each row execute function public.erp_touch_updated_at();

create or replace function private.finalize_subscription_payment_v1(
  p_organization_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_provider text,
  p_provider_reference text,
  p_actor_user_id uuid,
  p_submission_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_invoice public.invoices%rowtype;
  v_subscription public.organization_subscriptions%rowtype;
  v_plan public.organization_fee_plans%rowtype;
  v_payment public.payments%rowtype;
  v_receipt public.subscription_payment_receipts%rowtype;
  v_paid_before numeric:=0;
  v_paid_after numeric:=0;
  v_outstanding numeric:=0;
  v_invoice_status text;
  v_cash_account uuid;
  v_revenue_account uuid;
  v_tax_account uuid;
  v_transaction uuid:=gen_random_uuid();
  v_tax_share numeric:=0;
  v_revenue_share numeric:=0;
  v_next_billing date;
begin
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'invalid_payment_amount'; end if;
  if nullif(trim(coalesce(p_provider,'')),'') is null then raise exception 'payment_provider_required'; end if;

  select * into v_invoice
  from public.invoices
  where id=p_invoice_id and issuer_organization_id=p_organization_id
  for update;
  if not found then raise exception 'invoice_not_found'; end if;
  if v_invoice.status in ('void','paid') then raise exception 'invoice_not_payable'; end if;

  select coalesce(sum(amount),0) into v_paid_before
  from public.payments
  where invoice_id=v_invoice.id and status='paid';
  v_outstanding:=greatest(v_invoice.total_amount-v_paid_before,0);
  if p_amount>v_outstanding then raise exception 'payment_exceeds_outstanding'; end if;

  insert into public.payments(
    invoice_id,payer_user_id,payee_organization_id,provider,provider_reference,
    amount,currency,status,paid_at,metadata
  ) values(
    v_invoice.id,coalesce(v_invoice.payer_user_id,v_invoice.guardian_user_id),p_organization_id,
    trim(p_provider),nullif(trim(coalesce(p_provider_reference,'')),''),
    p_amount,v_invoice.currency,'paid',now(),
    jsonb_strip_nulls(jsonb_build_object(
      'source','golden_subscription_payment',
      'verified_by_user_id',p_actor_user_id,
      'submission_id',p_submission_id,
      'invoice_reference',v_invoice.reference_code,
      'is_demo',coalesce((v_invoice.metadata->>'is_demo')::boolean,false)
    ))
  ) returning * into v_payment;

  v_paid_after:=v_paid_before+p_amount;
  v_invoice_status:=case when v_paid_after>=v_invoice.total_amount then 'paid' else 'partially_paid' end;
  update public.invoices
  set status=v_invoice_status,updated_at=now()
  where id=v_invoice.id;

  if v_invoice.total_amount>0 then
    v_tax_share:=round((p_amount*coalesce(v_invoice.tax_amount,0)/v_invoice.total_amount)::numeric,2);
  end if;
  v_revenue_share:=p_amount-v_tax_share;

  insert into public.financial_accounts(owner_type,owner_organization_id,account_code,currency,status,metadata)
  values('organization',p_organization_id,'cash_clearing',v_invoice.currency,'active',jsonb_build_object('label_ar','النقد والتحصيل'))
  on conflict(owner_organization_id,account_code,currency)
    where owner_type='organization' and owner_organization_id is not null
  do update set status='active'
  returning id into v_cash_account;

  insert into public.financial_accounts(owner_type,owner_organization_id,account_code,currency,status,metadata)
  values('organization',p_organization_id,'subscription_revenue',v_invoice.currency,'active',jsonb_build_object('label_ar','إيراد الاشتراكات'))
  on conflict(owner_organization_id,account_code,currency)
    where owner_type='organization' and owner_organization_id is not null
  do update set status='active'
  returning id into v_revenue_account;

  insert into public.ledger_entries(transaction_group_id,account_id,entry_direction,amount,currency,source_type,source_id,memo,metadata)
  values(v_transaction,v_cash_account,'debit',p_amount,v_invoice.currency,'payment',v_payment.id,'Subscription payment received',jsonb_build_object('invoice_id',v_invoice.id));

  if v_revenue_share>0 then
    insert into public.ledger_entries(transaction_group_id,account_id,entry_direction,amount,currency,source_type,source_id,memo,metadata)
    values(v_transaction,v_revenue_account,'credit',v_revenue_share,v_invoice.currency,'payment',v_payment.id,'Subscription revenue',jsonb_build_object('invoice_id',v_invoice.id));
  end if;

  if v_tax_share>0 then
    insert into public.financial_accounts(owner_type,owner_organization_id,account_code,currency,status,metadata)
    values('organization',p_organization_id,'tax_payable',v_invoice.currency,'active',jsonb_build_object('label_ar','ضريبة مستحقة'))
    on conflict(owner_organization_id,account_code,currency)
      where owner_type='organization' and owner_organization_id is not null
    do update set status='active'
    returning id into v_tax_account;

    insert into public.ledger_entries(transaction_group_id,account_id,entry_direction,amount,currency,source_type,source_id,memo,metadata)
    values(v_transaction,v_tax_account,'credit',v_tax_share,v_invoice.currency,'payment',v_payment.id,'Tax payable',jsonb_build_object('invoice_id',v_invoice.id));
  end if;

  insert into public.subscription_payment_receipts(
    receipt_number,invoice_id,payment_id,subscription_id,organization_id,athlete_id,
    payer_user_id,amount,currency,issued_by_user_id,metadata
  ) values(
    'PI-RCPT-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
    v_invoice.id,v_payment.id,v_invoice.organization_subscription_id,p_organization_id,v_invoice.athlete_id,
    coalesce(v_invoice.payer_user_id,v_invoice.guardian_user_id),p_amount,v_invoice.currency,p_actor_user_id,
    jsonb_build_object('transaction_group_id',v_transaction,'invoice_status',v_invoice_status,'is_demo',coalesce((v_invoice.metadata->>'is_demo')::boolean,false))
  ) returning * into v_receipt;

  insert into public.financial_events(event_type,invoice_id,payment_id,actor_user_id,actor_organization_id,payload)
  values('subscription_payment_verified',v_invoice.id,v_payment.id,p_actor_user_id,p_organization_id,
    jsonb_build_object('amount',p_amount,'currency',v_invoice.currency,'receipt_id',v_receipt.id,'submission_id',p_submission_id,'transaction_group_id',v_transaction));

  if v_invoice_status='paid' and v_invoice.organization_subscription_id is not null then
    select * into v_subscription from public.organization_subscriptions where id=v_invoice.organization_subscription_id for update;
    if found then
      select * into v_plan from public.organization_fee_plans where id=v_subscription.fee_plan_id;
      v_next_billing:=case coalesce(v_plan.billing_frequency,'monthly')
        when 'monthly' then current_date+interval '1 month'
        when 'quarterly' then current_date+interval '3 months'
        when 'semiannual' then current_date+interval '6 months'
        when 'annual' then current_date+interval '1 year'
        else v_subscription.next_billing_at
      end;
      update public.organization_subscriptions
      set status='active',payer_user_id=coalesce(payer_user_id,v_invoice.payer_user_id,v_invoice.guardian_user_id,user_id),
          next_billing_at=case when coalesce(v_plan.billing_frequency,'one_time')='one_time' then null else v_next_billing end,
          updated_at=now()
      where id=v_subscription.id
      returning * into v_subscription;

      insert into public.subscription_access_entitlements(
        subscription_id,organization_id,athlete_id,user_id,entitlement_code,status,
        starts_at,ends_at,source_invoice_id,source_payment_id,metadata
      ) values(
        v_subscription.id,v_subscription.organization_id,v_subscription.athlete_id,v_subscription.user_id,
        'academy_membership','active',now(),
        case when v_subscription.ends_at is null then null else v_subscription.ends_at::timestamptz end,
        v_invoice.id,v_payment.id,
        jsonb_build_object('fee_plan_id',v_subscription.fee_plan_id,'receipt_id',v_receipt.id,'verification_source','organization_verified')
      )
      on conflict(subscription_id,entitlement_code) do update
      set status='active',starts_at=least(public.subscription_access_entitlements.starts_at,excluded.starts_at),
          ends_at=excluded.ends_at,source_invoice_id=excluded.source_invoice_id,source_payment_id=excluded.source_payment_id,
          metadata=excluded.metadata,updated_at=now();
    end if;
  end if;

  return jsonb_build_object(
    'changed',true,'payment_id',v_payment.id,'receipt_id',v_receipt.id,'receipt_number',v_receipt.receipt_number,
    'invoice_id',v_invoice.id,'invoice_status',v_invoice_status,'paid_total',v_paid_after,
    'remaining',greatest(v_invoice.total_amount-v_paid_after,0),'subscription_id',v_invoice.organization_subscription_id
  );
end
$function$;

revoke all on function private.finalize_subscription_payment_v1(uuid,uuid,numeric,text,text,uuid,uuid) from public,anon,authenticated;

create unique index if not exists organization_subscriptions_active_membership_plan_uidx
  on public.organization_subscriptions(organization_id,fee_plan_id,membership_id)
  where membership_id is not null and status in ('pending','active','paused');

create or replace function private.create_organization_subscription_v2(
  p_organization_id uuid,
  p_fee_plan_id uuid,
  p_membership_id uuid,
  p_starts_at date default current_date,
  p_ends_at date default null,
  p_next_billing_at date default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_member public.organization_memberships%rowtype;
  v_plan public.organization_fee_plans%rowtype;
  v_athlete uuid;
  v_payer uuid;
  v_row public.organization_subscriptions%rowtype;
  v_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_finance') then raise exception 'manage_finance_required'; end if;

  select * into v_plan
  from public.organization_fee_plans
  where id=p_fee_plan_id and organization_id=p_organization_id and status='active';
  if not found then raise exception 'fee_plan_not_active'; end if;

  select * into v_member
  from public.organization_memberships
  where id=p_membership_id and organization_id=p_organization_id and status='active';
  if not found then raise exception 'active_membership_required'; end if;

  select id into v_athlete from public.athlete_profiles where user_id=v_member.user_id limit 1;
  if v_athlete is not null then
    select g.guardian_user_id into v_payer
    from public.guardianships g
    where g.athlete_id=v_athlete and g.status='verified'
    order by g.verified_at desc nulls last,g.created_at desc
    limit 1;
  end if;
  v_payer:=coalesce(v_payer,v_member.user_id);

  select * into v_row
  from public.organization_subscriptions s
  where s.organization_id=p_organization_id and s.fee_plan_id=p_fee_plan_id
    and s.membership_id=p_membership_id and s.status in ('pending','active','paused')
  order by s.created_at desc limit 1;
  if found then
    return jsonb_build_object('changed',false,'reason','existing_open_subscription','subscription',to_jsonb(v_row));
  end if;

  v_status:=case when v_plan.amount=0 then 'active' else 'pending' end;
  insert into public.organization_subscriptions(
    organization_id,fee_plan_id,user_id,athlete_id,membership_id,payer_user_id,
    status,starts_at,ends_at,next_billing_at,auto_renew,metadata,created_by_user_id
  ) values(
    p_organization_id,p_fee_plan_id,v_member.user_id,v_athlete,p_membership_id,v_payer,
    v_status,coalesce(p_starts_at,current_date),p_ends_at,p_next_billing_at,true,
    jsonb_build_object('source','golden_subscription_payment','created_by_role','finance'),v_uid
  ) returning * into v_row;

  if v_status='active' then
    insert into public.subscription_access_entitlements(
      subscription_id,organization_id,athlete_id,user_id,entitlement_code,status,starts_at,ends_at,metadata
    ) values(
      v_row.id,p_organization_id,v_athlete,v_member.user_id,'academy_membership','active',now(),
      case when p_ends_at is null then null else p_ends_at::timestamptz end,
      jsonb_build_object('fee_plan_id',p_fee_plan_id,'verification_source','zero_value_plan')
    ) on conflict(subscription_id,entitlement_code) do update
      set status='active',updated_at=now(),metadata=excluded.metadata;
  end if;

  perform public.erp_audit(p_organization_id,'finance','subscription_created','organization_subscription',v_row.id,null,to_jsonb(v_row));
  return jsonb_build_object('changed',true,'subscription',to_jsonb(v_row),'payer_user_id',v_payer,'requires_payment',v_plan.amount>0);
end
$function$;

revoke all on function private.create_organization_subscription_v2(uuid,uuid,uuid,date,date,date) from public,anon;
grant execute on function private.create_organization_subscription_v2(uuid,uuid,uuid,date,date,date) to authenticated;

create or replace function public.create_my_organization_subscription(
  p_organization_id uuid,
  p_fee_plan_id uuid,
  p_membership_id uuid,
  p_starts_at date default current_date,
  p_ends_at date default null,
  p_next_billing_at date default null
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.create_organization_subscription_v2($1,$2,$3,$4,$5,$6)
$function$;
revoke all on function public.create_my_organization_subscription(uuid,uuid,uuid,date,date,date) from public,anon;
grant execute on function public.create_my_organization_subscription(uuid,uuid,uuid,date,date,date) to authenticated;

create or replace function private.issue_subscription_invoice_v2(
  p_organization_id uuid,
  p_subscription_id uuid,
  p_billing_period_key text,
  p_due_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_sub public.organization_subscriptions%rowtype;
  v_plan public.organization_fee_plans%rowtype;
  v_invoice public.invoices%rowtype;
  v_tax numeric;
  v_total numeric;
  v_type text;
  v_ref text;
  v_payer uuid;
  v_guardian uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_finance') then raise exception 'manage_finance_required'; end if;
  if nullif(trim(coalesce(p_billing_period_key,'')),'') is null then raise exception 'billing_period_key_required'; end if;

  select * into v_sub
  from public.organization_subscriptions
  where id=p_subscription_id and organization_id=p_organization_id and status in ('active','pending')
  for update;
  if not found then raise exception 'subscription_not_billable'; end if;

  select * into v_plan from public.organization_fee_plans where id=v_sub.fee_plan_id and organization_id=p_organization_id;
  if not found then raise exception 'fee_plan_not_found'; end if;
  if v_plan.amount=0 then raise exception 'zero_value_subscription_does_not_require_invoice'; end if;

  select * into v_invoice
  from public.invoices
  where organization_subscription_id=v_sub.id and billing_period_key=trim(p_billing_period_key);
  if found then return jsonb_build_object('changed',false,'invoice',to_jsonb(v_invoice)); end if;

  v_payer:=coalesce(v_sub.payer_user_id,v_sub.user_id);
  if v_sub.athlete_id is not null then
    select guardian_user_id into v_guardian
    from public.guardianships
    where athlete_id=v_sub.athlete_id and guardian_user_id=v_payer and status='verified'
    order by verified_at desc nulls last,created_at desc limit 1;
  end if;

  v_tax:=round((v_plan.amount*v_plan.tax_rate/100.0)::numeric,2);
  v_total:=v_plan.amount+v_tax;
  v_type:=case when v_plan.fee_type='registration' then 'registration'
               when v_plan.fee_type in ('subscription','membership') then 'subscription'
               when v_plan.fee_type='training' then 'training' else 'other' end;
  v_ref:='PI-INV-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));

  insert into public.invoices(
    athlete_id,issuer_organization_id,guardian_user_id,payer_user_id,invoice_type,reference_code,
    subtotal,tax_amount,total_amount,currency,status,issued_at,due_at,
    organization_subscription_id,billing_period_key,metadata
  ) values(
    v_sub.athlete_id,p_organization_id,v_guardian,v_payer,v_type,v_ref,
    v_plan.amount,v_tax,v_total,v_plan.currency,'issued',now(),coalesce(p_due_at,now()+interval '7 days'),
    v_sub.id,trim(p_billing_period_key),
    jsonb_build_object('source','golden_subscription_payment','fee_plan_id',v_plan.id,'payer_assignment','subscription','is_demo',coalesce((v_sub.metadata->>'is_demo')::boolean,false))
  ) returning * into v_invoice;

  insert into public.invoice_items(invoice_id,description,quantity,unit_amount,tax_amount,total_amount,source_type,source_id)
  values(v_invoice.id,v_plan.name,1,v_plan.amount,v_tax,v_total,'subscription',v_sub.id);

  update public.organization_subscriptions
  set payer_user_id=v_payer,updated_at=now()
  where id=v_sub.id;

  insert into public.financial_events(event_type,invoice_id,actor_user_id,actor_organization_id,payload)
  values('subscription_invoice_issued',v_invoice.id,v_uid,p_organization_id,
    jsonb_build_object('subscription_id',v_sub.id,'billing_period_key',trim(p_billing_period_key),'payer_user_id',v_payer,'total_amount',v_total));

  perform public.erp_audit(p_organization_id,'finance','invoice_issued','invoice',v_invoice.id,null,to_jsonb(v_invoice));
  return jsonb_build_object('changed',true,'invoice',to_jsonb(v_invoice),'payer_user_id',v_payer);
exception when unique_violation then
  select * into v_invoice from public.invoices where organization_subscription_id=p_subscription_id and billing_period_key=trim(p_billing_period_key);
  return jsonb_build_object('changed',false,'invoice',to_jsonb(v_invoice));
end
$function$;

revoke all on function private.issue_subscription_invoice_v2(uuid,uuid,text,timestamptz) from public,anon;
grant execute on function private.issue_subscription_invoice_v2(uuid,uuid,text,timestamptz) to authenticated;

create or replace function public.issue_my_subscription_invoice(
  p_organization_id uuid,
  p_subscription_id uuid,
  p_billing_period_key text,
  p_due_at timestamptz default null
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.issue_subscription_invoice_v2($1,$2,$3,$4)
$function$;
revoke all on function public.issue_my_subscription_invoice(uuid,uuid,text,timestamptz) from public,anon;
grant execute on function public.issue_my_subscription_invoice(uuid,uuid,text,timestamptz) to authenticated;

create or replace function private.act_organization_subscription_v2(
  p_organization_id uuid,
  p_subscription_id uuid,
  p_action text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_before jsonb;
  v_row public.organization_subscriptions%rowtype;
  v_plan public.organization_fee_plans%rowtype;
  v_status text;
  v_entitlement_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_finance') then raise exception 'manage_finance_required'; end if;

  select * into v_row
  from public.organization_subscriptions
  where id=p_subscription_id and organization_id=p_organization_id
  for update;
  if not found then raise exception 'subscription_not_found'; end if;
  select * into v_plan from public.organization_fee_plans where id=v_row.fee_plan_id;
  v_before:=to_jsonb(v_row);

  if p_action='activate' then
    if v_row.status in ('cancelled','completed') then raise exception 'subscription_final_state'; end if;
    if coalesce(v_plan.amount,0)>0 and not exists(
      select 1 from public.invoices i
      where i.organization_subscription_id=v_row.id and i.status='paid'
    ) then raise exception 'paid_invoice_required'; end if;
    v_status:='active'; v_entitlement_status:='active';
  elsif p_action='pause' then
    if v_row.status<>'active' then raise exception 'subscription_not_active'; end if;
    v_status:='paused'; v_entitlement_status:='suspended';
  elsif p_action='cancel' then
    if v_row.status in ('cancelled','completed') then raise exception 'subscription_final_state'; end if;
    v_status:='cancelled'; v_entitlement_status:='revoked';
  elsif p_action='complete' then
    if v_row.status not in ('active','paused') then raise exception 'subscription_not_completable'; end if;
    v_status:='completed'; v_entitlement_status:='expired';
  else
    raise exception 'invalid_subscription_action';
  end if;

  update public.organization_subscriptions
  set status=v_status,
      auto_renew=case when v_status='cancelled' then false else auto_renew end,
      cancelled_at=case when v_status='cancelled' then now() else cancelled_at end,
      updated_at=now()
  where id=v_row.id
  returning * into v_row;

  update public.subscription_access_entitlements
  set status=v_entitlement_status,
      ends_at=case when v_entitlement_status in ('revoked','expired') then coalesce(ends_at,now()) else ends_at end,
      updated_at=now()
  where subscription_id=v_row.id;

  perform public.erp_audit(p_organization_id,'finance','subscription_'||p_action,'organization_subscription',v_row.id,v_before,to_jsonb(v_row));
  return jsonb_build_object('changed',true,'subscription',to_jsonb(v_row),'entitlement_status',v_entitlement_status);
end
$function$;

revoke all on function private.act_organization_subscription_v2(uuid,uuid,text) from public,anon;
grant execute on function private.act_organization_subscription_v2(uuid,uuid,text) to authenticated;

create or replace function public.act_my_organization_subscription(
  p_organization_id uuid,
  p_subscription_id uuid,
  p_action text
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.act_organization_subscription_v2($1,$2,$3)
$function$;
revoke all on function public.act_my_organization_subscription(uuid,uuid,text) from public,anon;
grant execute on function public.act_my_organization_subscription(uuid,uuid,text) to authenticated;

create or replace function private.record_external_subscription_payment_v2(
  p_organization_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_provider text,
  p_provider_reference text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not public.organization_user_has_permission(p_organization_id,v_uid,'manage_finance') then raise exception 'manage_finance_required'; end if;
  if p_provider not in ('manual','bank_transfer','cash','card_terminal','external') then raise exception 'external_payment_provider_invalid'; end if;
  if p_provider in ('bank_transfer','card_terminal','external') and nullif(trim(coalesce(p_provider_reference,'')),'') is null then
    raise exception 'payment_reference_required';
  end if;

  v_result:=private.finalize_subscription_payment_v1(
    p_organization_id,p_invoice_id,p_amount,p_provider,p_provider_reference,v_uid,null
  );
  perform public.erp_audit(p_organization_id,'finance','external_payment_recorded','payment',(v_result->>'payment_id')::uuid,null,v_result);
  return v_result;
end
$function$;

revoke all on function private.record_external_subscription_payment_v2(uuid,uuid,numeric,text,text) from public,anon;
grant execute on function private.record_external_subscription_payment_v2(uuid,uuid,numeric,text,text) to authenticated;

create or replace function public.record_my_erp_external_payment(
  p_organization_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_provider text,
  p_provider_reference text default null
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.record_external_subscription_payment_v2($1,$2,$3,$4,$5)
$function$;
revoke all on function public.record_my_erp_external_payment(uuid,uuid,numeric,text,text) from public,anon;
grant execute on function public.record_my_erp_external_payment(uuid,uuid,numeric,text,text) to authenticated;

create or replace function private.submit_subscription_payment_v1(
  p_invoice_id uuid,
  p_payment_method text,
  p_amount numeric,
  p_provider_code text default null,
  p_provider_reference text default null,
  p_payer_note text default null,
  p_idempotency_key text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_invoice public.invoices%rowtype;
  v_submission public.subscription_payment_submissions%rowtype;
  v_paid numeric:=0;
  v_outstanding numeric:=0;
  v_authorized boolean:=false;
  v_status text;
  v_key text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_payment_method not in ('bank_transfer','cash','card_terminal','gateway') then raise exception 'payment_method_invalid'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'invalid_payment_amount'; end if;
  v_key:=nullif(trim(coalesce(p_idempotency_key,'')),'');
  if v_key is null then raise exception 'idempotency_key_required'; end if;
  if char_length(v_key)>160 then raise exception 'idempotency_key_too_long'; end if;

  select * into v_invoice from public.invoices where id=p_invoice_id for update;
  if not found then raise exception 'invoice_not_found'; end if;
  if v_invoice.status not in ('issued','partially_paid','overdue') then raise exception 'invoice_not_payable'; end if;

  v_authorized:=(v_invoice.payer_user_id=v_uid or v_invoice.guardian_user_id=v_uid);
  if not v_authorized and v_invoice.athlete_id is not null then
    v_authorized:=exists(
      select 1 from public.guardianships g
      where g.athlete_id=v_invoice.athlete_id and g.guardian_user_id=v_uid and g.status='verified'
    ) or (
      v_invoice.payer_user_id is null and exists(
        select 1 from public.athlete_profiles ap where ap.id=v_invoice.athlete_id and ap.user_id=v_uid
      )
    );
  end if;
  if not v_authorized then raise exception 'invoice_payment_actor_denied'; end if;

  select coalesce(sum(amount),0) into v_paid from public.payments where invoice_id=v_invoice.id and status='paid';
  v_outstanding:=greatest(v_invoice.total_amount-v_paid,0);
  if p_amount>v_outstanding then raise exception 'payment_exceeds_outstanding'; end if;

  select * into v_submission
  from public.subscription_payment_submissions
  where payer_user_id=v_uid and idempotency_key=v_key;
  if found then
    if v_submission.invoice_id<>v_invoice.id then raise exception 'idempotency_key_conflict'; end if;
    return jsonb_build_object('changed',false,'submission',to_jsonb(v_submission),'outstanding',v_outstanding);
  end if;

  if p_payment_method='gateway' then
    if nullif(trim(coalesce(p_provider_code,'')),'') is null then raise exception 'payment_provider_required'; end if;
    if not exists(
      select 1 from public.organization_integrations oi
      where oi.organization_id=v_invoice.issuer_organization_id
        and oi.system_type='payments' and oi.provider_code=trim(p_provider_code)
        and oi.status='connected' and oi.credential_state='configured'
    ) then raise exception 'payment_provider_not_connected'; end if;
    v_status:='pending_provider';
  else
    if p_payment_method in ('bank_transfer','card_terminal') and nullif(trim(coalesce(p_provider_reference,'')),'') is null then
      raise exception 'payment_reference_required';
    end if;
    v_status:='submitted';
  end if;

  insert into public.subscription_payment_submissions(
    submission_reference,invoice_id,subscription_id,organization_id,athlete_id,payer_user_id,
    payment_method,provider_code,provider_reference,amount,currency,payer_note,status,idempotency_key,metadata
  ) values(
    'PI-PAYREQ-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
    v_invoice.id,v_invoice.organization_subscription_id,v_invoice.issuer_organization_id,v_invoice.athlete_id,v_uid,
    p_payment_method,nullif(trim(coalesce(p_provider_code,'')),''),nullif(trim(coalesce(p_provider_reference,'')),''),
    p_amount,v_invoice.currency,nullif(trim(coalesce(p_payer_note,'')),''),v_status,v_key,
    jsonb_build_object('invoice_reference',v_invoice.reference_code,'is_demo',coalesce((v_invoice.metadata->>'is_demo')::boolean,false))
  ) returning * into v_submission;

  insert into public.financial_events(event_type,invoice_id,actor_user_id,actor_organization_id,payload)
  values('subscription_payment_submitted',v_invoice.id,v_uid,v_invoice.issuer_organization_id,
    jsonb_build_object('submission_id',v_submission.id,'payment_method',p_payment_method,'amount',p_amount,'currency',v_invoice.currency));

  return jsonb_build_object('changed',true,'submission',to_jsonb(v_submission),'outstanding',v_outstanding);
end
$function$;

revoke all on function private.submit_subscription_payment_v1(uuid,text,numeric,text,text,text,text) from public,anon;
grant execute on function private.submit_subscription_payment_v1(uuid,text,numeric,text,text,text,text) to authenticated;

create or replace function public.submit_my_subscription_payment(
  p_invoice_id uuid,
  p_payment_method text,
  p_amount numeric,
  p_provider_code text default null,
  p_provider_reference text default null,
  p_payer_note text default null,
  p_idempotency_key text default null
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.submit_subscription_payment_v1($1,$2,$3,$4,$5,$6,$7)
$function$;
revoke all on function public.submit_my_subscription_payment(uuid,text,numeric,text,text,text,text) from public,anon;
grant execute on function public.submit_my_subscription_payment(uuid,text,numeric,text,text,text,text) to authenticated;

create or replace function private.review_subscription_payment_v1(
  p_submission_id uuid,
  p_decision text,
  p_review_note text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_submission public.subscription_payment_submissions%rowtype;
  v_result jsonb;
  v_provider text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_decision not in ('approve','reject') then raise exception 'payment_review_decision_invalid'; end if;

  select * into v_submission
  from public.subscription_payment_submissions
  where id=p_submission_id
  for update;
  if not found then raise exception 'payment_submission_not_found'; end if;
  if not public.organization_user_has_permission(v_submission.organization_id,v_uid,'manage_finance') then
    raise exception 'manage_finance_required';
  end if;

  if v_submission.status='approved' then
    return jsonb_build_object('changed',false,'reason','already_approved','submission',to_jsonb(v_submission));
  end if;
  if v_submission.status in ('rejected','cancelled') then
    return jsonb_build_object('changed',false,'reason','submission_final_state','submission',to_jsonb(v_submission));
  end if;

  if p_decision='reject' then
    update public.subscription_payment_submissions
    set status='rejected',reviewed_by_user_id=v_uid,reviewed_at=now(),review_note=nullif(trim(coalesce(p_review_note,'')),'')
    where id=v_submission.id returning * into v_submission;

    insert into public.financial_events(event_type,invoice_id,actor_user_id,actor_organization_id,payload)
    values('subscription_payment_rejected',v_submission.invoice_id,v_uid,v_submission.organization_id,
      jsonb_build_object('submission_id',v_submission.id,'reason',v_submission.review_note));
    perform public.erp_audit(v_submission.organization_id,'finance','subscription_payment_rejected','payment_submission',v_submission.id,null,to_jsonb(v_submission));
    return jsonb_build_object('changed',true,'submission',to_jsonb(v_submission));
  end if;

  if v_submission.payment_method='gateway' then
    if nullif(trim(coalesce(v_submission.provider_reference,'')),'') is null then raise exception 'provider_confirmation_required'; end if;
    if not exists(
      select 1 from public.organization_integrations oi
      where oi.organization_id=v_submission.organization_id
        and oi.system_type='payments' and oi.provider_code=v_submission.provider_code
        and oi.status='connected' and oi.credential_state='configured'
    ) then raise exception 'payment_provider_not_connected'; end if;
    v_provider:=v_submission.provider_code;
  else
    v_provider:=v_submission.payment_method;
  end if;

  v_result:=private.finalize_subscription_payment_v1(
    v_submission.organization_id,v_submission.invoice_id,v_submission.amount,
    v_provider,v_submission.provider_reference,v_uid,v_submission.id
  );

  update public.subscription_payment_submissions
  set status='approved',payment_id=(v_result->>'payment_id')::uuid,receipt_id=(v_result->>'receipt_id')::uuid,
      reviewed_by_user_id=v_uid,reviewed_at=now(),review_note=nullif(trim(coalesce(p_review_note,'')),'')
  where id=v_submission.id
  returning * into v_submission;

  perform public.erp_audit(v_submission.organization_id,'finance','subscription_payment_approved','payment_submission',v_submission.id,null,to_jsonb(v_submission));
  return jsonb_build_object('changed',true,'submission',to_jsonb(v_submission),'settlement',v_result);
end
$function$;

revoke all on function private.review_subscription_payment_v1(uuid,text,text) from public,anon;
grant execute on function private.review_subscription_payment_v1(uuid,text,text) to authenticated;

create or replace function public.review_my_subscription_payment(
  p_submission_id uuid,
  p_decision text,
  p_review_note text default null
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.review_subscription_payment_v1($1,$2,$3)
$function$;
revoke all on function public.review_my_subscription_payment(uuid,text,text) from public,anon;
grant execute on function public.review_my_subscription_payment(uuid,text,text) to authenticated;

create or replace function private.cancel_subscription_payment_submission_v1(
  p_submission_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_submission public.subscription_payment_submissions%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_submission
  from public.subscription_payment_submissions
  where id=p_submission_id
  for update;
  if not found then raise exception 'payment_submission_not_found'; end if;
  if v_submission.payer_user_id<>v_uid then raise exception 'payment_submission_actor_denied'; end if;
  if v_submission.status not in ('submitted','pending_provider') then raise exception 'payment_submission_not_cancellable'; end if;

  update public.subscription_payment_submissions
  set status='cancelled',reviewed_by_user_id=v_uid,reviewed_at=now(),review_note='Cancelled by payer'
  where id=v_submission.id returning * into v_submission;

  insert into public.financial_events(event_type,invoice_id,actor_user_id,actor_organization_id,payload)
  values('subscription_payment_cancelled',v_submission.invoice_id,v_uid,v_submission.organization_id,
    jsonb_build_object('submission_id',v_submission.id));
  return jsonb_build_object('changed',true,'submission',to_jsonb(v_submission));
end
$function$;

revoke all on function private.cancel_subscription_payment_submission_v1(uuid) from public,anon;
grant execute on function private.cancel_subscription_payment_submission_v1(uuid) to authenticated;

create or replace function public.cancel_my_subscription_payment_submission(
  p_submission_id uuid
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.cancel_subscription_payment_submission_v1($1)
$function$;
revoke all on function public.cancel_my_subscription_payment_submission(uuid) from public,anon;
grant execute on function public.cancel_my_subscription_payment_submission(uuid) to authenticated;

create or replace function private.subscription_payment_center_v1(
  p_organization_id uuid default null,
  p_athlete_id uuid default null,
  p_invoice_id uuid default null
) returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_self_athlete uuid;
  v_athlete uuid;
  v_org uuid;
  v_mode text;
  v_can_manage boolean:=false;
  v_invoice public.invoices%rowtype;
  v_selected_invoice uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select id into v_self_athlete from public.athlete_profiles where user_id=v_uid limit 1;

  if p_organization_id is not null
     and public.erp_has_org_access(p_organization_id,v_uid)
     and public.organization_user_has_permission(p_organization_id,v_uid,'manage_finance') then
    v_mode:='academy';
    v_org:=p_organization_id;
    v_can_manage:=true;
    v_athlete:=p_athlete_id;
  elsif p_invoice_id is not null then
    select * into v_invoice from public.invoices where id=p_invoice_id;
    if not found then raise exception 'invoice_not_found'; end if;
    if v_invoice.athlete_id=v_self_athlete then
      v_mode:='player'; v_athlete:=v_self_athlete;
    elsif v_invoice.payer_user_id=v_uid or v_invoice.guardian_user_id=v_uid
       or exists(select 1 from public.guardianships g where g.athlete_id=v_invoice.athlete_id and g.guardian_user_id=v_uid and g.status='verified') then
      v_mode:='guardian'; v_athlete:=v_invoice.athlete_id;
    else
      raise exception 'subscription_payment_center_access_denied';
    end if;
    v_org:=v_invoice.issuer_organization_id;
    v_selected_invoice:=v_invoice.id;
  else
    if p_athlete_id is not null and p_athlete_id=v_self_athlete then
      v_mode:='player'; v_athlete:=p_athlete_id;
    elsif p_athlete_id is not null and exists(
      select 1 from public.guardianships g where g.athlete_id=p_athlete_id and g.guardian_user_id=v_uid and g.status='verified'
    ) then
      v_mode:='guardian'; v_athlete:=p_athlete_id;
    elsif v_self_athlete is not null then
      v_mode:='player'; v_athlete:=v_self_athlete;
    else
      select g.athlete_id into v_athlete
      from public.guardianships g
      where g.guardian_user_id=v_uid and g.status='verified'
      order by g.verified_at desc nulls last,g.created_at
      limit 1;
      if v_athlete is not null then v_mode:='guardian'; end if;
    end if;
    if v_mode is null then
      select i.athlete_id,i.issuer_organization_id,i.id into v_athlete,v_org,v_selected_invoice
      from public.invoices i
      where i.payer_user_id=v_uid or i.guardian_user_id=v_uid
      order by i.created_at desc limit 1;
      if found then v_mode:='guardian'; end if;
    end if;
    if v_mode is null then raise exception 'subscription_payment_center_access_denied'; end if;

    if p_organization_id is not null then
      if not exists(
        select 1 from public.organization_subscriptions s
        where s.organization_id=p_organization_id and s.athlete_id=v_athlete
        union all
        select 1 from public.invoices i
        where i.issuer_organization_id=p_organization_id and i.athlete_id=v_athlete
      ) then raise exception 'athlete_organization_finance_access_denied'; end if;
      v_org:=p_organization_id;
    end if;

    if v_org is null then
      select s.organization_id into v_org
      from public.organization_subscriptions s
      where s.athlete_id=v_athlete
      order by case s.status when 'active' then 0 when 'pending' then 1 when 'paused' then 2 else 3 end,s.created_at desc
      limit 1;
    end if;
    if v_org is null then
      select i.issuer_organization_id,i.id into v_org,v_selected_invoice
      from public.invoices i
      where i.athlete_id=v_athlete
        and (v_mode='player' or i.payer_user_id=v_uid or i.guardian_user_id=v_uid
          or exists(select 1 from public.guardianships g where g.athlete_id=i.athlete_id and g.guardian_user_id=v_uid and g.status='verified'))
      order by i.created_at desc limit 1;
    end if;
  end if;

  if v_selected_invoice is null then v_selected_invoice:=p_invoice_id; end if;

  return jsonb_build_object(
    'mode',v_mode,
    'can_manage_finance',v_can_manage,
    'organization_id',v_org,
    'athlete_id',v_athlete,
    'selected_invoice_id',v_selected_invoice,
    'organization',case when v_org is null then null else (
      select jsonb_build_object('id',o.id,'name_ar',o.name_ar,'name_en',o.name_en,'organization_type',o.organization_type,'city',o.city,'is_verified',o.is_verified)
      from public.organizations o where o.id=v_org
    ) end,
    'selected_athlete',case when v_athlete is null then null else (
      select jsonb_build_object('athlete_id',ap.id,'user_id',ap.user_id,'name',coalesce(p.display_name,p.name,p.handle,'لاعب'),'avatar_url',p.avatar_url,'primary_position',ap.primary_position,'verification_status',ap.verification_status)
      from public.athlete_profiles ap join public.profiles p on p.id=ap.user_id where ap.id=v_athlete
    ) end,
    'wards',case when v_mode='guardian' then coalesce((
      select jsonb_agg(jsonb_build_object('athlete_id',ap.id,'user_id',ap.user_id,'name',coalesce(p.display_name,p.name,p.handle,'لاعب'),'avatar_url',p.avatar_url,'relationship_type',g.relationship_type) order by coalesce(p.display_name,p.name,p.handle))
      from public.guardianships g join public.athlete_profiles ap on ap.id=g.athlete_id join public.profiles p on p.id=ap.user_id
      where g.guardian_user_id=v_uid and g.status='verified'
    ),'[]'::jsonb) else '[]'::jsonb end,
    'members',case when v_mode='academy' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'membership_id',m.id,'user_id',m.user_id,'name',coalesce(p.display_name,p.name,p.handle,'عضو'),'role_code',m.role_code,
        'athlete_id',ap.id,'athlete_status',ap.current_status,'guardian_user_id',g.guardian_user_id,
        'guardian_name',coalesce(gp.display_name,gp.name,gp.handle),'verification_status',m.verification_status
      ) order by coalesce(p.display_name,p.name,p.handle))
      from public.organization_memberships m
      join public.profiles p on p.id=m.user_id
      left join public.athlete_profiles ap on ap.user_id=m.user_id
      left join lateral(
        select gx.guardian_user_id from public.guardianships gx
        where gx.athlete_id=ap.id and gx.status='verified'
        order by gx.verified_at desc nulls last,gx.created_at desc limit 1
      )g on true
      left join public.profiles gp on gp.id=g.guardian_user_id
      where m.organization_id=v_org and m.status='active'
    ),'[]'::jsonb) else '[]'::jsonb end,
    'plans',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',f.id,'name',f.name,'fee_type',f.fee_type,'billing_frequency',f.billing_frequency,
        'amount',f.amount,'tax_rate',f.tax_rate,'currency',f.currency,'status',f.status,'starts_at',f.starts_at,'ends_at',f.ends_at
      ) order by f.status='active' desc,f.created_at desc)
      from public.organization_fee_plans f
      where f.organization_id=v_org and (
        v_mode='academy' or exists(
          select 1 from public.organization_subscriptions sx
          where sx.fee_plan_id=f.id and sx.athlete_id=v_athlete
        )
      )
    ),'[]'::jsonb),
    'subscriptions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'organization_id',s.organization_id,'plan_id',s.fee_plan_id,'plan_name',f.name,
        'billing_frequency',f.billing_frequency,'amount',f.amount,'tax_rate',f.tax_rate,'currency',f.currency,
        'user_id',case when v_mode='academy' then s.user_id else null end,
        'athlete_id',s.athlete_id,'athlete_name',coalesce(p.display_name,p.name,p.handle,'مشترك'),
        'payer_name',case when v_mode='academy' then coalesce(pp.display_name,pp.name,pp.handle) when s.payer_user_id=v_uid then 'أنت' else null end,
        'payer_is_current_user',s.payer_user_id=v_uid,'status',s.status,'starts_at',s.starts_at,'ends_at',s.ends_at,
        'next_billing_at',s.next_billing_at,'auto_renew',s.auto_renew,
        'latest_invoice_status',(select i.status from public.invoices i where i.organization_subscription_id=s.id order by i.created_at desc limit 1),
        'open_invoice_count',(select count(*) from public.invoices i where i.organization_subscription_id=s.id and i.status in ('issued','partially_paid','overdue')),
        'outstanding_amount',coalesce((select sum(greatest(i.total_amount-coalesce((select sum(py.amount) from public.payments py where py.invoice_id=i.id and py.status='paid'),0),0)) from public.invoices i where i.organization_subscription_id=s.id and i.status in ('issued','partially_paid','overdue')),0),
        'entitlement_status',(select e.status from public.subscription_access_entitlements e where e.subscription_id=s.id and e.entitlement_code='academy_membership' limit 1)
      ) order by case s.status when 'active' then 0 when 'pending' then 1 when 'paused' then 2 else 3 end,s.created_at desc)
      from public.organization_subscriptions s
      join public.organization_fee_plans f on f.id=s.fee_plan_id
      left join public.athlete_profiles ap on ap.id=s.athlete_id
      left join public.profiles p on p.id=coalesce(ap.user_id,s.user_id)
      left join public.profiles pp on pp.id=s.payer_user_id
      where (v_mode='academy' and s.organization_id=v_org)
         or (v_mode<>'academy' and s.athlete_id=v_athlete and (v_org is null or s.organization_id=v_org))
    ),'[]'::jsonb),
    'invoices',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',i.id,'reference_code',i.reference_code,'invoice_type',i.invoice_type,'subscription_id',i.organization_subscription_id,
        'athlete_id',i.athlete_id,'athlete_name',coalesce(p.display_name,p.name,p.handle,'مشترك'),
        'payer_name',case when v_mode='academy' then coalesce(pp.display_name,pp.name,pp.handle) when i.payer_user_id=v_uid or i.guardian_user_id=v_uid then 'أنت' else null end,
        'subtotal',i.subtotal,'tax_amount',i.tax_amount,'total_amount',i.total_amount,'currency',i.currency,'status',i.status,
        'issued_at',i.issued_at,'due_at',i.due_at,'billing_period_key',i.billing_period_key,
        'paid_amount',coalesce((select sum(py.amount) from public.payments py where py.invoice_id=i.id and py.status='paid'),0),
        'outstanding_amount',greatest(i.total_amount-coalesce((select sum(py.amount) from public.payments py where py.invoice_id=i.id and py.status='paid'),0),0),
        'overdue',i.status in ('issued','partially_paid') and i.due_at<now(),
        'can_submit_payment',v_mode<>'academy' and i.status in ('issued','partially_paid','overdue') and (
          i.payer_user_id=v_uid or i.guardian_user_id=v_uid or exists(select 1 from public.guardianships g where g.athlete_id=i.athlete_id and g.guardian_user_id=v_uid and g.status='verified')
        ),
        'open_submission_id',(select ps.id from public.subscription_payment_submissions ps where ps.invoice_id=i.id and ps.status in ('submitted','pending_provider') order by ps.created_at desc limit 1),
        'items',coalesce((select jsonb_agg(jsonb_build_object('description',ii.description,'quantity',ii.quantity,'unit_amount',ii.unit_amount,'tax_amount',ii.tax_amount,'total_amount',ii.total_amount) order by ii.created_at) from public.invoice_items ii where ii.invoice_id=i.id),'[]'::jsonb)
      ) order by case i.status when 'overdue' then 0 when 'issued' then 1 when 'partially_paid' then 2 when 'paid' then 3 else 4 end,i.created_at desc)
      from public.invoices i
      left join public.athlete_profiles ap on ap.id=i.athlete_id
      left join public.profiles p on p.id=ap.user_id
      left join public.profiles pp on pp.id=coalesce(i.payer_user_id,i.guardian_user_id)
      where (v_mode='academy' and i.issuer_organization_id=v_org)
         or (v_mode='guardian' and i.athlete_id=v_athlete and (i.payer_user_id=v_uid or i.guardian_user_id=v_uid or exists(select 1 from public.guardianships g where g.athlete_id=i.athlete_id and g.guardian_user_id=v_uid and g.status='verified')) and (v_org is null or i.issuer_organization_id=v_org))
         or (v_mode='player' and i.athlete_id=v_athlete and (v_org is null or i.issuer_organization_id=v_org))
    ),'[]'::jsonb),
    'submissions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'submission_reference',s.submission_reference,'invoice_id',s.invoice_id,'payment_method',s.payment_method,
        'provider_code',s.provider_code,'provider_reference',case when v_mode='player' then null else s.provider_reference end,
        'amount',s.amount,'currency',s.currency,'status',s.status,'payer_note',case when v_mode='player' then null else s.payer_note end,
        'review_note',case when v_mode='player' then null else s.review_note end,
        'created_at',s.created_at,'reviewed_at',s.reviewed_at,'payment_id',s.payment_id,'receipt_id',s.receipt_id,
        'payer_is_current_user',s.payer_user_id=v_uid
      ) order by s.created_at desc)
      from public.subscription_payment_submissions s
      where (v_mode='academy' and s.organization_id=v_org)
         or (v_mode<>'academy' and s.payer_user_id=v_uid and (v_org is null or s.organization_id=v_org))
    ),'[]'::jsonb),
    'payments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',py.id,'invoice_id',py.invoice_id,'amount',py.amount,'currency',py.currency,'status',py.status,
        'provider',case when v_mode='player' then null else py.provider end,
        'provider_reference',case when v_mode='player' then null else py.provider_reference end,
        'paid_at',py.paid_at,'created_at',py.created_at
      ) order by coalesce(py.paid_at,py.created_at) desc)
      from public.payments py
      join public.invoices i on i.id=py.invoice_id
      where (v_mode='academy' and py.payee_organization_id=v_org)
         or (v_mode<>'academy' and py.payer_user_id=v_uid and (v_org is null or py.payee_organization_id=v_org))
    ),'[]'::jsonb),
    'receipts',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'receipt_number',r.receipt_number,'invoice_id',r.invoice_id,'payment_id',r.payment_id,
        'subscription_id',r.subscription_id,'athlete_id',r.athlete_id,'amount',r.amount,'currency',r.currency,
        'issued_at',r.issued_at,'verification_status',r.verification_status
      ) order by r.issued_at desc)
      from public.subscription_payment_receipts r
      where (v_mode='academy' and r.organization_id=v_org)
         or (v_mode='guardian' and r.payer_user_id=v_uid and (v_org is null or r.organization_id=v_org))
         or (v_mode='player' and r.athlete_id=v_athlete and (v_org is null or r.organization_id=v_org))
    ),'[]'::jsonb),
    'entitlements',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'subscription_id',e.subscription_id,'entitlement_code',e.entitlement_code,'status',e.status,
        'starts_at',e.starts_at,'ends_at',e.ends_at,'source_invoice_id',e.source_invoice_id,'source_payment_id',e.source_payment_id
      ) order by e.created_at desc)
      from public.subscription_access_entitlements e
      where (v_mode='academy' and e.organization_id=v_org)
         or (v_mode<>'academy' and e.athlete_id=v_athlete and (v_org is null or e.organization_id=v_org))
    ),'[]'::jsonb),
    'payment_integrations',coalesce((
      select jsonb_agg(jsonb_build_object('provider_code',oi.provider_code,'connection_label',oi.connection_label,'status',oi.status,'credential_state',oi.credential_state,'connected',oi.status='connected' and oi.credential_state='configured') order by oi.provider_code)
      from public.organization_integrations oi
      where oi.organization_id=v_org and oi.system_type='payments'
    ),'[]'::jsonb),
    'stats',jsonb_build_object(
      'subscriptions_active',(select count(*) from public.organization_subscriptions s where ((v_mode='academy' and s.organization_id=v_org) or (v_mode<>'academy' and s.athlete_id=v_athlete and (v_org is null or s.organization_id=v_org))) and s.status='active'),
      'invoices_open',(select count(*) from public.invoices i where ((v_mode='academy' and i.issuer_organization_id=v_org) or (v_mode<>'academy' and i.athlete_id=v_athlete and (v_org is null or i.issuer_organization_id=v_org))) and i.status in ('issued','partially_paid','overdue')),
      'outstanding_amount',coalesce((select sum(greatest(i.total_amount-coalesce((select sum(py.amount) from public.payments py where py.invoice_id=i.id and py.status='paid'),0),0)) from public.invoices i where ((v_mode='academy' and i.issuer_organization_id=v_org) or (v_mode<>'academy' and i.athlete_id=v_athlete and (v_org is null or i.issuer_organization_id=v_org))) and i.status in ('issued','partially_paid','overdue')),0),
      'paid_amount',coalesce((select sum(py.amount) from public.payments py join public.invoices i on i.id=py.invoice_id where py.status='paid' and ((v_mode='academy' and py.payee_organization_id=v_org) or (v_mode='guardian' and py.payer_user_id=v_uid) or (v_mode='player' and i.athlete_id=v_athlete))),0),
      'pending_submissions',(select count(*) from public.subscription_payment_submissions s where s.status in ('submitted','pending_provider') and ((v_mode='academy' and s.organization_id=v_org) or (v_mode<>'academy' and s.payer_user_id=v_uid)))
    ),
    'payment_options',jsonb_build_object(
      'offline_methods',jsonb_build_array('bank_transfer','cash','card_terminal'),
      'gateway_enabled',exists(select 1 from public.organization_integrations oi where oi.organization_id=v_org and oi.system_type='payments' and oi.status='connected' and oi.credential_state='configured'),
      'connected_gateway_codes',coalesce((select jsonb_agg(oi.provider_code order by oi.provider_code) from public.organization_integrations oi where oi.organization_id=v_org and oi.system_type='payments' and oi.status='connected' and oi.credential_state='configured'),'[]'::jsonb)
    ),
    'rules',jsonb_build_object(
      'subscription_activation','Paid invoice or zero-value plan is required before activation.',
      'payer_submission','A payer submission is not a paid transaction until finance approves or a connected provider verifies it.',
      'player_privacy','Players see their subscription, invoice status, receipt and entitlement; guardian payment references remain private.',
      'external_providers','Payment gateways remain disabled until status is connected and credentials are configured.'
    )
  );
end
$function$;

revoke all on function private.subscription_payment_center_v1(uuid,uuid,uuid) from public,anon;
grant execute on function private.subscription_payment_center_v1(uuid,uuid,uuid) to authenticated;

create or replace function public.my_subscription_payment_center(
  p_organization_id uuid default null,
  p_athlete_id uuid default null,
  p_invoice_id uuid default null
) returns jsonb
language sql
stable
security invoker
set search_path=''
as $function$
  select private.subscription_payment_center_v1($1,$2,$3)
$function$;
revoke all on function public.my_subscription_payment_center(uuid,uuid,uuid) from public,anon;
grant execute on function public.my_subscription_payment_center(uuid,uuid,uuid) to authenticated;



alter function private.subscription_payment_center_v1(uuid,uuid,uuid)
rename to subscription_payment_center_core_v1;

create or replace function private.subscription_payment_center_v1(
  p_organization_id uuid default null,
  p_athlete_id uuid default null,
  p_invoice_id uuid default null
) returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_result jsonb;
begin
  v_result:=private.subscription_payment_center_core_v1(p_organization_id,p_athlete_id,p_invoice_id);
  if v_result->>'mode'='player' then
    v_result:=jsonb_set(v_result,'{payment_integrations}','[]'::jsonb,true);
    v_result:=jsonb_set(v_result,'{payment_options}',jsonb_build_object(
      'offline_methods','[]'::jsonb,
      'gateway_enabled',false,
      'connected_gateway_codes','[]'::jsonb
    ),true);
  end if;
  return v_result;
end
$function$;

revoke all on function private.subscription_payment_center_core_v1(uuid,uuid,uuid) from public,anon;
revoke all on function private.subscription_payment_center_v1(uuid,uuid,uuid) from public,anon;
grant execute on function private.subscription_payment_center_v1(uuid,uuid,uuid) to authenticated;

create or replace function private.financial_account_user_can_read_v1(
  p_account_id uuid,
  p_user_id uuid default auth.uid()
) returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select p_user_id is not null and exists(
    select 1 from public.financial_accounts a
    where a.id=p_account_id and (
      a.owner_user_id=p_user_id
      or (a.owner_organization_id is not null and public.erp_has_org_access(a.owner_organization_id,p_user_id))
    )
  )
$function$;
revoke all on function private.financial_account_user_can_read_v1(uuid,uuid) from public,anon;
grant execute on function private.financial_account_user_can_read_v1(uuid,uuid) to authenticated;

drop policy if exists financial_accounts_select_owner on public.financial_accounts;
create policy financial_accounts_select_owner
on public.financial_accounts for select to authenticated
using(
  owner_user_id=(select auth.uid())
  or (owner_organization_id is not null and public.erp_has_org_access(owner_organization_id,(select auth.uid())))
);

drop policy if exists ledger_entries_select_account_owner on public.ledger_entries;
create policy ledger_entries_select_account_owner
on public.ledger_entries for select to authenticated
using(private.financial_account_user_can_read_v1(account_id,(select auth.uid())));

revoke select on public.financial_accounts from anon;
revoke select on public.ledger_entries from anon;


create index if not exists subscription_entitlements_organization_idx on public.subscription_access_entitlements(organization_id,status);
create index if not exists subscription_entitlements_source_invoice_idx on public.subscription_access_entitlements(source_invoice_id) where source_invoice_id is not null;
create index if not exists subscription_entitlements_source_payment_idx on public.subscription_access_entitlements(source_payment_id) where source_payment_id is not null;
create index if not exists subscription_receipts_athlete_idx on public.subscription_payment_receipts(athlete_id,issued_at desc) where athlete_id is not null;
create index if not exists subscription_receipts_invoice_idx on public.subscription_payment_receipts(invoice_id);
create index if not exists subscription_receipts_issued_by_idx on public.subscription_payment_receipts(issued_by_user_id) where issued_by_user_id is not null;
create index if not exists subscription_receipts_subscription_idx on public.subscription_payment_receipts(subscription_id,issued_at desc) where subscription_id is not null;
create index if not exists subscription_submissions_athlete_idx on public.subscription_payment_submissions(athlete_id,created_at desc) where athlete_id is not null;
create index if not exists subscription_submissions_payment_idx on public.subscription_payment_submissions(payment_id) where payment_id is not null;
create index if not exists subscription_submissions_receipt_idx on public.subscription_payment_submissions(receipt_id) where receipt_id is not null;
create index if not exists subscription_submissions_reviewed_by_idx on public.subscription_payment_submissions(reviewed_by_user_id,reviewed_at desc) where reviewed_by_user_id is not null;
create index if not exists subscription_submissions_subscription_idx on public.subscription_payment_submissions(subscription_id,created_at desc) where subscription_id is not null;

commit;
