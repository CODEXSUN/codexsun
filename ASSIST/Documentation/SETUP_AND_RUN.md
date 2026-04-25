# Setup And Run

## Prerequisites

1. Node.js 22 or later
2. npm 10 or later
3. MariaDB for the current primary transactional database path
4. optional PostgreSQL for analytics work

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
3. `APP_DOMAIN`
4. `APP_HTTP_PORT`
5. `APP_HTTPS_PORT`
6. `FRONTEND_HOST`
7. `FRONTEND_DOMAIN`
8. `FRONTEND_HTTP_PORT`
9. `FRONTEND_HTTPS_PORT`
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
21. `DB_SSL`
22. `ANALYTICS_DB_ENABLED`
23. `ANALYTICS_DB_HOST`
24. `ANALYTICS_DB_PORT`
25. `ANALYTICS_DB_USER`
26. `ANALYTICS_DB_PASSWORD`
27. `ANALYTICS_DB_NAME`
28. `ANALYTICS_DB_SSL`
29. `JWT_SECRET`
30. `JWT_EXPIRES_IN_SECONDS`
31. `AUTH_OTP_DEBUG`
32. `AUTH_OTP_EXPIRY_MINUTES`
33. `SUPER_ADMIN_EMAILS`
34. `SMTP_HOST`
35. `SMTP_PORT`
36. `SMTP_SECURE`
37. `SMTP_USER`
38. `SMTP_PASS`
39. `SMTP_FROM_EMAIL`
40. `SMTP_FROM_NAME`
41. `CXAPP_MEDIA_CXMEDIA_ENABLED`
42. `CXAPP_MEDIA_CXMEDIA_BASE_URL`
43. `CXAPP_MEDIA_CXMEDIA_EMAIL`
44. `CXAPP_MEDIA_CXMEDIA_PASSWORD`
45. `CXAPP_MEDIA_CXMEDIA_SYNC_SECRET`
46. `CXAPP_MEDIA_CXMEDIA_HANDOFF_SECRET`

## Main Commands

```bash
npm run dev
npm run server:dev
npm run cxmedia:dev
npm run mobile:dev:full
npm run mobile:dev:full:tunnel
npm run mobile:typecheck
npm run typecheck
npm run cxmedia:typecheck
npm run lint
npm run test
npm run db:prepare
npm run db:fresh
npm run db:migrate
npm run db:seed
npm run db:status
npm run build
npm run cxmedia:build
npm run start
npm run cxmedia:start
npm run github
npm run github:now
``` 

## Runtime Endpoints

Current useful host endpoints:

1. `/` serves the built web shell or the fallback welcome page
2. `/health` exposes host and runtime health data
3. `/internal/apps` exposes the internal suite registry
4. `/internal/baseline` exposes the machine-readable workspace and host baseline
5. `/api/apps` exposes a trimmed external app registry surface
6. `/api/v1/auth/*` exposes login, registration OTP, password reset, account recovery, session lookup, and logout
7. `/internal/v1/cxapp/auth/*` exposes protected auth admin routes
8. `/internal/v1/cxapp/mailbox/*` exposes protected mailbox template and message routes
9. `/internal/v1/cxapp/bootstrap`, `/internal/v1/cxapp/company*`, and `/internal/v1/cxapp/runtime-settings` expose suite bootstrap, company, and runtime-setting surfaces
10. `/internal/v1/core/*` exposes shared master-data routes
11. `/internal/v1/billing/*` exposes protected accounting, voucher, reporting, and control routes
12. `/internal/v1/ecommerce/*` exposes protected storefront admin, analytics, support, and payment operations routes
13. `/internal/v1/demo/*` exposes demo summary and installer routes
14. `/internal/v1/crm/*` exposes CRM lead and interaction routes
15. `/internal/v1/frappe/*` exposes protected ERPNext connector settings, todo, item, sync-log, and purchase receipt routes

## Notes

1. `npm run dev` starts Vite plus the native Node server wrapper for `cxapp`
2. `npm run start` runs the compiled native Node host from `build/app/cxapp/server`
3. `apps/api` stays route-only and split into `src/internal` and `src/external`
4. every framework-composed suite app carries its own `src`, `web`, `database`, `helper`, and `shared` structure
5. the shared `ui` layer powers the dashboard shell, auth layouts, and design-system docs surface
6. framework server startup now prepares the registered app-owned migrations and seeders before serving routes
7. use `npm run db:prepare` to run the same migration and seeder workflow without starting the server
8. use `npm run db:fresh` to drop the current application tables and views in the configured database, then rerun the registered migrations and seeders for a clean seeded baseline
9. `apps/cxapp/web` now uses the live auth API for login, request access, password reset, recovery, and logout instead of placeholder-only local auth state
10. when `AUTH_OTP_DEBUG=true`, OTP responses include a `debugOtp` value so local end-to-end auth setup can be tested without a live mail provider
11. SMTP delivery is enabled only when `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM_EMAIL` are configured; otherwise mailbox sends fall back to stored debug records for local development
12. the app-owned `frappe` connector baseline is database-backed and available in the shared desk under `/dashboard/apps/frappe`
13. the app-owned `crm` workspace is available in the shared desk under `/dashboard/apps/crm`
14. production Docker deployment should use a prebuilt image plus persistent runtime `.env`, persistent media storage, and external MariaDB instead of runtime git sync and live server rebuilds
15. `apps/mobile` is run through its Expo scripts and is not part of the framework-composed web build output
16. `cxmedia` is a separate root-level service; run it with `npm run cxmedia:dev`, build it with `npm run cxmedia:build`, and configure its own `cxmedia/.env` for Garage or other S3-compatible storage
17. the framework media manager in `cxapp` can optionally store media binaries in `cxmedia` while keeping folders and metadata in the suite database
18. to enable that bridge, set `CXAPP_MEDIA_CXMEDIA_ENABLED=true` plus `CXAPP_MEDIA_CXMEDIA_BASE_URL`, `CXAPP_MEDIA_CXMEDIA_EMAIL`, and `CXAPP_MEDIA_CXMEDIA_PASSWORD` in the suite `.env`
19. to let `cxapp` create and maintain matching `cxmedia` users automatically, set the same shared secret in `CXAPP_MEDIA_CXMEDIA_SYNC_SECRET` and `CXMEDIA_SYNC_SECRET`
20. to let signed-in suite users open standalone `cxmedia` without a second login, set the same shared secret in `CXAPP_MEDIA_CXMEDIA_HANDOFF_SECRET` and `CXMEDIA_HANDOFF_SECRET`
21. when the bridge, sync, and handoff are enabled, framework media still uses the existing `/internal/v1/framework/media*` routes and `cxapp` media browser UI, but uploaded file bytes are stored through `cxmedia`, regular `cxapp` users can be provisioned into standalone `cxmedia` without manual user creation, and the media manager can open `cxmedia` with trusted sign-in
