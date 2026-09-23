# HIMSX

This application owns its product modules and composition.

## Docker Deployment

HIMSX has a Windows-first Docker deployment in `.container/`. It builds the
API and web hosts from this repository, prepares the SQLite identity schema
before production startup, and serves the web host through Nginx.

The deployment reads the ignored root `.env` and `api/.app.env` files at
runtime. It stores HIMSX data in the `himsx-data` Docker volume and backups in
`himsx-backups`. Environment files never enter an image layer.

Run these commands from a POSIX shell at the repository root:

```sh
sh apps/himsx/.container/himsx-setup.sh
sh apps/himsx/.container/himsx-update.sh
sh apps/himsx/.container/himsx-verify.sh
sh apps/himsx/.container/himsx-backup.sh
```

`himsx-update.sh` stops writers, backs up data, builds current source,
prepares the identity schema, and restarts the stack. Pass `--no-cache` for a
clean image build. Data removal requires an interactive `DROP HIMSX`
confirmation or the explicit `HIMSX_CONFIRM_DROP=yes` environment value:

```sh
sh apps/himsx/.container/himsx-drop.sh
```

The default endpoints are `http://127.0.0.1:6241` and
`http://127.0.0.1:6240/api/v1/himsx/health`. Override published ports with
`HIMSX_WEB_PUBLISHED_PORT` and `HIMSX_API_PUBLISHED_PORT`.
