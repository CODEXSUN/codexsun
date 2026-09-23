# CRM

This application owns its product modules and composition.

## Docker Deployment

CRM has a Windows-first Docker deployment in `.container/`. It builds the API
and web hosts from this repository, prepares the SQLite identity schema before
production startup, and serves the web host through Nginx.

The deployment reads the ignored root `.env` and `api/.app.env` files at
runtime. It stores CRM data in the `crm-data` Docker volume and backups in
`crm-backups`. Environment files never enter an image layer.

Run these commands from a POSIX shell at the repository root:

```sh
sh apps/crm/.container/crm-setup.sh
sh apps/crm/.container/crm-update.sh
sh apps/crm/.container/crm-verify.sh
sh apps/crm/.container/crm-backup.sh
```

`crm-update.sh` stops writers, backs up data, builds current source, prepares
the identity schema, and restarts the stack. Pass `--no-cache` for a clean
image build. Data removal requires an interactive `DROP CRM` confirmation or
the explicit `CRM_CONFIRM_DROP=yes` environment value:

```sh
sh apps/crm/.container/crm-drop.sh
```

The default endpoints are `http://127.0.0.1:6231` and
`http://127.0.0.1:6230/api/v1/crm/health`. Override published ports with
`CRM_WEB_PUBLISHED_PORT` and `CRM_API_PUBLISHED_PORT`.
