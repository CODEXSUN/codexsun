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
