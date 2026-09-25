# Sites

This application owns its product modules and composition.

## Docker Deployment

Sites has a Windows-first Docker deployment in `.container/`. It builds the
API and web hosts from this repository, prepares the SQLite identity schema
before production startup, and serves the web host through Nginx.

The deployment reads the ignored root `.env` and `api/.app.env` files at
runtime. It stores Sites data in the `sites-data` Docker volume and backups in
`sites-backups`. Environment files never enter an image layer.

Run these commands from a POSIX shell at the repository root:

```sh
sh apps/sites/.container/sites-setup.sh
sh apps/sites/.container/sites-update.sh
sh apps/sites/.container/sites-verify.sh
sh apps/sites/.container/sites-backup.sh
```

`sites-update.sh` stops writers, backs up data, builds current source,
prepares the identity schema, and restarts the stack. Pass `--no-cache` for a
clean image build. Data removal requires an interactive `DROP SITES`
confirmation or the explicit `SITES_CONFIRM_DROP=yes` environment value:

```sh
sh apps/sites/.container/sites-drop.sh
```

The default endpoints are `http://127.0.0.1:6261` and
`http://127.0.0.1:6260/api/v1/sites/health`. Override published ports with
`SITES_WEB_PUBLISHED_PORT` and `SITES_API_PUBLISHED_PORT`.

## Public Client Portal

The web host exposes a public, data-driven client portal under `/clients`.
Each client page is composed from shared portal sections and typed content
records stored in the Sites SQLite database. The web host reads published
content through the public API. Only the editor-owned server side can change
these records; clients have no page-editing route.

Current public pages are:

- `/clients/codexsun`
- `/clients/devxcrew`
- `/clients/logicx`
- `/clients/skilloopz`

The authenticated Sites workspace remains available at `/`. Public client
pages do not require an identity session.

For local development, Sites Studio auto-login is enabled through the ignored
`apps/sites/api/.app.env` file. Keep `AUTO_LOGIN=0` in staging and production;
auto-login must never be enabled on a public deployment.

The read-only public content routes are `/api/v1/sites/public/clients` and
`/api/v1/sites/public/clients/:slug`. Content is seeded by the API module and
the deployment preparation command creates the content table before startup.
Contact, location, social, footer, and copyright values are read from the same
editor-owned record and render across the client page, contact page, and footer.

## Standalone Client Hosts

Sites Studio remains the control plane at `http://127.0.0.1:6261`. Each client
can run as its own minimal host while reading published content from the shared
Sites API at `http://127.0.0.1:6260`.

| Client | Local host | Start command |
| --- | --- | --- |
| Codexsun | `http://127.0.0.1:7001` | `npm run dev:site:codexsun` |
| DevXcrew | `http://127.0.0.1:7002` | `npm run dev:site:devxcrew` |
| Logicx Info Tech | `http://127.0.0.1:7003` | `npm run dev:site:logicx` |
| Skilloopz | `http://127.0.0.1:7004` | `npm run dev:site:skilloopz` |

Each host sets a fixed client slug and serves that client from `/`. Production
maps each build to its own domain while retaining the Sites Studio content
contract.

Use `apps/sites/agent/operations.md` for local parallel instances, staging and
production separation, monitoring checks, release order, and rollback rules.

## Search and analytics

The web build emits `robots.txt`, `sitemap.xml`, `ai.txt`, and `llms.txt` from
the configured `VITE_SITES_PUBLIC_URL`. Page components also set canonical,
Open Graph, Twitter, and JSON-LD metadata for each client route.

Set `VITE_GA_MEASUREMENT_ID` to enable Google Analytics. Analytics is not
loaded until a visitor grants consent, and the integration requests anonymized
IP handling. Set `VITE_SITES_CONTACT_EMAIL` when a mail-based contact action
is wanted. Keep these deployment values in configuration, not source.
