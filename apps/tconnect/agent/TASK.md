# TConnect tasks

## Scope

Create a buyer and seller portal with multi-industry company discovery, association branding, member profiles, and community sharing.
Use fictional Tirupur sample records. Keep backend business rules in TConnect and host authenticated operations through Platform.

## Acceptance

- [x] Separate public portal package and development port.
- [x] Company search, industry filters, role filters, and profile pages.
- [x] Association pages, branded identities, and searchable member businesses.
- [x] Community knowledge, events, announcements, and opportunities.
- [x] Tenant database migrations, staff permission checks, and transactional audit records.
- [x] Staff publishing forms and buyer enquiry review.
- [x] Record final verification evidence after checks and live browser review.

Source presence does not prove live operation. Record only executed checks below.

## Verification, 17-10-2026

- TConnect API and web typechecks, lint, and production builds passed.
- Platform API and web typechecks, lint, and production builds passed.
- TConnect and Platform module boundaries passed. The boundary regression test passed.
- Four TConnect tests passed for consent, strict input fields, safe branding, authorization order, and denied staff routes.
- Component documentation checks and both documentation tests passed. Dependency layout and lockstep versions passed.
- Scoped diff whitespace checks passed. The whole-tree check found existing trailing whitespace in unrelated apps.
- Applied the TConnect migration to the configured development tenant and reran deterministic seeds without duplicates.
- Public feeds returned eight companies, three associations, and three community posts.
- Browser checks confirmed the homepage at desktop, 390-pixel mobile, and 320-pixel narrow mobile widths without horizontal overflow or clipped headings.
- Search for cotton returned three businesses. The knitwear association page returned its three member companies.
- A browser enquiry returned reference `bd051cd8` and appeared in the authenticated Platform enquiry list.
- The enquiry changed from New to Contacted and Closed through the staff UI. The fictional verification record remains retained.
- The authenticated staff workspace loaded all eight company records inside the existing Platform shell.
- Local portal: port 7040. Shared Platform API: port 7010. Platform web: port 7020.
- Production builds retain bundle-size warnings. Public internet deployment, native desktop/mobile builds, load testing, and independent tenant-database isolation E2E remain unverified.

## Seller and member self-service, 17-10-2026

- [x] Add public seller and association-member registration without existing-account takeover.
- [x] Reuse Platform password hashing, cookie sessions, login, logout, and Corporate ID verification.
- [x] Provide a dedicated member desk inside the Platform shell.
- [x] Add own-company branding, raster logos, profiles, product management, and private buyer enquiry access.
- [x] Add pending membership requests and staff approval, rejection, suspension, and restoration.
- [x] Add additive migrations and the fixed restricted portal role.
- [x] Pass focused ownership tests and two-account local API E2E checks.
- [x] Record final browser and production-build evidence.

Nine focused tests passed. Local API E2E checks verified registration, cookie login, strict Corporate ID and role inputs,
one-company ownership, logo persistence, public products, cross-company write rejection, private enquiries, membership approval,
and suspension of an existing session. Test companies and accounts remain inactive fixtures.

### Final self-service verification

- Applied `tconnect.members.v2` to the local development tenant and seeded the restricted Platform role.
- Nine focused TConnect tests passed. The two-account E2E suite passed again after transaction-level ownership checks were added.
- E2E also confirmed that portal accounts cannot list Platform users or manage Platform roles.
- TConnect API/web and Platform API/web typechecks, lint, and production builds passed.
- TConnect/Platform boundaries, both boundary tests, component documentation checks, both component documentation tests,
  dependency layout checks, version checks, and scoped diff whitespace checks passed.
- Browser registration created a new draft company and showed a working local Platform login link.
- The member login did not use development administrator auto-login. It opened the dedicated member desk with the new identity.
- A profile tagline saved through the browser form and persisted when returning to the profile. The API update returned HTTP 200.
- A product created through the browser form appeared in the owned catalog with its success message. The API create returned HTTP 200.
- Registration and mobile navigation had no horizontal overflow at 320 and 390 pixels. Desktop member layout used the existing Platform shell.
- The browser fixture account was suspended after verification. Its company remains a draft. API E2E fixtures remain inactive.
- The browser connection closed after these checks. Final browser reinspection was unavailable, but the successful requests and displayed saved product were observed beforehand.
- Build bundle-size warnings remain. Email ownership verification, public internet deployment, native packaging, load testing,
  and a separate tenant-database isolation E2E run remain unverified or outside this change.

- Final local health check returned HTTP 200 for public registration, Platform member login, and the TConnect registration API.

## Buyer sourcing extension, 17-10-2026

