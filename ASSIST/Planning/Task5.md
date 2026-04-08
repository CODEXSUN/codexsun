# Phase 5: CRM Integration & Cold Call Orchestration

This phase introduces the `apps/crm` module for high-velocity lead tracking, cold call registration, follow-up task assignment, and pipeline management.

## 1. CRM Application Scaffold & Workspace Registration
- [x] Initialized `apps/crm` directory structure mirroring `apps/task`.
- [x] Defined `crmWorkspaceItems` in `apps/crm/shared/workspace-items.ts` with `/leads` and `/cold-calls` routes.
- [x] Exported `crmAppWorkspace` from `apps/crm/shared/index.ts`.
- [x] Registered `@crm` alias in `vite.config.ts`, `tsconfig.json`, and `tsconfig.server.json`.
- [x] Registered the `crm` app with icon (`PhoneCall`, `Users`) in `desk-registry.ts` with sidebar menu groups: **Sales** and **Workspace**.
- [x] Mounted `CrmWorkspaceSection` in `framework-app-workspace-page.tsx` with `hideWorkspaceHero` for `leads` and `cold-calls`.

## 2. Database Foundations
- [x] Created `table-names.ts` defining `crm_leads`, `crm_interactions`, `crm_lead_headers`, `crm_interaction_headers`.
- [x] Implemented `01-crm-foundation.ts` — JSON stores for leads and interactions via `ensureJsonStoreTable`.
- [x] Implemented `02-crm-headers.ts` — relational index tables with status, owner, type, sentiment, and `requires_followup` flag.
- [x] Exported migrations from `migration/index.ts`.
- [x] Created `src/data/query-database.ts` Kysely helper.

## 3. Backend Implementation (Repository & API)
- [x] Built `crm-repository.ts` with: `listLeadHeaders`, `createLead`, `updateLeadStatus`, `listInteractionHeaders`, `registerInteraction`, `linkTaskToInteraction`.
- [x] Created `apps/api/src/internal/crm-routes.ts` with routes:
  - `GET /crm/leads` — list with status/owner filters
  - `POST /crm/leads` — register new lead
  - `PATCH /crm/leads/status` — advance pipeline stage
  - `GET /crm/interactions` — list by leadId
  - `POST /crm/interactions` — register call, conditionally auto-spawn task + link it back
- [x] **Integration Point:** `POST /crm/interactions` calls `instantiateTaskTemplate()` when `requires_followup=true`, binding via `entity_type: "crm_lead"` polymorphic link.
- [x] Registered `createCrmInternalRoutes()` in `apps/api/src/internal/routes.ts`.

## 4. Frontend Workspace & UX
- [x] Built `ColdCallsPage` (`apps/crm/web/src/pages/cold-calls-page.tsx`):
  - Left panel: Lead list with status badges, click to select.
  - Right panel: Lead detail, interaction log timeline, "Log Interaction" form.
  - Interaction form: type (Cold Call / Email / Reply / Meeting), summary, sentiment, next steps, "Assign as Task" checkbox.
  - On submit with task flag → API auto-creates task → shows linked task ID.
- [x] Built `LeadPipelinePage` (`apps/crm/web/src/pages/lead-pipeline-page.tsx`):
  - Stats bar showing count per stage.
  - Kanban-style columns: Cold → Warm → Qualified → Converted → Lost.
  - Move buttons per card to advance pipeline stage.
- [x] Built `CrmWorkspaceSection` router (`workspace-sections.tsx`) dispatching `sectionId` → correct page.
- [x] Created `apps/crm/src/app-manifest.ts` registering the app in the platform suite.
- [x] Registered `crmAppManifest` in `apps/framework/src/application/app-suite.ts`.

## 5. End-to-End Flow (Designed & Wired)
- [x] Agent opens CRM sidebar → **Cold Calls** page loads.
- [x] Clicks `+` → fills "Register Cold Call" form → lead saved.
- [x] Clicks lead → "Log Interaction" → marks "Assign as Task" → submits.
- [x] API registers interaction, calls `instantiateTaskTemplate` with `entity_type: crm_lead`.
- [x] Task appears on the Task Kanban Board bound to the CRM lead.
- [x] Agent marks Task done on Kanban → CRM lead manually advanced to "Qualified".

