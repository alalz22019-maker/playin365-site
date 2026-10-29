create index if not exists opportunities_venue_idx on public.opportunities(venue_id);
create index if not exists opportunities_registration_fee_plan_idx on public.opportunities(registration_fee_plan_id);
create index if not exists opportunity_candidates_event_registration_full_idx on public.opportunity_candidates(event_registration_id) where event_registration_id is not null;
create index if not exists athlete_offers_candidate_idx on public.athlete_offers(candidate_id) where candidate_id is not null;
create index if not exists athlete_offers_team_idx on public.athlete_offers(team_id) where team_id is not null;
create index if not exists opportunity_evaluations_sports_event_idx on public.opportunity_evaluations(sports_event_id) where sports_event_id is not null;
create index if not exists opportunity_stage_events_actor_org_idx on public.opportunity_stage_events(actor_organization_id) where actor_organization_id is not null;
create index if not exists opportunity_admissions_opportunity_idx on public.opportunity_admissions(opportunity_id);
create index if not exists opportunity_admissions_team_idx on public.opportunity_admissions(team_id) where team_id is not null;
create index if not exists opportunity_admissions_membership_idx on public.opportunity_admissions(membership_id) where membership_id is not null;
create index if not exists opportunity_admissions_invoice_idx on public.opportunity_admissions(invoice_id) where invoice_id is not null;
create index if not exists opportunity_admissions_fee_plan_idx on public.opportunity_admissions(fee_plan_id) where fee_plan_id is not null;

comment on index public.opportunity_admissions_opportunity_idx is 'Golden Tryouts & Opportunities: supports admission lookup by opportunity.';
comment on index public.opportunity_evaluations_sports_event_idx is 'Golden Tryouts & Opportunities: supports evaluation lookup by trial event.';
