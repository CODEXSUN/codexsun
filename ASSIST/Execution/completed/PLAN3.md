# Planning Track: Overall Correction and Pre-Release Audit

## Purpose

This planning track defines the execution strategy for the system-wide correction, stabilization, and architectural audit outlined in `TASK3.md`. 

It exists to enforce the boundaries between `framework`, `cxapp`, `core`, and the shared design system (`ui`) before the overall platform can be considered a stable, production-grade foundation for composed applications.

## Scope

- `apps/framework` (Agnostic runtime, DI constraints, DB drivers, error handling)
- `apps/cxapp` (Base shell, operator UX, auth lifecycles, session persistence)
- `apps/core` (Shared master entities, strict data bounds)
- `apps/ui` (Design system strictness and purity)
- `ASSIST/Execution` (Tracking and branch alignment)
- `ASSIST/Documentation` (Architecture alignment)

## What This Track Is

This track is strictly about **hardening the existing foundation**. We are deliberately halting new feature development (like adding more ecommerce or billing screens) to fix structural leaks, UI routing edge cases, and missing platform validations. The goal is to ensure the Codexsun monorepo acts as a cohesive, reliable suite.

## Current Gaps & Blockers

While the domain apps (billing, ecommerce, frappe) are progressing, the underlying platform integration currently has several gaps:

1. **Framework Instability**: Edge cases exist in database driver switching at runtime, and Dependency Injection (DI) resolution occasionally risks cyclic dependencies in the framework layer.
2. **CxApp Handoff Issues**: The initial desk shell loads, but transitions suffer from flash-of-unstyled-content (FOUC), UI jumping during auth, and incomplete browser session/token refresh lifecycles.
3. **Authority Leaks**: Master data rules (e.g., negative inventory blocking, category immutability) are conceptually defined but not fully guarded at the code level in `apps/core`.
4. **Documentation Drift**: Development pace has outstripped documentation. The tracking docs, `TASK.md`, branches, and `ARCHITECTURE.md` need a unified alignment pass.

## Canonical Decisions For Stabilization Work

1. **Zero Feature Creep**: If an issue is not a bug fix, architectural enforcement, or an audit check, it does not belong in this phase.
2. **Strict UI Boundary**: `apps/ui` must remain pure presentation. If business logic is discovered here during the audit, it must be immediately extracted to `cxapp` or the corresponding domain app.
3. **Master Authority Integrity**: `apps/core` holds the undeniable truth for shared entities. If an app attempts to alter a master record in a way that violates core rules (e.g., selling beyond available sellable quantity), the framework/core boundary must explicitly reject the transaction.
4. **Traceability**: Every code change in this phase must tie back to an exact reference number and update the tracking logs before merging.

## Execution Strategy

We will execute `TASK3.md` in the following logical waves:

### Wave 1: Underlying Framework & Core Hardening (Tasks F1 & M1)

Before fixing UI behaviors, the underlying services must be rock solid.
- Fix runtime database driver switching edge cases.
- Resolve DI cycles and standardize HTTP/API error mapping globally.
- Enforce strict Core master constraints (ensure inventory bounds block oversells, audit contact relational integrity, enforce ledger immutability).

### Wave 2: CxApp & Presentation Layer Stabilization (Tasks C1)

With the backend stabilized, fix the user-facing foundation.
- Fix browser session persistence and token refresh lifecycles.
- Eliminate UI jumps and FOUC during the framework shell handoff.
- Hard-code strict role and permission checks across all `/internal/v1/cxapp/*` routes.
- Improve the error boundaries shown to operators when an app module fails to load.

### Wave 3: Cross-App Audit and Final Review (Tasks R1)

Verify the platform structure matches the rules.
- Perform a full cross-app ownership audit (`ui` must be logic-free, `api` routes must be decoupled from business logic).
- Verify all active tracking references match across `TASK.md`, `PLANNING.md`, `CHANGELOG.md`, and Git branches.
- Run the complete end-to-end test suite covering auth lifecycles and baseline workspace assembly.
- Finalize `ARCHITECTURE.md` as the single source of truth for the platform.

## Validation Standard

Every fix committed under this track must pass:
1. `npm run typecheck` across all workspaces.
2. `npm run lint`.
3. Successful execution of the full test suite (`npm run test`).
4. Manual smoke test of the CxApp auth login/logout lifecycle.

## Risks And Follow-Up

- **Risk**: Fixing DI cycles in `apps/framework` may require refactoring how apps register themselves. This must be done carefully to avoid breaking the `ecommerce` and `billing` boots.
- **Risk**: Fixing FOUC might require SSR/SSG adjustments depending on how the UI shell is currently compiled.
- **Follow-Up**: Once this track is signed off, the platform is formally ready for production-grade scale, and feature development on domain apps can safely resume.

## Definition of Success

This plan is considered complete when the overall platform correctly loads its modules, handles errors gracefully, enforces security checks at runtime, and perfectly mirrors the structural rules defined in `ARCHITECTURE.md`.