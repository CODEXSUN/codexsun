# Sites Client SEO and Launch Notes

This note records the public client routes, SEO requirements, verification steps, and the repeatable setup for future clients.

The phased plan is in [plan.md](./plan.md). The numbered task list is in [task.md](./task.md). The multi-site operations model is in [operations.md](./operations.md).

## Current Skilloopz pages

The public Skilloopz site uses these routes:

- `/clients/skilloopz`
- `/clients/skilloopz/learning-path`
- `/clients/skilloopz/placement-path`
- `/clients/skilloopz/about`
- `/clients/skilloopz/contact`

The home page uses this SEO title:

`Skilloopz | IT Training & Placement Assistance`

The home page uses this description:

`Skilloopz provides industry-focused IT training, mentor-led learning and placement assistance for students and graduates.`

The home page uses one H1:

`Build Your Skills. Prepare for Your Career.`

The supporting copy is:

`Industry-focused IT training with mentor-led learning, practical projects and placement assistance.`

## Discovery files

The Vite build creates these files at the public site root:

- `/sitemap.xml`
- `/robots.txt`
- `/ai.txt`
- `/llms.txt`

The sitemap includes the portal, each public client route, and the legal pages. The robots file allows public client pages, blocks `/clients/test`, and blocks API routes.

The test route is not included in the sitemap. It is not intended for search indexing.

## TXT verification record

Google Search Console must provide the real verification token for the site owner. Add the supplied value at the domain DNS provider as a TXT record.

```text
Host: @
Type: TXT
Value: google-site-verification=<TOKEN_FROM_GOOGLE_SEARCH_CONSOLE>
```

Do not commit the real token to this repository. Record the verification date and domain in the deployment record after the owner confirms DNS propagation.

## Submit the sitemap to Google

The sitemap URL is:

`https://<public-site-domain>/sitemap.xml`

After domain verification:

1. Open Google Search Console.
2. Select the verified domain property.
3. Open Sitemaps.
4. Enter `sitemap.xml`.
5. Submit the sitemap.
6. Confirm that the status is Success.

This repository contains the sitemap and robots file. Google submission remains pending until a domain owner completes Search Console access.

## Upcoming client checklist

For each new client, add the following items:

1. Add a client record to `apps/sites/api/src/modules/content/content-store.ts`.
2. Add the matching fallback record to `apps/sites/web/src/shared/client-data.ts`.
3. Add the client-specific composition under `apps/sites/web/src/Clients/<slug>/`.
4. Keep reusable sections and templates under `apps/sites/web/src/shared/` or `apps/sites/web/src/templates/`.
5. Add the client slug and public routes to `apps/sites/web/vite.config.ts`.
6. Add contact, location, social links, footer text, SEO fields, and legal links.
7. Add one clear home page H1 and one focused meta description.
8. Add the client routes to the sitemap.
9. Test the normal route and `/clients/test?client=<slug>`.
10. Run the web build, API tests, and browser verification before publishing.

## Current client inventory

- Codexsun: `/clients/codexsun`
- DevXcrew: `/clients/devxcrew`
- Logicx Info Tech: `/clients/logicx`
- Skilloopz: `/clients/skilloopz`
