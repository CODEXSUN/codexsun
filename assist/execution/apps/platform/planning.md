# Platform Application Planning

## Identity

Application: Platform

Task prefix: `P`

## Goal

Build Platform as the generic CODEXSUN application holder for shared runtime capabilities. It composes approved providers and module-owned features for API, web, desktop, mobile, and deployable profiles.

Platform does not own client product behavior. Product modules and add-ons own their business rules, records, events, and user workflows.

## Architecture

```text
Framework contracts
  -> Platform Core providers
  -> Platform modules
  -> host composition
  -> selected deployable profile
```

Every module owns its provider, routes, controller, services, repository, migrations, seeders, events, tests, and README when required.

## Phases

### Phase P-1200: Runtime Hardening

- [ ] P-1201 Provider composition, lifecycle, dependency, and readiness review.
- [ ] P-1202 Environment, host configuration, secret boundary, and port policy review.
- [ ] P-1203 Health, error, audit, and correlation reporting review.

Exit: each Platform host reports safe readiness and selected providers without configuration values.

### Phase P-1210: Module Capability Baseline

- [ ] P-1211 Module manifest, public contract, and private-import review.
- [ ] P-1212 Identity, settings, storage, and operations module boundary review.
- [ ] P-1213 Migration, seeder, backup, and recovery readiness review.

Exit: every enabled module proves its owner, data lifecycle, routes, tests, and events.

### Phase P-1220: Host Parity

- [ ] P-1221 API startup, validation, route composition, and error policy.
- [ ] P-1222 Web session, MDI shell, module visibility, and Playwright flow.
- [ ] P-1223 Desktop native boundary and release artifact policy.
- [ ] P-1224 Mobile online API boundary and device-readiness policy.

Exit: hosts consume public contracts and shared UI without duplicating business logic.

### Phase P-1230: Deployment Readiness

- [ ] P-1231 Platform deployment profile and immutable release identity.
- [ ] P-1232 MariaDB, storage, migration, backup, and restore rehearsal.
- [ ] P-1233 Docker health, monitoring, browser, and rollback evidence.

Exit: Orship can deploy Platform through a reviewed profile with recovery evidence.

### Phase P-1240: Extension Readiness

- [ ] P-1241 Add-on enablement, provider selection, and compatibility checks.
- [ ] P-1242 Client profile selection without module ownership changes.
- [ ] P-1243 Multi-tenant evaluation only after a confirmed requirement.

Exit: Platform can host approved future applications without changing core boundaries.