- Added separate buyer registration, restricted Platform login, and `/app/tconnect/buyer`.
- Added buyer-owned draft, open and closed requirements; sellers can browse open requirements.
- Added published catalog search across product, category, seller, industry and city.
- Added authenticated enquiries with server-derived contact identity, optional owned requirement links,
  recipient-product validation, private sent history, and seller status tracking.
- Installed `tconnect.buyers.v3` and fixed buyer role grants on the resolved local development tenant.
- Added eight fictional product/service samples that match the existing Tirupur company profiles.
- All 14 focused source tests passed. Buyer and member live E2E suites passed after the final implementation.
- Live E2E checked two buyers, a seller, and staff: exact Corporate ID, cookie login, denied privileges,
  cross-buyer requirement writes, private sent enquiries, seller inbox receipt, status updates,
  and draft/open/closed requirement visibility. Seller fixtures finish inactive; test requirements finish closed.
- Browser checks confirmed buyer login opens the buyer desk; posting a requirement, product search,
  sending an enquiry, and viewing sent enquiries all completed through their forms.
- Public buyer registration had no horizontal overflow at 1440, 390 and 320 pixels.
- TConnect API/web builds and lint, Platform API/web builds and lint, Platform typechecks, shared UI lint,
  dependency layout, version, component documentation and module boundary checks passed.
- TConnect source is excluded from dependency prebundling and aliased in Platform development;
  shared Tailwind scanning includes its workspace components. This fixes the stale export preview failure.
- Existing bundle-size and dynamic-import warnings remain. Production deployment, email ownership verification,
  email delivery, load testing, native packaging, and a separate tenant-database isolation E2E were not verified.

## Seller replies and quotations, 17-10-2026

- Added separate Conversation, Message, and Quotation leaves with matching frontend owners.
- Added private requirement and enquiry threads, immutable messages, and server-derived sender identity.
- Added seller quotation forms with quantity, unit price, tax, shipping, delivery, validity, payment terms, and notes.
- Added exact minor-unit calculation, immutable sent prices, withdrawal history, and buyer comparison of up to four offers.
- Added Reply / Quote actions, requirement response views, enquiry conversation actions, and desk navigation.
- Applied `tconnect.negotiation.v4` and fixed conversation, message, and quotation participant grants to the resolved local tenant.
- Previous ledger names and checksums remain intact. The three new tables use their leaf-owned migrations in dependency order.
- All 19 source tests passed after the ownership audit.
- Two-seller and two-buyer live E2E passed for direct requirement quotes, enquiry quotes, totals, competing-offer privacy,
  sender identity, foreign-thread rejection, closed-source quote blocking, withdrawal history, and suspension.
- Browser verification passed after the final ownership split: seller quote and reply forms, buyer comparison,
  requirement response navigation, buyer reply, and seller receipt through the separate signed sessions.
- Desktop comparison and conversation screenshots were inspected. Mobile comparison had no viewport overflow at 390 pixels.
- Test sources finish closed. Test quotations remain retained as withdrawn. Seller fixtures finish inactive.
- TConnect API/web and Platform API/web builds and lint passed. All affected source typechecks passed.
- App boundary checks, both boundary tests, component documentation checks and tests, dependency layout, and versions passed.
- The browser connector was unavailable. The browser E2E used a fresh local headless Chrome and the real forms and APIs.
- Existing build bundle-size warnings remain. Production migration, public hosting, a separate tenant-database isolation test,
  email notifications, attachments, order acceptance, payment, load testing, and native packaging were not verified or added.

- Final regression run: buyer access, member access, and negotiation E2E suites all passed after the shared test transport update.
- The shared test transport retries only connection refusal during local server restarts. It does not replay ambiguous failed writes.
- Final scoped Prettier check and TConnect API/web lint passed. Comparison dates use the shared calendar formatter.

## Platform-style development preflight, 17-10-2026

- Both root `dev:tconnect` and workspace `dev` now invoke the shared `tconnect-web` preflight.
- Preflight checks port ownership, uses port 7040 by default, waits for Platform API, and preserves configured port policy.
- Added TConnect to the shared 262,144-byte development request-header setting.
- Reproduced HTTP 431 on the previous raw Vite listener with a synthetic 32 KB cookie.
- Verified HTTP 200 for the portal and its registration API proxy with the same cookie after both root and workspace launches.
- All 14 development startup, watcher, shutdown, and port-ownership tests passed.
- The new takeover safety check confirms that an unrelated HTTP listener remains running.
- Moved the workspace-local generated npm cache into root dist without deleting its contents.
- Dependency layout and version checks passed. No application data or user cookies were removed.
