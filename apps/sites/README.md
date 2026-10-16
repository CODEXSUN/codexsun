# Sites — Site Studio

Site Studio manages client portfolio websites, public profiles, page sections, blogs, and local previews.
All application code belongs under `apps/sites`. Platform supplies identity, tenant selection, activation, and shared infrastructure through public contracts.

## Source and ownership

| Folder    | Purpose                                                                              |
| --------- | ------------------------------------------------------------------------------------ |
| `api`     | Site registry, page drafts, blog posts, publications, activity, and local startup    |
| `web`     | Client cards, creation form, client workspaces, editors, and typed API gateways      |
| `clients` | LogicX, Ramu Tex, standard portfolio template, and public content readers            |
| `agent`   | [TASK.md](agent/TASK.md), [PLAN.md](agent/PLAN.md), and [SKILLS.md](agent/SKILLS.md) |

This README is the only Markdown file outside `agent` in this application.
The page and blog child leaves own their API and Web implementations. The site module composes their public contracts.
The obsolete source-only Studio inventory has been removed.

## Client workspaces

- Manage opens the selected client's profile, Pages, and Blogs editors.
- Site settings changes the registry name, domain, description, template, and local port.
- Add Portfolio opens the creation form and proposes the next available registered port.
- Creating a portfolio saves its site and initial website draft in one tenant database transaction.
- New clients use `portfolio-standard`. They start with empty service, contact, and blog records where details are unknown.
- LogicX uses `portfolio-logicx` on port 7131. Ramu Tex uses `portfolio-ramutex` on port 7132.
- Start launches the selected template on its saved port. Open visits that local website.

The current public routes are `/`, `/about`, `/services`, `/contact`, `/blogs`, and `/blogs/:slug`.
Home, About, Services, and Contact share one typed website draft and one publication revision.
Pages provides section editors and links to the five standard public pages. Custom page creation remains planned.
Blog posts have separate drafts, slugs, publication revisions, withdrawal, and deletion controls.
Public page counts come from saved publication state, rather than the legacy seeded count column.

Profile fields include business name, brand, domain, tagline, location, email addresses, phones, address, and GSTIN.
Section fields include SEO, hero, focus areas, company details, process stages, services, approach, equipment, contact copy, and footer.
The standard template does not invent customers, testimonials, project history, or certification claims.
Ramu Tex's approved starting content and downloadable brochure come from the supplied company profile.
Layout, navigation structure, artwork, and PDF assets remain code-owned.

## Authoring and publication

1. Open a client through Manage.
2. Edit Client details, Pages, or Blogs.
3. Select Save draft to persist edits without changing the public website.
4. Select Publish page to publish the saved profile and website sections.
5. Publish blog posts separately. Unpublish a post before deleting it.
6. Select Start, then Open. Public clients refresh every 30 seconds and on window focus.

MariaDB stores drafts, published snapshots, revisions, and transactional activity in the authenticated tenant database.
Tables are `sites_portfolio_sites`, `sites_pages`, `sites_page_activity`, `sites_blog_posts`, and `sites_blog_activity`.
Child rows use the saved site ID. Separate tenants use separate databases.
Revision checks reject stale saves and publication. Published content excludes later draft changes.
Site identity and template changes are blocked after the site owns CMS content. Local ports cannot reuse another client's registered port.
Suspension blocks new publication and public local reads. It does not prove a remote site is disabled.

The existing Sites migration entry point creates the CMS tables when missing.
Run tenant migrations, Sites seeds, and permission seeds for each enabled tenant before using these features.
This continuation needs no new columns. Rerunning seeds adds the missing LogicX draft without replacing saved Ramu Tex content.
The local registered tenant has both workspaces and published starting content. See TASK.md for verification evidence.

## Identity and local delivery

Enable Sites through Platform Plan Access and assign effective tenant permissions.
The desk starts at `/app/sites/overview`. The guide uses `/app/sites/guide`.
Registry creation requires `sites.site.registry.create`. Startup requires `sites.site.runtime.start`.
Page actions require `sites.page.content.view/update/publish`. Blog actions require `sites.blog.post.view/update/publish/delete`.
Seeds preserve disabled grants. The broader legacy registry action audit remains planned.

Start requires a loopback development API with `NODE_ENV=development` and the root Vite dependency.
Checkout discovery walks upward from the module location and API working directory. It supports source and compiled output locations.
The API verifies the client identity endpoint before reporting a running site. It closes owned processes on graceful shutdown.
No client can supply an executable command, tenant database name, or database secret.

`GET /sites/public/:slug` reads a server-bound client publication. Each slug binds through an authenticated Start.
The slug selects an existing public binding. It cannot select a tenant database.
A conflicting tenant or site cannot replace that binding. The reader rechecks activation and site status.
The client proxy at `/__sites-content` targets its own slug and sends no Studio credentials.
Clients reject another site's publication identity. Drafts and activity are never included.
After an API restart, select Start again to restore each local binding.
Named clients retain their bundled approved profile during service outages. New standard clients await their first publication.

Remote deployment, monitoring, SQLite/D1 replication, verified hosting targets, media upload, rich text, and custom page CRUD remain planned.
The initial SQLite identity store exists under `clients/runtime/content`. It is not a content replication service.
Current builds are browser applications. They do not provide prerendered HTML, sitemap export, or production publication delivery.
Contact actions prepare an email draft. They do not send mail or store enquiries on the backend.

## Development and verification

Run commands from the repository root. Use the root dependencies, lockfile, and `dist` directory.

```sh
npm run dev:api
npm run dev:web
npm run dev:sites:logicx
npm run dev:ramutex -w @codexsun/sites-clients
npm run typecheck -w @codexsun/sites-api -w @codexsun/sites-web -w @codexsun/sites-clients
npm run lint -w @codexsun/sites-api -w @codexsun/sites-web -w @codexsun/sites-clients
npm run build -w @codexsun/sites-api -w @codexsun/sites-web -w @codexsun/sites-clients
npm run test:cms -w @codexsun/sites-api
node --import tsx --test apps/sites/api/src/modules/site/site.runtime.test.ts
node --test apps/sites/clients/runtime/content/content-store.test.mjs
node tools/check-module-boundaries.mjs sites
npm run dependencies:check
npm run check:component-docs
npm run test:component-docs
```

For a standard client, set `CODEXSUN_SITES_CLIENT_SLUG` before `npm run build:portfolio -w @codexsun/sites-clients`.
Use `dev:portfolio` for manual development. Set `CODEXSUN_SITES_CLIENT_PORT` or pass `--port` to choose its port.
The authenticated Start action always uses the saved client port.
For MariaDB tests, set `CODEXSUN_SITES_TEST_MARIADB=1` with configured local test credentials.
The test creates and removes only its generated `codexsun_sites_cms_test_<hex>` database.
If the host serves an older optimized workspace bundle, restart the root Web development runner after refreshing its Vite dependency cache.

Public packages are `@codexsun/sites-api`, `@codexsun/sites-web`, and `@codexsun/sites-clients`.
Browser-safe API exports are `./page-contract`, `./page-content`, `./page-defaults`, `./blog-contract`, and `./public-contract`.
Clients export the named LogicX and Ramu Tex surfaces. Web exports the overview, gateway, and site modules.
Report source checks, live database changes, browser verification, and production deployment separately.
