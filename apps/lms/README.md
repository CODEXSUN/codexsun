# LMS

This application owns its product modules and composition.

## Docker Deployment

LMS has a Windows-first Docker deployment in `.container/`. It builds the API
and web hosts from this repository, prepares the SQLite identity schema before
production startup, and serves the web host through Nginx.

The deployment reads the ignored root `.env` and `api/.app.env` files at
runtime. It stores LMS data in the `lms-data` Docker volume and backups in
`lms-backups`. Environment files never enter an image layer.

Run these commands from a POSIX shell at the repository root:

```sh
sh apps/lms/.container/lms-setup.sh
sh apps/lms/.container/lms-update.sh
sh apps/lms/.container/lms-verify.sh
sh apps/lms/.container/lms-backup.sh
```

`lms-update.sh` stops writers, backs up data, builds current source, prepares
the identity schema, and restarts the stack. Pass `--no-cache` for a clean
image build. Data removal requires an interactive `DROP LMS` confirmation or
the explicit `LMS_CONFIRM_DROP=yes` environment value:

```sh
sh apps/lms/.container/lms-drop.sh
```

The default endpoints are `http://127.0.0.1:6251` and
`http://127.0.0.1:6250/api/v1/lms/health`. Override published ports with
`LMS_WEB_PUBLISHED_PORT` and `LMS_API_PUBLISHED_PORT`.
