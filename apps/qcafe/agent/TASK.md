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
- [x] Web Master accepts file upload and drag and drop, stores decoded WebP images per tenant, and loads them in POS through authenticated requests.
- [x] Web Today Special definitions, selection, and per-item prices persist in tenant MariaDB.

### Tenant menu images: 17-10-2026

- [x] Live Platform session: user-selected photo uploaded, saved on the existing QA item, and reloaded from tenant MariaDB after refresh.
- [x] File exists under `storage/f63abb54/apps/qcafe/master/`; Master thumbnail and POS card both load the saved image.
- [x] Two-database integration covers image storage, decoding, authorization, cross-tenant reads/references, invalid files, and the 5 MB limit.
- [x] Platform production build, API and web type checks, lint, component docs, module boundaries, dependency layout, two POS unit tests, and nine desktop regressions pass. Desktop source is unchanged.
- [ ] Native file drag was not exercised in browser automation; the live file selection was performed by the user because the extension blocks local file access.

### Today Special web pricing: 17-10-2026

- [x] Master supports multiple configured special prices, removal, and per-item Use in POS.
- [x] QCafe Settings defines specials and saves one enabled active selection with a revision conflict check.
- [x] Tracked additive migrations applied to verified local tenant `f63abb54` through the QCafe migration runner.
- [x] Live Platform session saved QA Special at ₹0.75 against the existing QA item's ₹1.00 normal price.
- [x] POS shows ₹0.75 after refresh. Disabling Today Special shows ₹1.00. Re-enabling restores ₹0.75.
- [x] Two-tenant database test covers invalid prefixes, duplicates, invalid prices, denied updates, stale settings, persistence, fallback, server bill prices, and stable saved-order rates.
- [ ] Production deployment and native printer checks are outside this local web verification.

### Sales page headers: 17-10-2026

- [x] Blue POS, green KOT, and purple Take Away app headers use white text and page icons.
- [x] Breadcrumb text is 16px. The middle QCafe breadcrumb is omitted.
- [x] All three pages and F1 switching verified in the browser. Platform typecheck, lint, and module boundaries pass.
- [x] No desktop or database changes.

### Booking page and Parcel label: 17-10-2026

- [x] Booking uses the existing order-entry layout at `/app/qcafe/booking` with an amber theme and calendar icon.
- [x] Web navigation, toolbar, assignment labels, and print labels use Parcel - Take away.
- [x] Existing tenant order persistence and stored service modes remain unchanged. Reservation CRUD is not introduced.
- [x] Browser verification covers Booking navigation, direct reload, matching control colors, and F1 switching.
- [x] Platform typecheck, lint, and QCafe/Platform module boundaries pass. Desktop sources are unchanged.

### Web Settings and South Indian demo pack: 17-10-2026

- [x] Dedicated web Settings page follows all nine desktop section names with working web controls and explicit native-only boundaries.
- [x] Tenant MariaDB saves profile, POS defaults, display preferences, receipt content, included GST, print preferences, and image protection with revision checks and audit history.
- [x] POS Settings previews and imports 18 sample items in five categories with English/Tamil names and original illustrations.
- [x] Live import on tenant `f63abb54` added 18 items. All images loaded in preview and POS. Existing QA item and saved orders remain present.
- [x] After refresh, MariaDB contains 18 demo items and five demo categories. All 18 files exist under the tenant Master image directory.
- [x] Sample receipt header persisted as South Indian Demo Menu at settings revision 1.
- [x] Database tests cover tenant isolation, permissions, strict settings validation, stale revisions, repeat/concurrent imports, edited-item preservation, protected images, and immutable receipt/GST snapshots through both bill paths.
- [x] Production build, API/web type checks, lint, module boundaries, component docs, dependency layout, two POS tests, and nine desktop regressions pass.
- [ ] Physical browser printer output and native printer services were not tested. Native functionality remains unchanged.

### KOT content workflow: 17-10-2026

- [x] Keep the top menu, app header, and order toolbar layout unchanged.
- [x] Add table, row/seat, kitchen token, and Current orders controls in the KOT content footer.
- [x] Current orders opens a shared Sheet drawer with item quantities, pending-send status, order selection, KOT send/reprint, and billing actions.
- [x] KOT Save & print sends a kitchen ticket. It does not create a bill. Billing remains explicit in the drawer.
- [x] Require a table and seats before a KOT-page send. Reuse server seat locks, revisions, immutable tickets, and operation retry IDs.
- [x] Use the saved KOT number as the kitchen token. No new token field or migration is required.
- [x] QCafe/Platform type checks, Platform production build, focused lint, module boundaries, MariaDB integration, component documentation, dependency layout, and nine desktop regressions passed.
- [x] Live browser verification after reconnect: table QA-T07 seat 4 saved, one demo Idli sent as KOT-000002, token and sent state persisted after refresh, and drawer reprint opened the same saved ticket. Tenant MariaDB confirmed order 4ba448d4, ticket 093c92de, seat claim 4, and no bill created.
- [ ] Physical KOT printer output remains unverified. Desktop sources remain unchanged.

