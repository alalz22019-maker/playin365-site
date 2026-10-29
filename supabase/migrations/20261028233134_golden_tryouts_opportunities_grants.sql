drop function if exists public.my_organization_opportunity_offer_create(uuid,text,text,jsonb,timestamptz);

revoke all on function public.create_my_organization_tryout_opportunity(uuid,text,text,text,text,text[],text,text,timestamptz,timestamptz,uuid,uuid,timestamptz,timestamptz,integer,boolean,jsonb,jsonb,jsonb,uuid,boolean) from public,anon;
revoke all on function public.act_my_organization_tryout_opportunity(uuid,text,text) from public,anon;
revoke all on function public.my_tryout_opportunity_apply(uuid,jsonb,text) from public,anon;
revoke all on function public.my_opportunity_apply(uuid) from public,anon;
revoke all on function public.my_guardian_tryout_application_decide(uuid,text,text) from public,anon;
revoke all on function public.my_guardian_opportunity_decide(uuid,text,text) from public,anon;
revoke all on function public.my_opportunity_candidate_document_submit(uuid,text,text,text,text,text) from public,anon;
revoke all on function public.my_organization_opportunity_document_review(uuid,text,text) from public,anon;
revoke all on function public.my_organization_tryout_candidate_decide(uuid,text,text) from public,anon;
revoke all on function public.my_tryout_candidate_check_in(uuid,text,text) from public,anon;
revoke all on function public.my_tryout_evaluation_save(uuid,jsonb,text,text,text,jsonb,boolean) from public,anon;
revoke all on function public.my_organization_opportunity_offer_create(uuid,text,text,jsonb,timestamptz,uuid,text) from public,anon;
revoke all on function public.my_guardian_opportunity_offer_decide(uuid,text,text) from public,anon;
revoke all on function public.my_athlete_opportunity_offer_decide(uuid,text,text) from public,anon;
revoke all on function public.my_organization_opportunity_prepare_finance(uuid,timestamptz) from public,anon;
revoke all on function public.my_organization_opportunity_admission_finalize(uuid) from public,anon;
revoke all on function public.my_tryout_application_withdraw(uuid,text) from public,anon;
revoke all on function public.my_tryout_opportunity_center(uuid,uuid) from public,anon;

grant execute on function public.create_my_organization_tryout_opportunity(uuid,text,text,text,text,text[],text,text,timestamptz,timestamptz,uuid,uuid,timestamptz,timestamptz,integer,boolean,jsonb,jsonb,jsonb,uuid,boolean) to authenticated;
grant execute on function public.act_my_organization_tryout_opportunity(uuid,text,text) to authenticated;
grant execute on function public.my_tryout_opportunity_apply(uuid,jsonb,text) to authenticated;
grant execute on function public.my_opportunity_apply(uuid) to authenticated;
grant execute on function public.my_guardian_tryout_application_decide(uuid,text,text) to authenticated;
grant execute on function public.my_guardian_opportunity_decide(uuid,text,text) to authenticated;
grant execute on function public.my_opportunity_candidate_document_submit(uuid,text,text,text,text,text) to authenticated;
grant execute on function public.my_organization_opportunity_document_review(uuid,text,text) to authenticated;
grant execute on function public.my_organization_tryout_candidate_decide(uuid,text,text) to authenticated;
grant execute on function public.my_tryout_candidate_check_in(uuid,text,text) to authenticated;
grant execute on function public.my_tryout_evaluation_save(uuid,jsonb,text,text,text,jsonb,boolean) to authenticated;
grant execute on function public.my_organization_opportunity_offer_create(uuid,text,text,jsonb,timestamptz,uuid,text) to authenticated;
grant execute on function public.my_guardian_opportunity_offer_decide(uuid,text,text) to authenticated;
grant execute on function public.my_athlete_opportunity_offer_decide(uuid,text,text) to authenticated;
grant execute on function public.my_organization_opportunity_prepare_finance(uuid,timestamptz) to authenticated;
grant execute on function public.my_organization_opportunity_admission_finalize(uuid) to authenticated;
grant execute on function public.my_tryout_application_withdraw(uuid,text) to authenticated;
grant execute on function public.my_tryout_opportunity_center(uuid,uuid) to authenticated;

comment on table public.opportunity_candidate_documents is 'Candidate document registry for the governed Tryouts & Opportunities journey; direct client access is revoked.';
comment on table public.opportunity_evaluations is 'Structured technical tryout evaluation with separated athlete summary and staff-only note.';
comment on table public.opportunity_evaluation_dimensions is 'Weighted scoring dimensions for a tryout evaluation.';
comment on table public.opportunity_stage_events is 'Immutable candidate pipeline history across application, review, trial, offer and admission.';
comment on table public.opportunity_admissions is 'Accepted opportunity handoff to organization membership, team roster and optional financial journey.';
comment on function public.my_tryout_opportunity_center(uuid,uuid) is 'Role-aware Tryouts & Opportunities center for academy, coach, guardian and player with privacy-filtered fields.';


create unique index if not exists notifications_registration_dedup_uq
on public.notifications(user_id,notification_type,(data->>'registration_id'))
where data ? 'registration_id';
comment on index public.notifications_registration_dedup_uq is 'Supports idempotent event registration notifications by user, notification type, and registration id.';
