# Planning

## Active Batch

- `#192` Remove SQLite runtime configuration and verify startup build
  - Goal: eliminate SQLite from active runtime and container startup paths so stale SQLite defaults cannot block application boot.
  - Current reality:
    - server config still carries a `sqlite` driver type, `SQLITE_FILE`, and offline SQLite fields even though validation rejects them
    - Playwright startup configs and container setup scripts still write SQLite-related environment values
    - active runtime setting and architecture copy still mention SQLite as a supported or future database mode
  - Implementation plan:
    - narrow `DatabaseDriver` to MariaDB/PostgreSQL and remove SQLite/offline fields from `ServerConfig`
    - keep MariaDB as the default primary database for app and container startup
    - remove SQLite environment writes from setup scripts and Playwright web-server envs
    - revise active docs and desk/runtime-setting copy so operators only see MariaDB/PostgreSQL
  - Validation target:
    - `npm run build` completes and the container config/startup checks no longer find active SQLite defaults
  - Validation completed:
    - `npm run typecheck`
    - `npm run build`
    - container shell syntax checks for `.container/entrypoint.sh`, `.container/bash-sh/setup.sh`, and `.container/bash-sh/setup-local.sh`
    - `docker compose -f .container/clients/codexsun/docker-compose.yml config --quiet`
    - `docker compose -f .container/database/mariadb.yml config --quiet`
    - built server startup health check on `APP_HTTP_PORT=4010` against MariaDB on host port `3307`
    - live container repair: patched `codexsun_codexsun_runtime` database env values to MariaDB, rebuilt `codexsun-app:v1`, recreated `codexsun-app`, and verified `http://127.0.0.1:4000/health`

- No active execution batch.
