# Module Inventory

## Purpose

This file is the first current-to-target inventory for the modular ERP migration.

It is not the final folder migration plan. It is the classification map that shows where today's modules belong in the future architecture.

## Current Apps To Future Roles

| Current path | Current role | Future classification | Notes |
| --- | --- | --- | --- |
| `apps/framework` | runtime composition, database, config, host, media, security | split toward `engines/*` plus thin framework composition layer | keep business-neutral |
| `apps/api` | internal and external route transport | route layer shared by module manifests | do not absorb business logic |
| `apps/ui` | design system, docs, neutral shell surfaces | `packages/shared/ui-system` plus optional docs app | keep app-neutral |
| `apps/core` | shared masters and common modules | shared domain package plus shared master-data app boundary | avoid turning into a dumping ground |
| `apps/cxapp` | active suite shell, auth, company, mailbox, settings | shell app plus future Codexsun control-plane-facing surfaces | likely split later between shell and control-plane concerns |
| `apps/billing` | accounting and voucher flows | standalone `billing-app` | industry packs may enable or hide parts |
| `apps/ecommerce` | storefront, customer, checkout, orders | standalone `commerce-app` | current commerce authority stays here |
| `apps/crm` | leads and interactions | standalone `crm-app` | may later consume task app through API or events |
| `apps/demo` | demo and installer workflows | `demo-app` and Codexsun demo mode support | keep separate from live client overlays |
| `apps/frappe` | ERPNext connector | standalone integration app | later may depend on integration-engine contracts |
| `apps/tally` | reserved Tally integration | standalone integration app later | still scaffolded |
| `apps/task` | reserved task app | standalone `task-app` later | still scaffolded |
| `apps/site` | public presentation | public site app | presentation-only |
| `apps/cli` | repo, deploy, and ops tooling | orchestration tooling layer | keep out of runtime shell |
| `apps/mobile` | companion Expo client | separate client app | consumes shared contracts, not framework-composed app shape |

## Candidate Future Engines

These do not exist as separate folders yet, but current code already points toward them:

1. `auth-engine`
   Current sources: parts of `apps/framework` auth primitives plus `apps/cxapp` auth usage
2. `database-engine`
   Current sources: `apps/framework/src/runtime/database/*`
3. `mail-engine`
   Current sources: SMTP and mail transport parts of framework plus mailbox integration points
4. `media-engine`
   Current sources: `apps/framework/src/runtime/media/*`
5. `document-engine`
   Current sources: future destination for document generation and file workflows
6. `plugin-engine`
   Current sources: future destination for manifest-driven registration
7. `tenant-engine`
   Current sources: future destination for client and tenant resolution
8. `deployment-engine`
   Current sources: current hosted-app, remote-server, system-update, and deployment tooling

## Candidate Future Industry Packs

Initial industry-pack planning set:

1. `computer-retail`
   Example client: `techmedia`
2. `garment-d2c`
   Example client: `tirupurdirect`
3. `textile-wholesale`
   Example client: `thetirupurtextiles`
4. `single-brand-retail`
   Example client: `horse-club`
5. `education-campus`
   Example client: `neot`

## Candidate Future Client Overlays

Initial client-overlay planning set:

1. `techmedia`
   Industry: `computer-retail`
2. `tirupurdirect`
   Industry: `garment-d2c`
3. `thetirupurtextiles`
   Industry: `textile-wholesale`
4. `horse-club`
   Industry: `single-brand-retail`
5. `neot`
   Industry: `education-campus`

## Candidate Future Orchestration Modules

1. tenant registry
2. deployment control
3. health and monitoring dashboard
4. support desk
5. maintenance scheduler
6. feature enablement control
7. backup and recovery visibility
8. cross-client accounts-office workspace

## Immediate Boundary Guidance

Until repo migration starts:

1. keep building features in current app boundaries
2. stop adding new direct app-to-app shortcuts when API or shared contracts are more correct
3. prefer designing new module contributions in a manifest-friendly way
4. isolate client-specific behavior behind config or narrow app-owned adapters rather than scattering it through shared code
