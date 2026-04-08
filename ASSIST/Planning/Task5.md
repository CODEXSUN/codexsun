# Phase 5: CRM Integration & Cold Call Orchestration

This phase focuses on introducing a new `apps/crm` module. The primary objective is to build a high-velocity lead tracking interface where agents can register "Cold Calls", instantly assign them to the Task Module for execution, record follow-ups (customer replies), and ultimately finalize the sales cycle.

## 1. CRM Application Scaffold & Workspace Registration
- [ ] Initialize `apps/crm` directory structure mimicking `apps/task` and `apps/billing`.
- [ ] Define `CrmWorkspaceItems` in `apps/crm/shared/workspace-items.ts` with routes for `/leads`, `/cold-calls`, and `/pipelines`.
- [ ] Register the `crm` app manifest in `apps/cxapp/web/src/desk/desk-registry.ts` with a suitable icon (e.g., `PhoneCall` or `Users`).
- [ ] Mount the CRM routing logic inside `apps/cxapp/web/src/pages/framework-app-workspace-page.tsx`.

## 2. Database Foundations
- [ ] Create `table-names.ts` in `apps/crm/database/` defining stores and headers.
- [ ] Write `01-crm-foundation.ts` migration using `ensureJsonStoreTable` for `crm_lead_stores` and `crm_interaction_stores`.
- [ ] Write `02-crm-headers.ts` for index queries (`crm_lead_headers`, `crm_interaction_headers`).
- [ ] Link database types to the global Kysely definitions.

## 3. Backend Implementation (Repository & API)
- [ ] Develop `crm-repository.ts` in `apps/crm/src/services/` to handle Lead and Interaction lifecycles.
- [ ] Create `internal/crm-routes.ts` in the API runtime to process incoming requests (`POST /crm/leads`, `POST /crm/interactions`).
- [ ] **Integration Point:** Wire `POST /crm/interactions` to conditionally call the `TaskRepository.instantiateTaskTemplate()` to automatically bind a follow-up task to the `crm_lead` via the polymorphic `task_entity_links` table.

## 4. Frontend Workspace & UX
- [ ] Build `LeadDashboard` (`apps/crm/web/src/pages/lead-dashboard.tsx`) featuring a list/grid of prospective leads.
- [ ] Construct the **Cold Call Registration Workflow**: A slide-out panel (Sheet) or Modal where an agent logs the call metadata.
- [ ] Embed the `<EntityTaskWidget />` (built in Phase 4) directly onto the Lead Details page. This proves the modularity by instantly showing Tasks bound to this specific `crm_lead`.

## 5. End-to-End Functional Test
- [ ] Agent opens CRM -> Clicks "New Cold Call".
- [ ] Submits form -> Saves interaction AND automatically generates an attached task in the system.
- [ ] Agent navigates to Task Kanban -> Sees the new generic task.
- [ ] Agent progresses task to 'Done' -> Returns to CRM -> CRM shows the lead status successfully advanced or task closed out.
