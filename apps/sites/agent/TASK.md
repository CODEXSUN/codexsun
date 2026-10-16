# Site Studio task and working rules

## Client workspace task

Manage must open the selected portfolio's Studio within Sites, with client details, pages, and blogs.
Start and Open must use the saved client port. Starting requires local development and live authorization.
LogicX, Ramu Tex, and new standard portfolios have database-backed public profile, website sections, and blog editors.
Keep startup controls separate from deployment jobs. Local development startup must not become a production process launcher.

Implementation evidence: client Studio, source inventory, Start/Open controls, and a local authenticated startup route exist under Sites.
Automated tests cover missing identity, denied permission, repeated live authorization, host isolation, startup validation, and real Vite startup.
The three local clients returned HTTP 200 on ports 7130, 7131, and 7132 during this task.
Those checks were absent from the initial foundation. The CMS continuation initializes the registered local tenant and verifies signed-in editing.

## Read order

1. Read the repository agent guide and governance rules.
2. Read [the development skills and workflow](SKILLS.md).
3. Read [the architecture and work plan](PLAN.md).
4. Inspect the affected module, public exports, tests, and host references before editing.

## Ownership

Site Studio is an application owned by `apps/sites`.
Platform identity supplies authenticated actor, tenant, and authorization capabilities through public contracts.
Sites owns its business permissions and enforcement, data, UI, migrations, workers, deployment logic, and tests.
Keep all new Studio source and configuration inside this app.
Use the repository root for npm commands, dependencies, and generated build output.

Platform currently contains host registration, context adapters, migration/seed invocation, and screen mounting.
Do not expand those references into Studio implementation.
If a generic host contract is missing, record the exact dependency before proposing a host change.
Do not import Platform private files into Sites.

## Storage and identity

Studio authoring data belongs in the authenticated tenant's MariaDB database.
A client within an agency tenant is not another Platform tenant.
Enforce client and site membership in addition to tenant isolation.
Ordinary client servers use site-specific SQLite stores. Workers use a separate D1 adapter.
Public clients receive published content only. They never receive tenant database credentials or Studio session tokens.
Use Platform's current session contract. Do not copy browser token storage from the existing CMS helper.

## Working agreement

Keep architecture, phase acceptance gates, and the execution sequence together in [PLAN.md](PLAN.md).
Keep app information in `apps/sites/README.md`. Keep every other Sites Markdown file under `apps/sites/agent`.
Use `apps/sites/README.md` as the single README and link this task file from it.
Keep agent documentation flat: `TASK.md` for scope and working rules, `PLAN.md` for architecture and execution, and `SKILLS.md` for workflow.
Do not add an agent README, another app-level `AGENTS.md`, or a nested skills folder.
Agent instructions and skills never grant runtime permissions or weaken backend checks.
Update status only when implementation and verification support it.
Do not create placeholder modules, fake deployment states, or fabricated content.
Apply repository verification gates appropriate to the actual change.
Report missing contracts, migration prerequisites, and skipped checks explicitly.

These files guide development agents. They are not runtime business-chat instructions and are not loaded by the API.

## Active client change

Keep LogicX and replace the CODEXSUN and Tech Media sample portfolios with Ramutex.
Ramutex uses port 7132 and theme `portfolio-ramutex`. Its company profile supplies the business domain `ramumag.com`.
Its home page now uses the supplied company profile, with no invented customer claims or blog posts.
Retain old source files outside the active exports and builds.
The earlier default database setting was stale. The CMS continuation uses the authoritative registry and applies the updated local seed.

## Ramu Tex portfolio from the company profile

Source: `clients/src/clients/ramutex/assets/ramu-tex-company-profile.pdf` within Sites.
Use the printed business name Ramu Tex Processors India Inc and the listed domain `ramumag.com`.
Keep the internal client slug `ramutex` and local development port 7132.
The brochure supplies machinery, fibre types, seven specialty finishes, address, phones, emails, and GSTIN.
Present certification and environmental references as company-profile claims. No current certification lookup has run.
Do not invent customers, testimonials, production capacity, establishment dates, or blogs.
The enquiry form prepares an email draft. It does not submit to an API or send mail automatically.
The original profile is available as a download on the public website.

## CMS continuation evidence

The registered local tenant now has the Sites CMS tables, brochure draft, and new permission grants.
Live Platform login opened all three workspace tabs without browser errors.
A browser save survived a full reload from MariaDB. Publishing changed the local website.
The original brochure wording was restored and republished after the verification edit.
Isolated MariaDB tests verify actual DDL, repeatable seeds, revision conflicts, publication, site isolation, withdrawal, and safe deletion.
SQLite-backed SQL tests additionally verify transactional audit behavior, denied HTTP actions, invalid input, and separate tenant databases.
Local public delivery remains bound through an authorized Start and must be rebound after an API restart.
Production targets, custom page CRUD, rich text, media uploads, and offline SQLite/D1 delivery remain separate planned work.

Final CMS checks: ten automated tests passed with MariaDB verification enabled and no skipped tests.
Sites API, Web, and client builds passed, along with the Platform Web composition build.
The blog browser test verified required controls, draft save/reload, private-draft isolation, and deletion. Its temporary draft was removed.
Local runtime launch and public content binding were verified through an authenticated Start request.

## Standard portfolios and Start repair — 2026-10-16

Completed source and local database work:

- Replaced fixed-depth checkout resolution with upward discovery from source, compiled output, and host working directories.
- Connected LogicX to its own saved profile, sections, blogs, and publication state.
- Added Home, About, Services, Contact, Blog, and article routes for both clients and the standard template.
- Connected public reads through separate server-bound client identities and matching per-client Vite proxies.
- Added direct Add Portfolio creation, required-field feedback, standard template defaults, and atomic initial workspace persistence.
- Added site settings and duplicate registered port checks. New clients await their first publication.
- Removed the obsolete source-only Studio inventory and its Web dependency.
- Initialized LogicX in the registered local tenant through the authoritative tenant registry and secret reference.
- Retained Ramu Tex's existing saved and published brochure content.

Verification evidence:

- Thirteen CMS, identity, runtime, and MariaDB tests passed with no skips.
- Two SQLite identity-store tests passed.
- Sites API, Web, named client, and standard template production builds passed. Platform Web composition build passed.
- Sites type checks, lint, module boundaries, root dependency layout, and component documentation checks passed.
- Browser checks exercised Add Portfolio validation and the LogicX editor's save, reload, draft isolation, and publication.
- Both clients' five public pages returned their own published content and fitted a 390-pixel viewport.
- A separate public browser run completed without page errors.
- Original LogicX wording was restored and republished after the verification edit.

Local development behavior is verified. Production hosting and durable content delivery remain planned.
