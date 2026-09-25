# Business Add-On Ecosystem Plan

This plan defines the delivery of reusable business add-ons under `packages/addons/<addon>`. It adapts the product brief to the CODEXSUN modular-monolith architecture.

## Identity

- Owner: Business Add-On Agent
- Runtime package root: `packages/addons/`
- Agent records: `packages/addons/agent/`
- Registry metadata: `core/registry/addons/`
- Task prefix: `BA`
- Status: planned
- Next task: `BA-0001`

The `agent` folder stores planning records. It is not a runtime add-on. Each runtime add-on owns one package, provider, public contracts, modules, tests, and README.

## Add-On Suite

| Add-on | ID | Responsibility |
| --- | --- | --- |
| Mailer | `mailer` | Email accounts, threads, templates, sending, and automation |
| Chatty | `chatty` | Channels, direct messages, groups, mentions, and history |
| Taskez | `taskez` | Tasks, assignments, priorities, dependencies, and execution |
| Calendy | `calendy` | Calendars, events, availability, reminders, and scheduling |
| Notez | `notez` | Personal and team notes, rich text, search, and links |
| Wikiz | `wikiz` | Structured company knowledge and internal documentation |
| Notifyz | `notifyz` | In-app, email, push, task, system, and workflow notifications |
| Socialix | `socialix` | Social content, scheduling, publishing, campaigns, and analytics |
| Meety | `meety` | Agendas, participants, notes, decisions, and action items |
| Gitflow | `gitflow` | Repositories, branches, commits, issues, and pull requests |
| Flowix | `flowix` | Triggers, conditions, actions, workflows, and automation |

## Repository Structure

```text
packages/
  addons/
    agent/
      planner.md
      task.md
      README.md
      SKILLS.md
    mailer/
      package.json
      README.md
      src/
      test/
    notifyz/

core/registry/addons/
  mailer.json
  notifyz.json
```

The root workspace must include `packages/addons/*`. The add-on scaffold must generate `packages/addons/<id>`. The registry owner must use `packages/addons/<id>`. Package names must use `@codexsun/addon-<id>`.

## Ownership Rules

- An add-on owns its domain, provider, contracts, routes, services, repositories, migrations, seeders, events, jobs, and tests.
- Framework owns runtime-neutral provider and module contracts.
- Platform Core owns generic runtime, identity contracts, enablement, data lifecycle, and infrastructure ports.
- UI owns reusable visual primitives. An add-on owns only add-on-specific screens and flows.
- Applications select add-ons through deployment profiles. Add-ons do not import applications.
- Cross-add-on communication uses public contracts and typed events. Private imports are not allowed.
- Registry files select composition. They do not contain implementation.

## Add-On Package Contract

Each runtime add-on uses only the folders it needs:

```text
packages/addons/<id>/
  package.json
  README.md
  src/
    index.ts
    modules/<module>/
      provider.ts
      contracts/
      domain/
      services/
      repository/
      routes/
      events/
      jobs/
      migrations/
      seeders/
  test/
```

Each README must document purpose, owner, public contracts, dependencies, configuration, storage, events, local setup, and verification commands.

## Shared Capability Policy

Before adding shared code, inspect existing identity, authorization, users, organizations, workspaces, roles, permissions, teams, audit logs, notifications, events, APIs, database access, storage, search, activity tracking, settings, feature flags, jobs, queues, webhooks, integrations, logging, errors, observability, security, and testing.

Do not duplicate these systems inside an add-on. Add a shared package only when at least two add-ons need the same stable behavior. Record its owner and consumers before implementation.

## Integration Direction

These edges are candidates. Each edge requires a reviewed public contract:

```text
Mailer   -> Notifyz
Chatty   -> Notifyz
Taskez   -> Notifyz, Calendy, Flowix
Calendy  -> Notifyz, Meety
Notez    -> Wikiz, Meety
Wikiz    -> Search capability
Socialix -> Notifyz, Flowix
Meety    -> Calendy, Notez, Taskez
Gitflow  -> Taskez, Notifyz, Flowix
Flowix   -> approved contracts from all add-ons
```

Use synchronous calls only for immediate results. Use typed events for completed actions and asynchronous work.

## Event Contract

Use the name `<addon>.<aggregate>.<action>`, such as `taskez.task.created` and `mailer.email.sent`.

Every event must define its TypeScript payload, owner, version, producer, consumers, delivery semantics, idempotency rule, audit treatment, and failure behavior. Breaking changes require a versioned migration path.

## Phased Delivery

### Phase 0: Repository Assessment

Goal: Ground the plan in the current repository.

Dependencies: None.

Deliverables: Architecture inventory, capability map, ownership map, dependency map, and verified or untested status list.

Implementation: Inspect Assist, registry, Framework, Platform Core, UI, applications, devkits, storage, and tests. Do not create runtime add-on code.

Validation: Run registry verification and applicable boundary and architecture checks.

Exit criteria: The team has an approved repository-grounded boundary map.

### Phase 1: Package and Registry Foundation

Goal: Make `packages/addons/*` a supported package location.

Dependencies: Phase 0.

Deliverables: Workspace entry, scaffold path, manifest validation, package template, registry tests, and lifecycle tests.

Implementation: Update only workspace, scaffold, registry, and focused tests. Keep profile enablement explicit and data retention backward-compatible.

Validation: Scaffold a test add-on. Verify discovery, install, enable, disable, provider loading, and registry checks.

Exit criteria: An empty add-on can be created, verified, enabled, loaded, and tested without changing an application.

### Phase 2: Shared Capability Review

