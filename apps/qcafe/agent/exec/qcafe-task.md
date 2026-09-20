# Q Cafe Delivery Tasks

## Status Rules

- `[x]` is complete in the current `apps/qcafe` application.
- `[ ]` is planned work.
- The reviewed `apps/temp/qcafe` snapshot is a reference. Its features are not complete in the current application.

## Reviewed Ideas From the Q Cafe Snapshot

| Idea                                                                             | Keep or change  | Reason                                                                                            |
| -------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| App-owned restaurant API, web host, data store, desktop runtime, and backup flow | Keep            | Q Cafe needs independent restaurant operations.                                                   |
| Server-owned menu prices and item snapshots on orders                            | Keep            | A browser must not set the final sale price.                                                      |
| POS order, kitchen ticket, booking, stock, and activity workflows                | Keep            | These are the core restaurant workflows.                                                          |
| SQLite sync fields and a pending-change endpoint                                 | Change          | Use the approved platform sync contract. Add conflict handling before offline use.                |
| Local cashier PIN and local staff users                                          | Change          | Use Platform Identity and Q Cafe location staff assignments.                                      |
| Browser session storage for table state and master data                          | Replace         | Persist table sessions and menu state in Q Cafe records.                                          |
| Direct browser printing                                                          | Replace         | Create a document and print job. Send direct jobs through an approved desktop or gateway adapter. |
| Simple table booking with a fixed two-hour hold                                  | Expand          | Use reservation states, table allocation, conflict rules, and service policy.                     |
| POS bill, receipt, and receipt transaction records                               | Keep and refine | Separate bill, payment, receipt, voucher, refund, cash shift, and settlement state.               |
| Daily backup and desktop data folder                                             | Keep            | Include recovery drills and an approved Windows desktop boundary.                                 |

## Phase 0: Current Foundation

### 0.1 Completed scaffold

- [x] `QC-0001` Create the Q Cafe application boundary under `apps/qcafe`.
- [x] `QC-0002` Register the `qcafe.foundation` provider and health contract.
- [x] `QC-0003` Add the Q Cafe workspace route with Overview, POS, KOT, and Booking pages.
- [x] `QC-0004` Compose the Q Cafe web shell through the shared MDI workspace.
- [x] `QC-0005` Add Q Cafe authentication routes through Platform Identity.

### 0.2 Finish the foundation

- [x] `QC-0010` Confirm platform contracts for identity, tenancy, storage, audit, device trust, sync, and delivery.
  - Acceptance: each external dependency has an owner, public contract, and failure behavior.
- [x] `QC-0011` Register Q Cafe module manifests for foundation, menu, POS, kitchen, booking, inventory, billing, and devices.
  - Acceptance: no Q Cafe module imports another module's private store or table.
- [x] `QC-0012` Add a Q Cafe database provider, migration runner, and transaction boundary.
  - Acceptance: `DB_DRIVER` switches SQLite and MariaDB, storage paths are explicit, serial SHA-verified migrations and seeders are recorded, and both database smoke checks pass.
- [x] `QC-0013` Add the business, location, business-day, service-channel, and number-sequence records.
  - Acceptance: one business can operate multiple locations without duplicate setup data.
- [x] `QC-0014` Add Q Cafe activity events and structured audit references.
  - Acceptance: every state-changing command has an actor, subject, event type, and correlation identifier.
- [x] `QC-0015` Add database diagnostics, cloud-sync policy, and connector settings pages.
  - Acceptance: Settings exposes dedicated database, cloud-sync, and connector pages without exposing or storing secret values.

## Phase 1: Menu and Outlet Setup

- [x] `QC-0100` Add the complete M01-M15 Menu schema as an append-only migration.
  - Acceptance: `qcafe.menu.002` enriches the original catalog records and creates campaigns, modifiers, media metadata, availability, and allergen records on SQLite and MariaDB with a verified SHA lifecycle record.
- [x] `QC-0101` Add category, item, variant, price book, and effective menu price records.
  - Acceptance: the API selects an effective price by location, channel, and date.
- [x] `QC-0102` Add menu image metadata through Platform Storage.
  - Acceptance: the API stores an object reference and checksum, not image binary data.
- [x] `QC-0103` Add item availability by location, service channel, and time window.
  - Acceptance: an unavailable item cannot enter an order.
- [x] `QC-0104` Add manager APIs and pages for item, price, image, and availability setup.
  - Acceptance: inactive or invalid records cannot become saleable.
