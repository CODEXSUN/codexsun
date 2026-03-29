# company-centric control

## Purpose

This file is for the next implementation plan after the current `Plan-5`.

Do not treat this file as active scope until it is filled with real requirements.

### Goal

Implement the framework foundation as a company-centric control layer that can support website, storefront, ecommerce admin, billing, desktop, and future client delivery without mixing app workflows into the framework itself.

### Scope

- `ASSIST/Migration`
- `apps/framework/src/runtime/database`
- `apps/framework/src/runtime/config`
- `apps/framework/src/runtime/http`
- `apps/framework/src/runtime/media`
- `apps/framework/src/runtime/notifications`
- `apps/framework/src/runtime/payments`
- `apps/framework/src/auth`
- `apps/framework/src/web`
- `apps/core/api/src`
- `apps/custom/*`

### Canonical Decisions

- `companies` is the framework client root and every client-specific control hangs from that root.
- `companies_settings`, `companies_features`, `companies_profiles`, `companies_brand_assets`, and `companies_social_links` are the approved extension points for client customization.
- Framework implementation starts with platform tables and backend services before broad admin UI surfaces.
- Ecommerce business tables stay separate from framework tables and belong to the ecommerce database plan.
- Framework remains infrastructure and platform control; product workflows stay in apps.
- Existing repository code is reference material only and should not override the fresh framework ownership model.

### Assumptions

- MariaDB remains the main persistence engine.
- `apps/core/api` may still host framework routes during implementation while ownership stays inside `apps/framework`.
- The first framework batch can ship with thin admin surfaces as long as the database and service boundaries are stable.
- Company-driven theming, branding, website identity, and app enablement must be data-driven rather than hard-coded.

### Execution Plan

1. Add framework table names for system, companies, company customization, auth, media, automation, build, email, integrations, printing, website, deployment, database manager, and audit modules.
2. Create module-owned framework migrations in deterministic order using the foundation plan from `ASSIST/Migration/DATABASE_TABLE_STRUCTURE_AND_FIELDS.md`.
3. Implement company repositories and services for `companies`, `companies_settings`, `companies_features`, `companies_profiles`, `companies_brand_assets`, and `companies_social_links`.
4. Implement framework auth persistence around users, memberships, roles, permissions, sessions, tokens, and access logs.
5. Implement media and storage persistence for disks, roots, folders, files, versions, tags, and usage maps.
6. Implement framework service modules for automation, build, email, integrations, printing, and website metadata management.
7. Implement deployment, git update, zip update, backup, restore, maintenance, and migration-run persistence under framework ownership.
8. Expose framework-owned HTTP modules through `apps/framework` and mount them via the shared host without moving business ownership into `apps/core/api`.
9. Add thin framework-facing control surfaces for System, Data, Users, Website, Email, Integrations, Automation, Build, and Printing using framework-backed services.
10. Wire company-specific frontend identity loading so title, tagline, about text, social links, logos, favicons, loader assets, and electron assets resolve from company data.
11. Validate database bootstrap, shared host compilation, and the custom app scaffold against the new framework foundation.
12. Record the batch and prepare the next implementation wave for ecommerce consumption of the framework services.

### Validation Plan

- Run framework database bootstrap against an empty development database
- Confirm migration order is deterministic across new framework modules
- Run `npm run build:web`
- Run `npm run build:custom-api`
- Run `npm run build:custom-web`
- Verify company customization data can be loaded without app-specific imports into framework

### Validation Status

- Pending: framework foundation batch has been planned but not yet implemented

### Risks And Follow-Up

- The framework surface is broad, so table ownership and service boundaries must stay disciplined or the framework will absorb app behavior.
- Company customization can become a settings dump if `companies_settings` is used without clear `scope_key` and `setting_key` conventions.
- Website, printing, email, and automation modules should start as metadata and orchestration layers, not as product-specific flows.
- Update and deployment modules require careful secret handling and audit trails before they are exposed broadly in admin surfaces.
- The next batch after framework foundation should integrate ecommerce with these services incrementally rather than coupling ecommerce tables back into framework.
