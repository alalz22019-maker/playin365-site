# Golden Tryouts & Opportunities — Release Candidate

**Date:** 29 October 2026
**Route:** `tryoutOpportunity`
**Roles:** Academy, Coach, Guardian, Player
**Status:** Preview verified

## Purpose

This release creates one governed recruitment journey from opportunity publication through application, guardian consent, trial attendance, technical evaluation, offer, admission, membership activation, team assignment, and an optional handoff to Subscription & Payment.

No legacy service is removed. Existing routes such as `acadTryouts`, `opps`, `rate`, `myIdentity`, `eventHub`, forms, messages, reports, and finance remain directly reachable.

## Shared journey

1. The academy creates and publishes an opportunity linked to a sports event.
2. The player applies with an existing sports identity and submits required documents.
3. The guardian approves participation when the athlete is a minor.
4. The academy reviews eligibility and documents and invites the athlete to the trial.
5. The coach records attendance and publishes a weighted technical evaluation.
6. The academy issues an offer.
7. The guardian consents to the offer when required and the player accepts or declines.
8. Admission creates or activates organization membership and team assignment.
9. A required fee is handed to the governed Subscription & Payment journey.
10. Identity and activity records are updated from the same source events.

## Authority boundaries

| Role | Allowed authority |
|---|---|
| Academy | Publish, review eligibility and documents, move pipeline stage, issue offer, finalize admission |
| Coach | Trial check-in, technical evaluation, recommendation |
| Guardian | Application consent and offer consent for linked minors |
| Player | Apply, submit documents, withdraw, accept or decline own offer |

The coach cannot issue offers or activate memberships. The player cannot write directly to opportunity or offer tables. Anonymous users cannot execute the journey RPCs.

## Privacy boundaries

- Staff notes are visible only to authorized academy and coaching staff.
- The athlete and guardian receive only the published athlete summary and permitted dimensions.
- A player cannot see other candidates.
- The guardian sees only linked athletes and decisions requiring guardian action.

## Database delivery

Applied migrations (aligned to the production migration history):

- `20261028232720_golden_tryouts_opportunities_schema.sql`
- `20261028232810_golden_tryouts_opportunities_create_apply.sql`
- `20261028232907_golden_tryouts_opportunities_pipeline.sql`
- `20261028232946_golden_tryouts_opportunities_evaluation_offer.sql`
- `20261028233026_golden_tryouts_opportunities_admission_finance.sql`
- `20261028233117_golden_tryouts_opportunities_center.sql`
- `20261028233134_golden_tryouts_opportunities_grants.sql`
- `20261028233500_fix_tryout_event_link_statuses.sql`
- `20261028233605_fix_event_registration_notification_dedup_index.sql`
- `20261028235940_golden_tryouts_opportunities_index_hardening.sql`
- `20261029003048_golden_tryouts_opportunities_baseline_rpc_hardening.sql`

The feature uses five RLS-enabled tables with direct client DML revoked. Eighteen authenticated RPCs provide the workflow surface. Anonymous execution is revoked and SECURITY DEFINER functions use a pinned empty search path with qualified object references.

## Visual system

The approved archived geometry is reused without redrawing:

- Academy: `TL`
- Coach: `BL`
- Guardian: `TR`
- Player: `BR`

The role views are implemented as Opportunity Flow Canvas surfaces:

- Academy Command Pipeline
- Coach Trial Studio
- Guardian Approval Lens
- Athlete Opportunity Story

## Local acceptance evidence

- JavaScript syntax: PASS
- End-to-end data journey: PASS
- Role privacy guards: PASS
- Direct-write guards: PASS
- Demo seed: PASS
- Role route audit: PASS
- Opportunity sheets: 14/14 PASS
- Four-role local browser acceptance at 390×844: PASS
- Console, page, and request failures: 0
- Horizontal overflow findings: 0
- Visible touch targets below 44px: 0
- Unavailable route findings: 0

Preview verification completed on deployment `dpl_Cru9J9s9Gh1rpsgmLAxH6kSf7jaL` for commit `72bf1692ce50af5bbe5efa90d59456cbcc518d85`. All four role views, privacy boundaries, mobile layout, assets, and runtime checks passed. Production verification remains pending until merge and deployment.
