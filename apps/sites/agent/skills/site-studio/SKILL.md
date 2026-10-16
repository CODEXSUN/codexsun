---
name: site-studio
description: Plan, implement, or review Site Studio in apps/sites, including client ownership, CMS content, publication, client delivery, deployment, and monitoring. Use Platform identity through public contracts while keeping Studio implementation inside Sites.
---

# Site Studio

Read the app's [agent guide](../../README.md), [work plan](../../PLAN.md), and [architecture plan](../../../STUDIO-PLAN.md).
Follow repository governance and the closest owning module.

## Preserve ownership

Keep Studio source, tests, migrations, configuration, and deployment handlers under `apps/sites`.
Use API and Web leaf modules for business entities. Keep each role executable and owned by that entity.
Client site templates and delivery adapters belong under `apps/sites/clients`.
Platform supplies identity and generic host capabilities. Existing host composition does not authorize adding Studio business logic there.
Inject public contracts instead of importing private Platform code.

## Preserve data authority

Use the authenticated tenant MariaDB database for authoring and operational records.
Distinguish agency client ownership from Platform tenant identity.
Check tenant activation, action permission, and client/site membership before protected operations.
Use SQLite for ordinary client servers and D1 for Workers. Do not bundle a writable SQLite file into a Worker.
Deliver published projections only. Keep drafts, credentials, and internal records out of public content.

## Choose the next concrete slice

Inspect current routes, storage, UI, seeds, tests, and public composition before proposing changes.
Start with ownership and authorization, then blog authoring, publication, and one content reader.
Do not add a visual builder before the publishing baseline works.
Do not treat an SPA build as prerendered HTML or a registry status as proof of remote deployment.
Use queued, auditable jobs for delivery and deployment. Verify target identity and preserve rollback artifacts.

## Verify the result

Apply the repository's affected-code gates and the current phase acceptance tests.
Include wrong-site, denied-action, stale-revision, retry, and deletion tests when the changed behavior requires them.
Separate unit evidence from live persistence and deployment evidence.
Update the existing plan status without duplicating architecture documents.
Do not claim capabilities, migrations, or deployment behavior that remain planned.
