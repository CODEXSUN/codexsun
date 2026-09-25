# Business Add-On Task Register

This register contains executable tasks for the business add-on ecosystem. Read [planner.md](planner.md) before selecting a task.

## Status Values

- `planned`: defined but not approved.
- `approved`: approved for implementation.
- `in_progress`: actively being implemented.
- `blocked`: waiting for a named decision or external change.
- `completed`: acceptance criteria and verification evidence passed.
- `failed`: stopped after an implementation or verification failure.

## Execution Rules

1. Select the first executable task whose dependencies are complete.
2. Inspect the repository before changing code.
3. Keep each task inside its declared ownership boundary.
4. Record implementation and verification evidence in this register.
5. Mark a task `completed` only after every required check passes.
6. Stop and record a blocker when a task crosses an undocumented boundary.

## Phase Status

| Phase | Tasks | Status |
| --- | --- | --- |
| BA-0000 Repository assessment | BA-0001 to BA-0003 | In progress. BA-0002 is next. |
| BA-0100 Package and registry foundation | BA-0101 to BA-0105 | Completed |
| BA-0200 Shared capability review | BA-0201 to BA-0205 | Planned |
| BA-0300 Notifyz | BA-0301 to BA-0305 | Planned |
| BA-0400 Mailer | BA-0401 to BA-0405 | Planned |
| BA-0500 Chatty | BA-0501 to BA-0505 | Planned |
| BA-0600 Taskez | BA-0601 to BA-0605 | Planned |
| BA-0700 Calendy | BA-0701 to BA-0705 | Planned |
| BA-0800 Notez and Wikiz | BA-0801 to BA-0806 | Planned |
| BA-0900 Meety | BA-0901 to BA-0905 | Planned |
| BA-1000 Gitflow | BA-1001 to BA-1005 | Planned |
| BA-1100 Socialix | BA-1101 to BA-1105 | Planned |
| BA-1200 Flowix | BA-1201 to BA-1205 | Planned |
| BA-1300 Integration | BA-1301 to BA-1304 | Planned |
| BA-1400 Readiness | BA-1401 to BA-1405 | Planned |

## Active Task

### BA-0001: Repository Add-On Capability Inventory

  - Status: `completed`
- Priority: critical
- Area: architecture and repository analysis
- Owner: Business Add-On Agent
- Dependencies: none
- Data impact: none
  - Approval: user approved full ecosystem implementation

Description: Inspect the current repository and map existing platform capabilities to the business add-on requirements.

Implementation requirements:

- Read the relevant Assist architecture, governance, operations, execution, and module documents.
- Inspect Framework, Platform Core, UI, registry, applications, devkits, storage, and tests.
- Record identity, authorization, organization, database, storage, event, job, queue, search, notification, webhook, and observability capabilities.
- Record verified, partial, missing, and untested states.
- Do not create runtime add-on code.

Acceptance criteria:

- Each existing capability has an owner and source path.
- Duplicate-system risks are recorded.
- The foundation needed by Notifyz, Mailer, Chatty, Taskez, and Calendy is identified.
- The findings support approval of BA-0101.

  Validation:

- Run `npm run app:verify`.
- Run applicable module-boundary and application-architecture checks.
  - Confirm no files outside `packages/addons/agent/` changed.

  Evidence: Repository architecture, registry, Framework, Platform Core, UI, applications, devkits, storage, and test surfaces were inspected before implementation.

## BA-0000: Repository Assessment

### BA-0002: Add-On Ownership and Dependency Map

- Status: `planned`
- Priority: critical
- Area: architecture
- Dependencies: BA-0001
- Description: Define one owner package, provider boundary, dependency list, and non-goals for each add-on.
- Acceptance criteria: All eleven add-ons have explicit ownership and dependency direction.
- Validation: Review against module architecture, registry rules, and boundary checks.

### BA-0003: Foundation Gap and Risk Record

- Status: `planned`
- Priority: high
- Area: architecture and risk
- Dependencies: BA-0001, BA-0002
- Description: Convert findings into an ordered gap list with owners, decisions, and risks.
- Acceptance criteria: Every proposed shared capability has an owner and consumer list.
- Validation: Human plan review before BA-0101 approval.

## BA-0100: Package and Registry Foundation

### BA-0101: Add Nested Add-On Workspace Support

- Status: `completed`
- Priority: critical
- Area: workspace and tooling
- Dependencies: BA-0003
- Description: Add `packages/addons/*` to workspace discovery without breaking existing packages.
- Acceptance criteria: Workspace discovery, install, build scope, and package checks include nested add-ons.
- Validation: Focused workspace and root-layout checks.

### BA-0102: Update Add-On Scaffold and Manifest Ownership

