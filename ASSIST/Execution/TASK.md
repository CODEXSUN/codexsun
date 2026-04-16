# Task

## Active Batch

- [x] `#192` Remove SQLite runtime configuration and verify startup build
  - [x] Phase 1: execution alignment
    - [x] 1.1 scan active SQLite references across runtime, container, and startup configs
    - [x] 1.2 record the SQLite-removal scope in execution docs
  - [x] Phase 2: runtime and container cleanup
    - [x] 2.1 remove SQLite and offline database fields from the server runtime config contract
    - [x] 2.2 remove SQLite defaults from container setup and Playwright startup configs
    - [x] 2.3 update active runtime setting and desk copy so only MariaDB/PostgreSQL are advertised
  - [x] Phase 3: validation
    - [x] 3.1 run typecheck and production build
    - [x] 3.2 run container shell syntax and compose config checks
    - [x] 3.3 run built server startup health check against MariaDB
    - [x] 3.4 repair live `codexsun-app` runtime volume from stale SQLite values to MariaDB and verify container health

- No active execution batch.