Goal: Define the minimum shared capabilities required by the suite.

Dependencies: Phase 1.

Deliverables: Capability ownership matrix, public ports, data lifecycle policy, event envelope, queue, job, webhook, search, storage, and observability decisions.

Implementation: Reuse Framework and Platform Core. Add shared code only after owner and affected consumers are documented.

Validation: Contract tests and module-boundary checks.

Exit criteria: Add-ons have stable shared ports and no duplicate platform systems.

### Phase 3: Notifyz Foundation

Goal: Provide a shared notification contract.

Dependencies: Phase 2.

Deliverables: Notification domain, preferences, delivery ports, persistence, migrations, seeders, `notifyz.notification.created`, and `notifyz.notification.sent`.

Validation: Unit, contract, migration, authorization, and API tests.

Exit criteria: An authorized caller can create, read, and acknowledge a notification.

### Phase 4: Mailer

Goal: Provide provider-neutral business email.

Dependencies: Phases 2 and 3.

Deliverables: Mailbox, thread, message, template, delivery, retry, idempotency, and email events.

Validation: Contract, authorization, queue, retry, failure, and API tests.

Exit criteria: An authorized workflow can submit an email and record its result.

### Phase 5: Chatty

Goal: Provide team communication with durable history.

Dependencies: Phases 2 and 3.

Deliverables: Channels, direct messages, groups, mentions, membership, history, and notification integration.

Validation: Membership, authorization, ordering, event, API, and real-time boundary tests.

Exit criteria: Authorized members can exchange and retrieve messages.

### Phase 6: Taskez

Goal: Provide structured task and execution tracking.

Dependencies: Phases 2 and 3.

Deliverables: Tasks, assignments, status, priority, dependencies, due dates, activity, and task events.

Validation: Domain, authorization, dependency, lifecycle, API, and notification tests.

Exit criteria: A task has a validated lifecycle with auditable assignment and completion.

### Phase 7: Calendy

Goal: Provide scheduling and availability contracts.

Dependencies: Phases 2 and 3.

Deliverables: Calendars, events, participants, availability, reminders, conflict checks, and events.

Validation: Time-zone, conflict, authorization, reminder, API, and migration tests.

Exit criteria: An authorized user can create an event, check conflicts, and schedule a reminder.

### Phase 8: Notez and Wikiz

Goal: Provide notes and structured knowledge without duplicate storage logic.

Dependencies: Phases 2 and 3.

Deliverables: Notez note, folder, tag, link, and search contracts. Wikiz page, space, revision, permission, and publishing contracts.

Validation: Content, authorization, revision, search, API, and persistence tests.

Exit criteria: Users can create, update, search, link, and audit notes and knowledge pages.

### Phase 9: Meety

Goal: Connect meetings to scheduling, notes, and tasks.

Dependencies: Phases 3, 7, and 8.

Deliverables: Meetings, agendas, participants, notes, decisions, action items, history, and integration contracts.

Validation: Authorization, participant, lifecycle, integration, event, and API tests.

Exit criteria: A meeting can create decisions and action items with traceable links.

### Phase 10: Gitflow

Goal: Provide provider-neutral developer collaboration contracts.

Dependencies: Phases 3 and 6.

Deliverables: Repository, branch, commit, issue, pull request, webhook, and development activity contracts.

Validation: Adapter, authorization, webhook signature, event, and API tests.

Exit criteria: A configured adapter can report development activity without exposing credentials.

### Phase 11: Socialix

Goal: Provide social content planning and publishing contracts.

Dependencies: Phases 2 and 3.

Deliverables: Content, channel, campaign, schedule, publishing adapter, analytics, and notification contracts.

Validation: Authorization, scheduling, adapter, retry, event, and API tests.

Exit criteria: Authorized users can schedule content through a provider-neutral boundary.

### Phase 12: Flowix

Goal: Provide safe automation across approved contracts.

Dependencies: All prior add-on phases.

Deliverables: Workflow, trigger, condition, action, run, retry, approval, cancellation, and audit contracts.

Validation: Isolation, authorization, idempotency, retry, cancellation, event, and end-to-end tests.

Exit criteria: A workflow can run approved actions with bounded permissions and durable audit state.

### Phase 13: Cross-Add-On Integration

Goal: Connect add-ons through reviewed public contracts.

Dependencies: Phases 3 through 12.

Deliverables: Integration matrix, typed consumers, idempotency rules, failure handling, and user flows.

Validation: Contract compatibility, replay, duplicate delivery, recovery, API, and Playwright tests where applicable.

Exit criteria: Integrations use public contracts and pass boundary checks.

### Phase 14: Production Readiness

Goal: Prepare controlled deployment.

Dependencies: Phase 13.

Deliverables: Security review, isolation checks, performance baseline, backup and restore runbook, migration and rollback procedures, observability, deployment profiles, and release record.

Validation: Static checks, tests, builds, boundary checks, focused live checks, and explicit untested paths.

Exit criteria: Deployment evidence, rollback steps, known limits, and human release approval exist.

## Definition of Done

An add-on or integration is complete only when its code, types, tests, API behavior, persistence changes, security checks, documentation, and acceptance criteria are complete. The task register must contain verification evidence before a task becomes `completed`.

## Non-Goals

- Do not build all add-ons in one task.
- Do not create standalone applications for add-on domains.
- Do not duplicate identity, permissions, storage, database, notification, or event infrastructure.
- Do not add credentials to source, fixtures, logs, or documentation.
- Do not change unrelated applications or packages without an approved contract task.