### Parcel flow: 17-10-2026

- [x] Parcel-only order list, stable tenant order token, content footer, and Current orders drawer.
- [x] No table or seat controls. New parcels ignore the dine-in default. Saved KOT orders are excluded from Parcel.
- [x] Send/reprint and explicit billing preserve tenant authorization, revisions, and idempotency.
- [x] Final bill service context snapshots the parcel token. No database migration is required.
- [x] Live PCL-000005 sent one filter coffee as ticket c17e9545. MariaDB confirmed TAKE AWAY mode, null table, empty seats, zero seat claims, and no bill created.
- [x] Integration covers token persistence, tenant access denial, duplicate sends, no seat claims, and token retention on bill receipts.
- [x] API and Platform type checks, production build, lint, module boundaries, and nine desktop regressions passed.
- [ ] Physical printer output remains unverified.
- [x] After refresh, the Parcel footer retained PCL-000005 and sent status. The parcel-only drawer contained no table/seat controls, excluded the KOT order, and reopened the same saved ticket for reprint.

### KOT floor drill-down: 17-10-2026

- [x] Table and chair cards, availability counts and filters use the tenant table and occupied-seat APIs.
- [x] Select chairs then press the table to create or reopen the correct order and show its items.
- [x] KOT starts on the floor. New Order and Back to tables return there. Hidden item-stage shortcuts cannot send a ticket.
- [x] Live browser verified occupied chair 4 reopened the existing QA-T07 order with its 11 items unchanged.
- [x] Platform typecheck, production build, focused lint, module boundaries, and MariaDB integration passed.
- [x] Reconnected browser verification: retried the original operation once, created order 2267af15 at QA-T07 chair 1, refreshed, then selected that chair and pressed the table to reopen its item menu. MariaDB confirmed the saved assignment. Cancelled the empty test order afterward to release chair 1. Existing chair 4 order and all 11 items remained unchanged.
- [x] No backend, schema, header layout, or desktop source changes.

### Scheduled pickup Booking: 17-10-2026

- [x] Booking-only form and order list require customer name, mobile, and future pickup date/time before saving.
- [x] Stable BKG token, current bookings drawer sorted by pickup time, preparation send/reprint, and explicit billing use existing Order APIs.
- [x] Booking details persist in tenant MariaDB through additive qcafe.order.002. Applied to verified local tenant f63abb54.
- [x] Server validation rejects malformed details, past schedules, table/seat bookings, removed details, and changes after preparation tickets.
- [x] Booking details and token appear on preparation tickets and immutable bill receipt snapshots.
- [x] Live BKG-000010 (e48bc859) saved Demo Pickup Verification with synthetic mobile and 19-10-2026 12:30 device-local pickup. Sent one Idli at the 3500-paise special price as ticket cba641f9.
- [x] Refresh, booking drawer, reprint, and detail-lock checks passed. Direct MariaDB reads confirmed schedule 2026-10-19T07:00:00.000Z, saved item/ticket, null table, empty seats, zero seat claims, and no live bill created.
- [x] Parcel verification excluded Booking tokens and retained its existing PCL order. Existing customer bookings remain unchanged.
- [x] Integration covers invalid input, denied updates, tenant isolation, replay, immutable schedules, receipt snapshots, and persistence through a new database connection.
- [x] API/Platform type checks, production build, focused lint, module boundaries, and nine desktop regressions passed.
- [ ] Physical printer output remains unverified. The demo booking remains saved for review.
- [ ] Root dependency-layout check is blocked by unrelated generated apps/tconnect/web/dist. No TConnect output was removed during Booking work.

## Visual KOT floor and running orders: 17-10-2026

- [x] KOT floor keeps the compact chair-to-table-to-items drill down and adds a right-side running-orders panel.
- [x] The panel shows table, chairs, item quantities, total, latest ticket, Send to kitchen, and View ticket. Existing permission checks and retry-safe order mutations remain authoritative.
- [x] Table cards show pending quantities, sent-to-kitchen state, seated state, and payment-due state from saved orders and seat claims.
- [x] Current tenant setup contains 15 active four-seat tables. Existing QA-T07 was preserved; T01-T06 and T08-T15 were created through Master.
- [x] Browser verified T01 chair 1 selection, item drill down, two pending items, and Send to kitchen from the floor panel. Ticket KOT-000006 (17c3a3f9), order 68b963b3, contains Idli at 3500 paise and coffee at 2500 paise.
- [x] Full refresh retained the occupied chair, sent state, and ticket. Direct MariaDB reads confirmed all 15 tables and the ticket in codexsun_db.
- [x] Platform web typecheck and build, focused order-module lint, and QCafe module boundaries passed. Physical kitchen printing was not tested.
- [x] This change preserves the application headers and desktop source. The sample KOT remains available for review; no bill or payment was created.

