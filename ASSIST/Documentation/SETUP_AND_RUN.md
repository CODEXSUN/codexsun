# Setup And Run

## Prerequisites

1. Node.js 22 or later
2. npm 10 or later
3. MariaDB for the current primary transactional database path
4. optional SQLite for offline and desktop work
5. optional PostgreSQL for future analytics work

## Install

```bash
npm install
```

## Active Entry Points

1. frontend entry: `apps/cxapp/web/src/main.tsx`
2. frontend shell: `apps/cxapp/web/src/app-shell.tsx`
3. server entry wrapper: `apps/cxapp/src/server/index.ts`
4. reusable runtime host: `apps/framework/src/server/index.ts`
5. suite composition: `apps/framework/src/application` and `apps/framework/src/di`

## Environment

Runtime config is read from `.env`.

Important keys:

1. `APP_NAME`
2. `APP_HOST`
3. `APP_HTTP_PORT`
4. `APP_HTTPS_PORT`
5. `APP_DOMAIN`
6. `FRONTEND_HOST`
7. `FRONTEND_HTTP_PORT`
8. `FRONTEND_HTTPS_PORT`
9. `FRONTEND_DOMAIN`
10. `WEB_ROOT`
11. `TLS_ENABLED`
12. `TLS_KEY_PATH`
13. `TLS_CERT_PATH`
14. `CLOUDFLARE_ENABLED`
15. `DB_DRIVER`
16. `DB_HOST`
17. `DB_PORT`
18. `DB_USER`
19. `DB_PASSWORD`
20. `DB_NAME`
21. `SQLITE_PATH`
22. `OFFLINE_SUPPORT_ENABLED`
23. `ANALYTICS_DB_HOST`
24. `ANALYTICS_DB_PORT`
25. `ANALYTICS_DB_USER`
26. `ANALYTICS_DB_PASSWORD`
27. `ANALYTICS_DB_NAME`

## Main Commands

```bash
npm run dev
npm run dev:server
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

## Notes

1. `npm run dev` starts Vite plus the native Node server wrapper for `cxapp`.
2. `npm run start` runs the compiled native Node host from `build/app/cxapp/server`.
3. `apps/api` stays route-only and split into `src/internal` and `src/external`.
4. every app now carries its own `src`, `web`, `database`, `helper`, and `shared` structure.
5. dormant app-specific code under `apps/ui/src/features` is not part of the active build until it is moved to the correct app boundary.
