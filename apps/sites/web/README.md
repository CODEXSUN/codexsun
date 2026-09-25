# Sites Web

The web host composes the shared MDI workspace and the public client portal.

## Public client pages

The `/clients` route is intentionally separate from the authenticated CMS
workspace. It uses reusable portal components and typed client content fetched
from the read-only public Sites API. Clients do not receive page-editing
controls.

Standalone delivery sets `VITE_SITES_CLIENT_SLUG` and renders one client at the
site root. The root scripts expose Codexsun, DevXcrew, Logicx, and Skilloopz on
ports 7001, 7002, 7003, and 7004 while proxying published content from the
Sites Studio API. This build does not expose the organizer UI.

- `/clients/codexsun`
- `/clients/devxcrew`
- `/clients/skilloopz`
- `/clients/logicx`

For local visual testing, set `VITE_SITES_TEST_CLIENT_NAME` in `.app.env` to
`codexsun`, `devxcrew`, `skilloopz`, or `logicx`, then open `/clients/test`.
Use `/clients/test?client=logicx` for a one-off override without changing the
environment value.

## SEO and discovery

The Vite build generates route-aware discovery files from
`VITE_SITES_PUBLIC_URL`: `robots.txt`, `sitemap.xml`, `ai.txt`, and
`llms.txt`. React page metadata adds canonical URLs, descriptions, social
preview fields, and JSON-LD. Configure `VITE_GA_MEASUREMENT_ID` to offer
consent-gated Google Analytics without loading the script by default.

Legal pages are available at `/clients/privacy`, `/clients/terms`, and
`/clients/cookies`.