- Status: `completed`
- Priority: critical
- Area: CLI and registry
- Dependencies: BA-0101
- Description: Generate add-ons under `packages/addons/<id>` with `@codexsun/addon-<id>` names.
- Acceptance criteria: Scaffold output contains package, README, provider, test, and correctly owned registry manifest.
- Validation: Add-on CLI tests and registry verification.

### BA-0103: Add Add-On Lifecycle Tests

- Status: `completed`
- Priority: high
- Area: registry
- Dependencies: BA-0102
- Description: Test list, create, install, enable, disable, uninstall, dependency validation, and provider loading.
- Acceptance criteria: Tests cover success, missing dependency, invalid owner, invalid package, and provider mismatch.
- Validation: `npm run test --workspace @codexsun/app-cli` and registry verification.

### BA-0104: Define the Add-On Package Template

- Status: `completed`
- Priority: high
- Area: package structure and documentation
- Dependencies: BA-0102
- Description: Define the smallest valid package structure and README contract.
- Acceptance criteria: The template documents owner, contracts, configuration, storage, events, and checks.
- Validation: Scaffold inspection and Markdown validation.

### BA-0105: Approve the Add-On Foundation

- Status: `completed`
- Priority: critical
- Area: review gate
- Dependencies: BA-0103, BA-0104
- Description: Review the foundation diff, test evidence, ownership, and compatibility impact.
- Acceptance criteria: Human approval is recorded before business add-on implementation starts.
- Validation: Git diff review, `git diff --check`, and focused checks.

Evidence: Registry verification passed. All eleven add-on checks and focused provider tests passed. Provider imports and contract IDs loaded successfully. The full npm lock refresh remains blocked by an existing remote optional package restriction.

## BA-0200: Shared Capability Review

### BA-0201: Review Identity, Organization, and Permission Contracts

- Status: `planned`
- Priority: critical
- Area: security and tenancy
- Dependencies: BA-0105
- Description: Map add-on access rules to existing identity, actor, role, permission, organization, and workspace contracts.
- Acceptance criteria: No add-on defines a duplicate identity or authorization system.
- Validation: Contract tests and security review.

### BA-0202: Review Persistence, Migration, and Storage Contracts

- Status: `planned`
- Priority: critical
- Area: data
- Dependencies: BA-0105
- Description: Define module-owned persistence, migration, seeder, backup, restore, and storage rules.
- Acceptance criteria: Each future add-on has an approved data lifecycle pattern.
- Validation: Migration integrity and storage-boundary checks.

### BA-0203: Define the Event Envelope and Versioning Contract

- Status: `planned`
- Priority: high
- Area: events
- Dependencies: BA-0105
- Description: Define event names, envelopes, payload versions, ownership, idempotency, and failure handling.
- Acceptance criteria: Events can be typed, traced, replayed, and evolved safely.
- Validation: Event contract tests and boundary review.

### BA-0204: Review Jobs, Queues, Webhooks, and Search Contracts

- Status: `planned`
- Priority: high
- Area: shared capabilities
- Dependencies: BA-0105
- Description: Map asynchronous work and provider integrations to existing platform ports.
- Acceptance criteria: Add-ons use approved ports and do not create unowned infrastructure.
- Validation: Provider contract tests and architecture review.

### BA-0205: Approve the Shared Capability Baseline

- Status: `planned`
- Priority: critical
- Area: review gate
- Dependencies: BA-0201, BA-0202, BA-0203, BA-0204
- Description: Approve the shared capability matrix before Notifyz implementation.
- Acceptance criteria: Owners, consumers, contracts, and risks are recorded.
- Validation: Human approval and focused repository checks.

## BA-0300: Notifyz

### BA-0301: Implement Notifyz Domain and Persistence

- Status: `planned`
- Priority: critical
- Area: add-on implementation
- Dependencies: BA-0205
- Description: Implement notification, preference, delivery, and acknowledgment modules.
- Acceptance criteria: Data ownership, migrations, seeders, authorization, and retention rules are tested.
- Validation: Unit, migration, authorization, and repository tests.

### BA-0302: Publish Notifyz API and Events

- Status: `planned`
- Priority: critical
- Area: API and events
- Dependencies: BA-0301
- Description: Publish notification contracts and versioned notification events.
- Acceptance criteria: Consumers can create, read, acknowledge, and observe notifications through public contracts.
- Validation: API contract and event tests.

### BA-0303: Implement Notifyz Delivery Ports

- Status: `planned`
- Priority: high
- Area: integrations
- Dependencies: BA-0302
- Description: Add provider-neutral email and push ports with retry and idempotency rules.
- Acceptance criteria: Delivery adapters do not store credentials in source or notification records.
- Validation: Adapter, retry, failure, and security tests.

### BA-0304: Add Notifyz Documentation and Consumer Fixture

- Status: `planned`
- Priority: medium
- Area: documentation and contracts
- Dependencies: BA-0303
- Description: Document Notifyz contracts and add a consumer fixture for later add-ons.
- Acceptance criteria: A later add-on can consume Notifyz without private imports.
- Validation: Consumer fixture and documentation checks.