## Rapid item entry: 17-10-2026

- Item-card clicks remain enabled while additions save. A serial addition queue uses each returned order revision, so double clicks do not overwrite quantities with stale lines. Billing, kitchen actions, and order tabs remain locked until the queue completes. Failed additions remain queued with retry controls; uncertain writes retry their existing operation ID.
- Live browser test: four double clicks added exactly eight coffees on each page: POS Order 5 13 to 21, KOT Order 6 0 to 8, Parcel Order 2 9 to 17, Booking Order 4 2 to 10. All four final quantities remained visible after full refresh and matched direct codexsun_db reads.
- Item cards no longer dim on each save. Sticky toolbar/footer and page flows were preserved. Desktop was not edited. No bill, payment, or kitchen ticket was created during these addition tests.
- Platform web typecheck and focused order lint passed. Runtime screenshot: dist/.tmp/qcafe-rapid-clicks-verified.png (generated local evidence).

## Kitchen preparation and waiter delivery: 17-10-2026

KOT now uses Send to kitchen. This saves a serial kitchen token and dispatches it to the saved KOT printer without opening the waiter's browser print dialog. Kitchen is a separate Platform-composed page. Tokens move queued -> ready -> delivered, in serial order. Screen buttons or a keyboard scanner entering the token followed by Enter confirm each step. Delivery requires an active registered waiter. KOT billing rejects unsent items and undelivered tokens; Get customer bill opens the saved bill and customer receipt after delivery.

Settings includes Waiter registration (code, name, active/inactive) and an installed-printer selector. Waiter management requires qcafe.waiter.manage; kitchen preparation requires qcafe.kitchen.send and delivery requires qcafe.pos.create. Registration is restaurant staff metadata, not a new Platform login or role grant. Staff records are inactivated rather than deleted to preserve delivery history.

Tenant migrations qcafe.waiter.001, qcafe.order.003 and qcafe.order.004 add the staff register, ticket preparation/delivery metadata and audit, and durable print state. Existing historical kitchen tickets are treated as previous service, not silently reopened for preparation. New tokens start queued/pending. Printer dispatch runs on the Windows API host, validates against installed physical printers, and records pending/spooling/spooled/review. Uncertain printer errors require review and are not automatically reprinted. Non-Windows hosts need a separate printer adapter. Desktop code, PINs, SQLite and native printing are unchanged.

Live verification saved HP Smart Printing as the tenant KOT printer, registered DEMO-W01, and selected T03 chairs 1 and 2 with Idli quantity 2. KOT-000009 (order f1ff94a6) saved without a browser print dialog and was acknowledged by the Windows spooler. Entering its token marked ready; screen delivery with Demo waiter persisted delivered and an audit record. Get customer bill opened unpaid POS-000006 (c97d315b), total 7000 paise. No payment was recorded. Direct codexsun_db reads confirmed printer preference, staff, ticket lines, ready/delivered audit, spool status and bill. Physical paper output and a physical barcode scanner were not verified.

The MariaDB integration suite passed with added serial-order, permission, cross-tenant, missing waiter, early billing, duplicate confirmation and delivery-to-bill tests. Test printing uses an injected spooler and never sends test-suite jobs to physical printers. QCafe API/Platform web types, focused lint, module boundaries, Platform web build, and nine unchanged desktop regression tests passed.

## KOT order badges: 17-10-2026

Table cards and running-order headers show the same deterministic coloured order badge. Clicking a table's running-order badge opens that exact saved order. Billed orders with unreleased seats retain their badge and open the saved bill, using an authorized tenant-local floor-bills lookup rather than reopening an editable order. API/frontend typechecks and the database integration suite passed, including floor-bill access denial and cross-tenant isolation.

## Sidebar overview: 18-10-2026

QCafe hides the company/financial-year sidebar brand block through the existing tenant layout option. Overview appears before POS and opens an app-owned summary of current saved orders with links to POS, KOT, Parcel and Booking. Existing POS route and the main app header remain unchanged. Platform web typecheck, focused lint and QCafe module boundary checks passed. Live local verification was unavailable: the connected browser only had the production codexsun.com POS tab; no production deployment was performed.
