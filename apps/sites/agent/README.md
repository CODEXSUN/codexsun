# Site Studio agent guide

## Read order

1. Read the repository agent guide and governance rules.
2. Read [the skills index](skills.md).
3. Read [the work plan](PLAN.md).
4. Read [the architecture plan](../STUDIO-PLAN.md).
5. Inspect the affected module, public exports, tests, and host references before editing.

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

Keep the architecture in `STUDIO-PLAN.md` and the execution sequence in `agent/PLAN.md`.
Update status only when implementation and verification support it.
Do not create placeholder modules, fake deployment states, or fabricated content.
Apply repository verification gates appropriate to the actual change.
Report missing contracts, migration prerequisites, and skipped checks explicitly.

These files guide development agents. They are not runtime business-chat instructions and are not loaded by the API.