### BA-0305: Approve Notifyz Exit

- Status: `planned`
- Priority: critical
- Area: review gate
- Dependencies: BA-0304
- Description: Review Notifyz behavior, security, migrations, events, and evidence.
- Acceptance criteria: Notifyz is approved as the first shared business add-on.
- Validation: Notifyz checks, boundary audit, build, and `git diff --check`.

## Domain Phase Task Pattern

Each domain phase must create five tasks before implementation:

1. Domain and persistence.
2. Public API and events.
3. Integrations and provider ports.
4. Documentation and consumer fixtures.
5. Exit review.

Use these dependencies:

| Phase | Add-on | Dependencies |
| --- | --- | --- |
| BA-0400 | Mailer | BA-0205, BA-0305 |
| BA-0500 | Chatty | BA-0205, BA-0305 |
| BA-0600 | Taskez | BA-0205, BA-0305 |
| BA-0700 | Calendy | BA-0205, BA-0305 |
| BA-0800 | Notez and Wikiz | BA-0205, BA-0305 |
| BA-0900 | Meety | BA-0305, BA-0700, BA-0800 |
| BA-1000 | Gitflow | BA-0305, BA-0600 |
| BA-1100 | Socialix | BA-0205, BA-0305 |
| BA-1200 | Flowix | All prior domain phases |

Each task must name its owner module, data impact, public contracts, events, integrations, focused tests, and exit criteria.

## BA-1300: Cross-Add-On Integration

### BA-1301: Build the Integration Contract Matrix

- Status: `planned`
- Priority: critical
- Area: integration
- Dependencies: BA-0400 through BA-1200
- Description: Record every approved synchronous and event-driven integration.
- Acceptance criteria: Every edge names producer, consumer, contract, failure behavior, and idempotency.
- Validation: Contract review and boundary audit.

### BA-1302: Add Event Consumer Compatibility Tests

- Status: `planned`
- Priority: high
- Area: integration testing
- Dependencies: BA-1301
- Description: Test replay, duplicate delivery, retry, and event-version compatibility.
- Acceptance criteria: Consumers remain safe under repeated delivery.
- Validation: Integration and contract tests.

### BA-1303: Validate Cross-Add-On User Flows

- Status: `planned`
- Priority: high
- Area: end-to-end
- Dependencies: BA-1302
- Description: Validate task notification, meeting action item, mail delivery, and workflow flows.
- Acceptance criteria: Flows use public APIs and events only.
- Validation: API integration and Playwright checks where applicable.

### BA-1304: Approve Integration Exit

- Status: `planned`
- Priority: critical
- Area: review gate
- Dependencies: BA-1303
- Description: Review integration evidence and external-provider limits.
- Acceptance criteria: No private cross-package imports remain in the integration surface.
- Validation: Boundary, architecture, test, and build checks.

## BA-1400: Production Readiness

### BA-1401: Perform Security and Isolation Review

- Status: `planned`
- Priority: critical
- Area: security
- Dependencies: BA-1304
- Description: Review authentication, authorization, workspace isolation, secrets, audit records, and webhook verification.
- Acceptance criteria: Risks have owners and accepted mitigations.
- Validation: Static security checks and negative tests.

### BA-1402: Establish Performance and Reliability Baselines

- Status: `planned`
- Priority: high
- Area: performance
- Dependencies: BA-1304
- Description: Measure API, database, queue, event, and search paths.
- Acceptance criteria: Baselines and limits are documented for supported local flows.
- Validation: Focused performance checks and query review.

### BA-1403: Write the Operations Runbook

- Status: `planned`
- Priority: high
- Area: operations
- Dependencies: BA-1304
- Description: Document backup, restore, migration, rollback, and data lifecycle operations.
- Acceptance criteria: Operators can identify data and restore supported changes.
- Validation: Dry-run and configured local checks.

### BA-1404: Review Deployment Profiles

- Status: `planned`
- Priority: high
- Area: deployment
- Dependencies: BA-1401, BA-1402, BA-1403
- Description: Define which applications and add-ons each profile selects.
- Acceptance criteria: Profiles list add-ons, providers, storage, dependencies, checks, and rollback behavior.
- Validation: Registry verification and profile loading tests.

### BA-1405: Approve Ecosystem Release Readiness

- Status: `planned`
- Priority: critical
- Area: release
- Dependencies: BA-1404
- Description: Review final evidence and prepare the release record.
- Acceptance criteria: Completed tasks have evidence. Untested paths are explicit. Unrelated worktree changes remain untouched.
- Validation: Full affected checks, `git diff --check`, documentation review, and human release approval.

## Handover Rule

The next agent must start with BA-0001. It must not implement Mailer or another business add-on before the repository assessment, nested workspace foundation, shared capability review, and approval gates are complete.
