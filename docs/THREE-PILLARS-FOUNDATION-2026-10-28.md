# PlayIn365 — Three Pillars Foundation

## Product model

PlayIn365 now exposes the existing sports graph as three coordinated pillars:

1. **Individuals** — one account, a personal work home, and an independent portable identity.
2. **Organizations** — independent organization identity plus responsibility-specific workspaces.
3. **Events** — a first-class identity connecting organizer, teams, officials, participants, outcomes and evidence.

## What changed

- Added `smartHome`, assembled from the active context, responsibility, work items, updates and upcoming events.
- Added a context switcher: one account can move between personal and organization responsibilities.
- Split `identityHub` (personal identity) from `organizationIdentity` (organization identity).
- Added `eventHub` and public identity routes using the existing entity graph.
- Added a shared achievement record credited to the academy, leader, coach, player and event.
- Added responsibility-specific demo work queues for owner, executive, academy admin, finance, HR, operations, registration, marketing, cashier, gate, content and coach.
- Preserved all 70 legacy academy/coach/player routes in the service hub and direct URLs.

## UX rules

- Home shows decisions, changes, next moments and a small responsibility-specific action set—not a complete service directory.
- Details remain in legacy and redesigned service routes.
- Personal identity never becomes the organization identity, even while working inside an organization context.
- Event identity is independent and may appear in multiple personal and organization timelines.
- The approved geometric orientation is represented by clipped corners (BR/BL/TL/TR); no droplet silhouette is used.

## Data rules

- Contexts use `user_context_preferences`, organization memberships/access and responsibility assignments.
- Home decisions use `work_items` and `approval_requests` through `my_three_pillars_home`.
- Identities use `entities`, `identity_pages`, `entity_roles`, `credentials`, `achievements`, `achievement_credits` and `entity_activity_events`.
- Event participation uses `sports_events`, `entity_event_links`, registrations, teams and officials.
- An achievement is one record with multiple credits; it is never copied into separate identities.

## No-feature-loss contract

`three-pillars-contract.json` lists every existing academy, coach and player route. New entry points are additive. A release fails acceptance if any listed route becomes unavailable.