- [x] `QC-0105` Add menu tests for price dates, duplicate codes, inactive items, and availability rules.
  - Acceptance: focused API tests cover each rejected case.
- [x] `QC-0106` Add M06-M07 campaign and special pricing workflows.
  - Acceptance: active scheduled campaigns resolve from a normal server-owned price by priority, outlet, variant, and usage limit without overwriting price history.

## Phase 2: Core POS and Takeaway

- [ ] `QC-0201` Add service channels for counter, dine-in, takeaway, QR, delivery, event, and marketplace sales.
  - Acceptance: takeaway uses the normal order record and does not create a separate sale model.
- [ ] `QC-0202` Add order, order line, order event, fulfillment job, and takeaway detail records.
  - Acceptance: an open parcel order survives a browser refresh and shows its order history.
- [ ] `QC-0203` Build the touch-first POS page using server-selected catalog and prices.
  - Acceptance: a cashier can add, change, remove, and hold items without browser-held price authority.
- [ ] `QC-0204` Add item notes, order notes, modifiers, discounts, and approval rules.
  - Acceptance: each price adjustment records the reason and approving actor.
- [ ] `QC-0205` Add customer selection and pickup details for parcels.
  - Acceptance: collection name, contact reference, and pickup code are available at handover.
- [ ] `QC-0206` Verify the counter parcel flow from an authenticated browser through persisted order data.
  - Acceptance: create, edit, hold, resume, and fulfill operations pass API and browser checks.

## Phase 3: KOT and Table Service

- [ ] `QC-0301` Add dining areas, tables, table sessions, and table-session links.
  - Acceptance: table occupancy lives in Q Cafe records, not browser storage.
- [ ] `QC-0302` Add kitchen stations and item-to-station routes.
  - Acceptance: one order can route food and beverages to different stations.
- [ ] `QC-0303` Add kitchen ticket, line, and event records.
  - Acceptance: a confirmed order creates durable tickets only for prepared items.
- [ ] `QC-0304` Build the KOT screen and kitchen display actions.
  - Acceptance: staff can fire, accept, prepare, ready, serve, recall, and void with reasons.
- [ ] `QC-0305` Add KOT print routing and reprint rules.
  - Acceptance: a reprint records a new print attempt and cannot remove the original ticket.
- [ ] `QC-0306` Verify the table sale flow from seating to KOT, service, and release.
  - Acceptance: a table becomes available only after its session closes.

## Phase 4: Billing, Payments, Receipts, and Settlement

- [ ] `QC-0401` Add bill, bill line, tax, payment method, payment, tender detail, and receipt records.
  - Acceptance: a posted bill stores immutable item, price, tax, and total snapshots.
- [ ] `QC-0402` Add cash, card, UPI, bank, and approved digital payment methods.
  - Acceptance: payment records store only safe provider and masked tender references.
- [ ] `QC-0403` Add split payments, payment failure, void, refund, and correction rules.
  - Acceptance: a posted payment is reversed by a new record, never edited in place.
- [ ] `QC-0404` Add cash drawers, cash shifts, cash movements, shift settlements, and day close.
  - Acceptance: every shift variance has a reason and approver.
- [ ] `QC-0405` Add advance vouchers and voucher applications.
  - Acceptance: an event advance can apply partly or fully to a later bill.
- [ ] `QC-0406` Verify the full paid parcel flow and the partial-payment recovery flow.
  - Acceptance: orders, bills, payments, receipts, cash shift totals, and activity events reconcile.

## Phase 5: Booking, Guest, QR, and Function Sales

- [ ] `QC-0501` Add customer, reservation, reservation-table, and reservation-event records.
  - Acceptance: the API rejects an overlapping confirmed reservation under the location policy.
- [ ] `QC-0502` Add reservation lifecycle actions for requested, confirmed, seated, completed, canceled, and no-show.
  - Acceptance: every transition records an event and an actor.
- [ ] `QC-0503` Convert a seated reservation into a table session and POS order.
  - Acceptance: the booking, session, order, and bill remain linked.
- [ ] `QC-0504` Add rotatable table QR tokens and scanner profiles.
  - Acceptance: a public QR token resolves through a validated route without exposing internal identifiers.
- [ ] `QC-0505` Add event leads, follow-ups, bookings, requirements, quotes, tasks, schedules, and order links.
  - Acceptance: a function moves from enquiry to quote, advance, plan, service, and final collection.
