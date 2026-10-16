# QCafe tasks

## Responsibility

Restaurant operations with a local API, POS web application, and Tauri Windows packaging.

Keep local operational data and operator credentials outside disposable build folders. Preserve PIN roles, stock and booking constraints, bill settlement, backups, and print-service boundaries.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected QCafe source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

### Web POS milestone: 16-10-2026

- [x] Web opens through Platform identity without PIN login or an iframe.
- [x] Menu and POS persistence use tenant MariaDB. The old cloud SQLite routes are removed.
- [x] Menu maintenance, takeaway billing, partial/full settlement, bill history, receipt rendering, and transaction audit are implemented.
- [x] Server prices, strict payloads, live permissions, idempotent retries, and payment row locks are enforced.
- [x] Desktop PIN/SQLite regression suite: 9 tests passed. Desktop native behavior was not changed.
- [x] Two POS unit tests and the isolated two-database MariaDB integration test passed.
- [x] Integration assertions cover tenant isolation, denied access, forged prices, retries, concurrent payments, persistence, and inactive menu items.
- [x] Browser check: the existing Platform tenant session opened POS without PIN login. Empty menu and required-field validation were verified without customer transactions.
- [x] QCafe API/web builds, focused lint, module boundaries, dependency layout, and component documentation checks passed.
- [x] Live rerun: the newly installed MariaDB 13.0.2 Windows service runs on port 3306. Platform API and web are available.
- [x] Composed Platform web build passes after Site Studio changed its import to the public client package.
- [x] Full browser sale verified in the new CODEXSUN tenant `f63abb54`, using Platform identity. Bill `POS-000001` (`38962f82`) is paid with one test cash payment `9ab8043c` for 100 paise. No money was transferred.
- [x] After a full browser refresh, the paid bill and receipt remained visible. Direct reads of `codexsun_db` confirmed the bill, one payment, and creation/payment audit entries.
- [x] Print-media layout shows the saved item, total 100 paise, paid 100 paise, zero due, payment reference, and PAID status. Browser media emulation was restored afterward.
- [x] Corrected web bill/payment timestamp conversion using MariaDB epoch values. Regression assertions compare API timestamps with database timestamps. No schema or stored-date alteration was needed.
- [ ] Physical receipt printing remains unverified.
- [ ] Historical SQLite catalogue/bill import, dine-in tables, kitchen, tax configuration, and remaining web modules remain follow-up work.

QCafe migrations and initial permission seeds were applied to the one active QCafe tenant before the service interruption.
Existing SQLite data remains preserved and is not imported automatically. No release version was changed.

The new MariaDB installation initially had no tenants. The user created CODEXSUN again. The earlier tenant `70e84c02` and test bill `77b84b97` were not restored. The current verification belongs to the newly created tenant and bill above. Desktop code, PIN login, and SQLite storage were not changed during this verification.

- `npm run typecheck -w @codexsun/qcafe-web`
- `npm run build -w @codexsun/qcafe-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.

## Shared Platform workspace

- [x] QCafe web uses the same tenant layout as CRM, with company and financial year selection, shared top menu, breadcrumbs, sidebar, settings, and connection status.
- [x] POS at `/app/qcafe` and restaurant menu at `/app/qcafe/menu` use Platform navigation. Switching between them retains the current order.
- [x] Browser verified both pages and the existing paid bill POS-000001. Desktop PIN and SQLite code remain unchanged.

## Desktop-style web POS layout

- [x] Match desktop category cards, bill table, quantity controls, totals, and bottom code entry inside the Platform shell.
- [x] Preserve idempotent bill requests and live tenant authorization.
- [x] Add optional HTTPS menu images with module-owned MariaDB migration `qcafe.menu.002`; apply to the current `codexsun_db` tenant.
- [x] Browser verified card add, code quantity entry, and plus/minus totals.
- [x] MariaDB integration test verifies photo URL persistence, tenant isolation, settlement concurrency, and bill persistence; nine desktop regression tests pass.
- [x] Port table/seat allocation, saved parallel orders, and KOT to web. Browser printing is implemented; native printer routing remains desktop-only.

## Saved dine-in orders and kitchen tickets

- [x] Top header matches desktop ordering: search, order tabs, New Order, Kitchen, Save & print. Responsive fit checked at a 1280px viewport.
- [x] Table maintenance, seat selection, order edits, and multiple orders persist in tenant MariaDB. Applied additive migrations and admin permission seeds to `codexsun_db`.
- [x] Transactional seat claims, revision conflicts, immutable KOT snapshots, incremental sends, cancellation tickets, and atomic final billing are covered by the two-database integration test.
- [x] Browser verified two saved order tabs, occupied seat rejection, refresh persistence, KOT preview/reprint, and top Save & print.
- [x] Live QA order `d5e57295` generated KOT `d2d5c8a1` (`KOT-000001`) and bill `9ab286be` (`POS-000002`) for 100 paise at QA-T07 seat 1. Test cash payment `b3654170` completed without money transfer. Direct MariaDB reads confirmed saved metadata and payment.
- [x] Print-media checks verified KOT and paid receipt contents, including table and seat. Browser media emulation was restored.
- [x] Unused QA order `4d19b191` was cancelled to release its seat. Audit and financial records remain preserved.
- [x] Desktop source behavior remains unchanged; all nine SQLite/PIN regression tests pass.
- [ ] Physical printer output and silent desktop-printer integration remain unverified for web.

## Service pages

- [x] Separate POS, KOT, and Take Away routes and sidebar entries; each starts from the existing POS layout and workflow.
- [x] F1 cycles between service pages without changing an existing order’s mode. Dialogs retain keyboard focus.
- [x] Restore the original immediate New Order flow and saved-order visibility on POS. KOT and Take Away are matching base pages for later refinement.
- [x] Remove Refresh, Tables, and Kitchen from the POS header.

## Master layout

- [x] Rename Restaurant menu navigation to Master with a crossed-utensils icon, preserving the route.
- [x] Add Items, Categories, and Restaurant Tables tabs with clear record lists and inline editors.
- [x] Verify item view/edit state, top Save item validation, category grouping, and table view/edit state in the browser.
- [x] Preserve existing tenant APIs, permissions, prices, bill history, and desktop code.
- [ ] Photo file upload and special-price settings remain separate follow-up features; the current photo field accepts HTTPS URLs.
