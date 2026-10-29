# PlayIn365 — Communication Command & Periodic Reports

**Date:** 29 October 2026  
**Routes:** `communicationCenter`, `communicationInbox`, `communicationReports`  
**Roles:** Academy, Coach, Guardian, Player  
**Status:** Release candidate

## Purpose

This release adds a governed organization communication layer without replacing direct conversations or any legacy service. It supports immediate and scheduled broadcasts, dynamic audiences derived from the live organization graph, recipient read tracking, reusable templates, and periodic reports.

## Authority model

| Role | Allowed communication authority |
|---|---|
| Academy administration | Players, coaches, guardians, staff, management, or all eligible organization users; all organization teams; organization and financial report types according to assigned permissions |
| Coach | Players and verified guardians of managed teams only; team and attendance reports; no management, coach, or financial targeting |
| Guardian | Receive organization and coach messages; read and act on own notifications only |
| Player | Receive organization and coach messages; read and act on own notifications only |

Every sender is resolved from current memberships, responsibilities, access roles, assigned teams, and training sessions. No copied mailing list becomes a source of truth.

## Dynamic audience

Audience selection supports:

- players;
- coaches;
- verified guardians;
- staff;
- management;
- all permitted organization users;
- one or more organization teams;
- explicit users when supplied by a governed workflow.

The recipient list is calculated at send time. A preview RPC returns the current count and a safe sample before sending.

## Delivery channels

| Channel | Current state |
|---|---|
| In-app PlayIn365 notification | Ready; delivery and read receipts recorded |
| Push notification | Experimental pending verified provider credentials |
| WhatsApp | Experimental pending verified provider credentials |
| SMS | Experimental pending verified provider credentials |
| Email | Experimental pending verified provider credentials |
| Voice | Backend-supported experimental channel; not presented as connected |

No external provider is labeled connected until credentials, connection, webhook, and delivery tests pass.

## Periodic reports

Supported schedules:

- daily;
- weekly;
- monthly.

Supported report types:

- weekly achievement;
- weekly attendance;
- weekly team summary;
- monthly management;
- monthly financial;
- custom report.

Coach scope is restricted to weekly achievement, attendance, team summary, and custom reports for managed teams. Reports exclude medical data, private coach notes, and individual financial details.

The active database worker runs every five minutes through `pg_cron` and processes due broadcasts and report schedules with bounded batches and `SKIP LOCKED` concurrency protection.

## User experience

### Academy and coach

`communicationCenter` provides:

- a role-aware hero and exact approved geometry;
- message composer;
- template application and academy template saving;
- dynamic role and team audience builder;
- recipient preview;
- immediate and scheduled sending;
- channel readiness display;
- send, delivery, and read metrics;
- broadcast history and cancellation of scheduled items;
- periodic report schedule creation;
- pause, resume, archive, and run-now actions.

### All recipients

`communicationInbox` provides:

- organization broadcasts and periodic reports;
- unread count;
- all/unread/broadcast filters;
- mark one or all as read;
- governed deep links;
- a separate path to existing direct conversations.

### Smart home and command search

Each supported role receives a communication signal in the smart home. The routes are also available from PlayIn Command search. Existing `messages`, `opsEngagement`, `opsReports`, and `opsInbox` remain available.

## Source of truth

- `organization_broadcasts`
- `organization_broadcast_recipients`
- `organization_communication_templates`
- `organization_report_schedules`
- `organization_report_runs`
- `notifications`
- organization memberships, teams, team athletes, verified guardianships, access roles, responsibilities, training sessions, and events

## Database source recovery

The four database migrations already applied to production are restored into Git with the exact migration-history versions:

- `20261029080050_organization_communications_reports.sql`
- `20261029080116_organization_communications_cron.sql`
- `20261029080834_organization_communications_demo_seed.sql`
- `20261029081022_coach_communications_demo_seed.sql`
- `20261029091021_organization_communications_index_hardening.sql`

## Local verification

- 4 roles verified.
- 12 communication and smart-home screens verified.
- Exact geometry: Academy `TL`, Coach `BL`, Guardian `TR`, Player `BR`.
- 0 new-screen horizontal overflow at 390×844.
- 0 visible controls below the touch-target gate.
- 0 JavaScript, page, or request errors.
- Command search exposes 45 Academy, 35 Coach, 20 Guardian, and 27 Player entries.
- 15/15 data and authority checks passed.
- Academy immediate delivery and scheduled cancellation passed.
- Weekly report run-now and recipient delivery passed.
- Coach targeting restrictions passed.
- Guardian and Player send attempts were blocked.
- QA broadcasts, recipients, report runs, schedules, and notifications were removed after verification.