- [ ] `QC-0506` Verify reservation conflict, QR entry, and event advance flows.
  - Acceptance: API tests and a browser flow cover accepted and rejected states.

## Phase 6: Inventory, Recipes, and Daily Planning

- [ ] `QC-0601` Add stock units, stock items, stock movements, and stock adjustment controls.
  - Acceptance: every accepted stock change posts a source-linked ledger movement.
- [ ] `QC-0602` Add recipes and recipe components for menu variants.
  - Acceptance: recipe revisions keep their effective dates and source history.
- [ ] `QC-0603` Add daily plans and daily plan lines for regular sales, specials, bookings, and events.
  - Acceptance: each plan line identifies its demand source.
- [ ] `QC-0604` Add stock reservations for confirmed events, daily plans, specials, and approved orders.
  - Acceptance: reserved quantity reduces available planning stock without posting consumption early.
- [ ] `QC-0605` Add purchase orders, goods receipts, stock counts, lot tracking, and waste events as enabled capabilities.
  - Acceptance: count variance and waste require a reason and approval.
- [ ] `QC-0606` Verify recipe consumption and event reservation against the stock ledger.
  - Acceptance: a final sale and an event plan produce traceable stock effects.

## Phase 7: Documents, Printers, Desktop, and Delivery

- [ ] `QC-0701` Add document file, printer profile, printer route, print job, and print attempt records.
  - Acceptance: the system creates a durable document before it queues any print job.
- [ ] `QC-0702` Add preview printing through the browser.
  - Acceptance: an operator confirms a preview job before the print attempt starts.
- [ ] `QC-0703` Add direct Windows service printing with idempotency acknowledgement.
  - Acceptance: a direct receipt or KOT job records request, acknowledgement, retry, and failure states.
- [ ] `QC-0704` Add web gateway, Bluetooth, wireless, and network printer adapters behind one print contract.
  - Acceptance: unavailable printers keep jobs pending or route them by configured fallback rules.
- [ ] `QC-0705` Add PDF email and approved WhatsApp delivery records.
  - Acceptance: the delivery uses a rendered document, customer consent, and a provider reference.
- [ ] `QC-0706` Add desktop data-folder selection, backup schedule, restore checks, and recovery instructions.
  - Acceptance: a Windows install preserves data and restores a tested backup.

## Phase 8: Multi-Location, Mobile, Sync, and External Channels

- [ ] `QC-0801` Add device profiles, change-log entries, sync cursors, and conflict records.
  - Acceptance: financial records never use silent last-write-wins conflict resolution.
- [ ] `QC-0802` Add mobile, desktop, and web synchronization through the approved platform contract.
  - Acceptance: one offline change, one retry, and one conflict have recorded outcomes.
- [ ] `QC-0803` Add marketplace connection, menu mapping, order intake, event, and settlement records.
  - Acceptance: each partner request is idempotent and uses an official adapter contract.
- [ ] `QC-0804` Add delivery fulfillment details and reconciliation for approved delivery partners.
  - Acceptance: partner collection and fee records reconcile with the order and payment records.
- [ ] `QC-0805` Add accounting mapping and journal export only after statutory and accounting contracts are approved.
  - Acceptance: generated journal lines balance and link to source documents.

## Phase 9: Reporting, Controls, and Release

- [ ] `QC-0901` Add sales, tax, payment, item, table, kitchen, shift, stock, and event reports.
  - Acceptance: each report uses posted records and states its location and business-day scope.
- [ ] `QC-0902` Add operational role policies for cashier, waiter, kitchen, manager, and owner users.
  - Acceptance: restricted actions fail through API authorization checks.
- [ ] `QC-0903` Add dashboard alerts for pending KOTs, stock risk, booking conflicts, failed prints, and unsettled shifts.
  - Acceptance: every alert links to a recorded operational subject.
- [ ] `QC-0904` Run data migration dry runs from the reviewed snapshot.
  - Acceptance: import totals, rejected records, and reconciliation results are documented.
- [ ] `QC-0905` Run focused API, web, desktop, migration, recovery, and end-to-end verification.
  - Acceptance: the release record separates completed proof from untested deployment and production claims.

## Work First

1. Add the complete service-channel model in `QC-0201`.
2. Add durable order and takeaway records in `QC-0202`.
3. Build the POS workflow in `QC-0203` only after the order API is authoritative.
4. Complete Phase 2 before KOT, booking, payment, or printing work.
5. Complete Phase 4 before advance vouchers, event deposits, or accounting work.
