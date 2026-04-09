# Planning

## Current Batch

### Reference

`#107`

### Title

`Refactor planning baseline for app-oriented modularization`

## Objective

Create a planning-only refactor program for the repository that converts large or mixed-responsibility areas into clean, modular, app-owned structures without changing product behavior, collapsing the design system, or inventing new concepts before approval.

## Non-Negotiable Guardrails

1. This batch is planning only. Do not refactor, move, rename, or rewrite implementation in this batch.
2. Do not collapse, replace, or dilute the current design system, existing behavior, visual nature, UX flow, or product identity already built.
3. Do not create new concepts, new abstractions, new engines, new patterns, or new product vocabulary unless explicitly approved by the user first.
4. Prefer app ownership over vague shared layers. Keep responsibilities visible and app boundaries explicit.
5. Shared code stays shared only when it is truly neutral, reusable, and already justified by multiple apps.
6. `apps/ui` must remain the reusable design-system and neutral UX layer, not a dumping ground for business screens.
7. `apps/framework` must remain infrastructure and composition only, not business logic.
8. Every future refactor task must preserve current outputs first, then improve structure second.
9. Every future refactor task must be small, reviewable, reversible, and independently testable.
10. Every future refactor task must be written so the codebase becomes easier to open source later, with better developer experience and clearer engine-style system boundaries for each approved concept.

## Refactor Direction

The refactor program should move the repository toward:

1. app-oriented ownership
2. smaller files and smaller modules
3. explicit controller -> service -> repository separation where relevant
4. cleaner public interfaces between apps
5. easier onboarding for future open-source contributors
6. better developer experience through predictable structure, naming, and boundaries
7. concept-by-concept engine readiness, but only for concepts already present and approved

## Explicit Preservation Rules

1. Preserve existing behavior before improving internal structure.
2. Preserve current design-system defaults, naming, variants, and reusable blocks.
3. Preserve app responsibilities already defined in `ASSIST/AI_RULES.md`.
4. Preserve route contracts unless a separate approved task allows contract changes.
5. Preserve data model intent unless a separate approved task allows migration-level changes.
6. Preserve user-facing flows unless a separate approved task allows UX behavior changes.

## Approval Gate

Before any future implementation batch:

1. do not introduce a new architectural concept without user approval
2. do not create a new shared package without user approval
3. do not move a responsibility across app boundaries without user approval
4. do not standardize an internal pattern as a repo-wide rule until one pilot app proves it

## Phase Plan

### Phase 1. Repository Baseline Audit

Goal:

Create a factual inventory of what exists now, app by app, without changing code.

Deliverables:

1. identify oversized files
2. identify mixed-responsibility files
3. identify app-boundary violations
4. identify duplicate helpers, contracts, and route patterns
5. identify shared UI misuse versus app-specific UI ownership

Exit rule:

No implementation starts until the audit list is reviewed and approved.

### Phase 2. Boundary Freeze

Goal:

Freeze current ownership rules before any file movement.

Deliverables:

1. confirm app ownership for each touched area
2. mark which logic belongs in framework, api, ui, core, and product apps
3. mark what must stay local instead of becoming shared
4. mark any ambiguous concepts that require user approval first

Exit rule:

No extraction or sharing work starts until ownership is explicit.

### Phase 3. File-Splitting Rules

Goal:

Define how large files will be split into small modules without behavior drift.

Deliverables:

1. split by responsibility, not by arbitrary filename count
2. keep controllers focused on transport and request handling
3. keep services focused on business rules
4. keep repositories focused on persistence access
5. keep types, validation, and helpers separate when they become noisy
6. keep each unit small enough to review safely

Exit rule:

Every targeted large file must have a written split map before editing starts.

### Phase 4. App-by-App Refactor Queue

Goal:

Convert the repo into a sequence of small app-owned tasks instead of one huge refactor.

Deliverables:

1. prioritize one app or one concept at a time
2. avoid cross-app edits unless required
3. finish one small vertical slice before opening the next
4. attach validation expectations to each slice

Exit rule:

Only approved slices enter active implementation.

### Phase 5. Open-Source and DX Hardening

Goal:

Shape future refactors so the repository becomes easier for external developers to understand and contribute to.

Deliverables:

1. predictable folder structure
2. explicit module entry points
3. clear naming
4. reduced hidden coupling
5. concise local docs per concept when needed
6. engine-style boundaries for approved concepts only

Exit rule:

DX improvements must support real code clarity, not add documentation noise.

## Small-Task Execution Standard

Every future implementation task must follow this structure:

1. one app or one concept only
2. one narrow responsibility only
3. one reviewable output only
4. one validation scope only
5. one rollback-safe batch only

Bad task shape:

1. refactor full app
2. redesign all services
3. move everything shared

Good task shape:

1. split one controller file
2. extract one repository from one service
3. isolate one validation module
4. normalize one app entry surface

## Planned Work Order

1. baseline audit
2. ownership confirmation
3. split-map creation
4. approve first pilot app
5. execute one small pilot refactor
6. validate behavior parity
7. repeat per app and per concept

## Quality Review

This planning batch is correct if:

1. it does not trigger implementation by accident
2. it breaks work into small numbered jobs
3. it is app-oriented
4. it protects the current design system and product behavior
5. it blocks unapproved new concepts
6. it supports future open-source readiness and developer experience
7. it keeps the repository aligned with `ASSIST/AI_RULES.md`

## Validation

Manual review only for this batch.

1. confirmed source constraints from `ASSIST/AI_RULES.md`
2. confirmed refactor intent from `ASSIST/Execution/refactor.md`
3. wrote planning as phased, modular, and implementation-safe
