# Sites Multi-Site Operations

This document defines how Sites runs many client sites in local development, staging, and production.

## Operating model

Use one Sites control plane for many public client sites. Store each client as a published content record with a unique slug. Render client-specific pages from `apps/sites/web/src/Clients/<slug>/` and reuse shared code from `src/shared/` and `src/templates/`.

Do not run one API and web process for every client by default. A shared control plane keeps content storage, SEO files, analytics, health checks, backups, and releases in one place.

Run a separate Sites instance only when a client needs separate data, credentials, release timing, domain ownership, or failure isolation.

Use `Sites Studio` as the organizer brand. Keep the brand name in `VITE_SITES_BRAND_NAME` so a domain-specific label does not require a code change.

## Standalone public delivery

The organizer and public delivery are separate runtime concerns. Sites Studio
stays on `6261`; each public client runs a minimal web host with a fixed client
slug and reads published records from the shared Sites API on `6260`.

| Client | Port | Command |
| --- | ---: | --- |
| Codexsun | 7001 | `npm run dev:site:codexsun` |
| DevXcrew | 7002 | `npm run dev:site:devxcrew` |
| Logicx | 7003 | `npm run dev:site:logicx` |
| Skilloopz | 7004 | `npm run dev:site:skilloopz` |

The standalone runtime serves `/`, `/about`, `/services`, `/work`, and
`/contact` for the selected client and does not expose the authenticated
organizer. Production maps each runtime build to its own domain, such as
`https://codexsun.com`, while preserving the Sites Studio content contract.

## Environment layout

Use three environments:

1. Local: developer-only data and local client previews.
2. Staging: production-like data shape with non-production credentials.
3. Production: public domains, production data, backups, and monitoring.

Keep environment files outside source control. Use the root `.env` for shared runtime values and `apps/sites/api/.app.env` or `apps/sites/web/.app.env` for app-owned values.

Keep these values separate for every environment:

- API and web origins.
- Published ports or ingress routes.
- SQLite data volume.
- Backup volume.
- Docker Compose project name.
- Image tag.
- Google Analytics measurement ID.
- Public site origin.
- Search Console and DNS values.

## Local development

Use the existing root scripts for the default instance:

1. Start the API with `npm run dev:sites-api`.
2. Start the web host with `npm run dev:sites-web`.
3. Open `http://127.0.0.1:6261/clients`.
4. Select a client at `/clients/<slug>`.
5. Use `/clients/test?client=<slug>` for a focused client preview.

Use the default local ports for one active instance:

- Web: `6261`.
- API: `6260`.

For parallel instances, give each instance its own Compose project, published port pair, data volume, backup volume, and environment file. Keep the internal API port at `6260` and change only the host ports.

Example local instance matrix:

| Instance       | Compose project | Web port | API port | Data volume         |
| -------------- | --------------- | -------: | -------: | ------------------- |
| Default        | `sites`         |   `6261` |   `6260` | `sites-data`        |
| Review         | `sites-review`  |   `6361` |   `6360` | `sites-review-data` |
| Client preview | `sites-client`  |   `6461` |   `6460` | `sites-client-data` |

Do not point two active instances at the same SQLite volume. This can corrupt data or mix client content between tests.

## Production layout

Run one production Sites instance per data boundary. The instance contains:

- One web container.
- One API container.
- One persistent SQLite data volume.
- One backup volume or backup target.
- One reverse proxy or ingress route.
- One monitoring definition.

Route all client domains to the web host only after domain mapping exists in the content model. Keep `/clients/<slug>` as the stable internal route even when a custom domain points to the client site.

Add a domain mapping record before custom-domain support:

- `client_slug`.
- `hostname`.
- `environment`.
- `published`.
- `canonical_origin`.
- `verification_status`.

Use the client slug as the source of truth. Treat the hostname as a published alias.

## Monitoring model

Monitor the control plane and every public client route.

### Service checks

1. Check `GET /api/v1/sites/health` every minute.
2. Check `GET /` through the public web origin.
3. Check the web container health check.
4. Check the API container health check.
5. Check container restart counts.
6. Check disk space for the data and backup volumes.

### Client checks

For each published client, check:

1. `GET /clients/<slug>` returns a successful page.
2. The expected page title appears.
3. The expected canonical URL appears.
4. The page includes one H1.
5. Contact and social links use valid schemes.
6. Required assets return successful responses.
7. The route appears in `sitemap.xml`.

### Data checks

Track these values:

- Published client count.
- Unpublished client count.
- Latest content update time.
- SQLite file size.
- Last successful backup time.
- Last successful restore test time.
- API error count.
- Public route error count.
- Build and deployment result.

Alert when the health endpoint fails, a public route returns an error, backups become stale, disk space falls below the limit, or a deployment changes the published client count unexpectedly.

## Release order

Use this order for every release:

1. Run web typecheck and lint.
2. Run API typecheck and tests.
3. Build the web and API artifacts.
4. Run the content migration or preparation step.
5. Create a database backup.
6. Start the new containers.
7. Wait for API and web health checks.
8. Check every published client route.
9. Check `sitemap.xml`, `robots.txt`, `ai.txt`, and `llms.txt`.
10. Record the release tag and verification result.

Use `apps/sites/.container/sites-update.sh` for the current container update flow. Use `apps/sites/.container/sites-verify.sh` after startup and after a restart.

## Failure handling

If the API fails, keep the previous web release available and restore the API from the previous image tag. If the web build fails, do not replace the running web container. If content data is damaged, stop writers, restore the latest verified backup, and run the route checks again.

Keep local, staging, and production data volumes separate. Never use the production volume for local testing.

## Ownership

Use these ownership boundaries:

- `apps/sites/web/src/Clients/`: client-specific page composition.
- `apps/sites/web/src/shared/`: shared portal, SEO, analytics, legal, and data helpers.
- `apps/sites/web/src/templates/`: reusable page templates and sections.
- `apps/sites/api/src/modules/content/`: content storage and public content contracts.
- `apps/sites/.container/`: container lifecycle, backup, update, and verification.
- `apps/sites/agent/`: plan, tasks, operational notes, and verification records.

## Next operations tasks

1. Add a published client route check to the verification script.
2. Add a route manifest that lists each client and its public paths.
3. Add custom-domain mapping to the content model.
4. Add structured monitoring output for health and route checks.
5. Add a backup age check and restore test record.
6. Add staging environment files without production values.
7. Add a rollback record to each production release.
