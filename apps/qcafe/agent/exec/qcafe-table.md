# Q Cafe Data Structure and Delivery Plan

## 1. Purpose

This document defines the planned Q Cafe data structure. It is a planning document only. It does not create migrations, database tables, APIs, or user interfaces.

Q Cafe must support a small counter, a cafe, a restaurant, a bar, a hotel outlet, and an event business. The first release must remain useful for a single-location counter. Larger workflows must be enabled by capability and deployment profile, not forced on every outlet.

The product flow is:

`pre-plan -> prepare -> accept -> make -> deliver -> collect -> settle -> review`

## 2. Review Findings

| Finding                                                                                                                       | Evidence reviewed                                                | Planning decision                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| The prior Q Cafe snapshot has 22 application tables and nine SQL migrations.                                                  | `apps/temp/qcafe/apps/q-cafe` migration and application sources. | Treat it as a legacy import source. Do not extend its local schema as the future model.                                         |
| Legacy orders, lines, receipts, KOT activity, and browser-side table state are only partly separated.                         | Legacy API and web views.                                        | Separate order, kitchen ticket, fulfillment, bill, payment, receipt, and table-session responsibilities.                        |
| Legacy special pricing is read from browser data.                                                                             | Legacy menu and POS sources.                                     | Make prices, campaigns, and availability server-owned.                                                                          |
| Legacy printing is not a durable delivery workflow.                                                                           | Legacy printing integration.                                     | Persist every print job and attempt. A receipt exists before any print is requested.                                            |
| The current product scope includes POS, KOT, booking, parcels, events, inventory, vouchers, settlement, and multi-device use. | Q Cafe requirements and product brief.                           | Deliver in phases. Do not make hotel, marketplace, accounting, or remote printer capabilities prerequisites for a counter sale. |

## 3. Boundaries and Naming

| Boundary                                                                                                           | Owner                            | Rule                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Users, credentials, sessions, permissions, tenant membership, generic audit retention, and generic delivery outbox | Platform Identity and Operations | Q Cafe stores platform references. It must not create a second user or credential system.                 |
| Q Cafe operational data                                                                                            | Q Cafe                           | Q Cafe owns restaurant-specific tables, order state, kitchen state, stock state, and financial documents. |
| Media object storage                                                                                               | Platform Storage                 | Q Cafe stores media metadata and object references only.                                                  |
| Email, WhatsApp, payment, marketplace, printer, and scanner integrations                                           | Adapter contracts                | No provider secret belongs in Q Cafe records. Store a provider reference and delivery result only.        |
| Local device authentication and trust                                                                              | Platform Identity                | Q Cafe stores only the outlet device profile and operational configuration.                               |

All Q Cafe records use an immutable `id`, `business_id`, `location_id` where relevant, `created_at`, `updated_at`, and a concurrency version. Financial, stock, kitchen, and audit records are append-only after posting.

Table status:

| Mark | Meaning                                                          |
| ---- | ---------------------------------------------------------------- |
| `C`  | Core. Required for the first useful restaurant flow.             |
| `G`  | Growth. Add when the related capability is enabled.              |
| `I`  | Integration. Add only with a verified adapter and business need. |

## 4. Delivery Profiles

| Profile                       | Required modules                                                               | Deferred modules                                              |
| ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Roadside counter              | Menu, POS, parcel fulfillment, bills, payments, receipt print, shift close.    | Booking, events, marketplace, stock lots, accounting journal. |
| Cafe or restaurant            | Counter profile plus tables, sessions, KOT, reservations, recipes, daily plan. | Hotel folio, marketplace, event quoting.                      |
| Bar                           | Restaurant profile plus age-gated item rules, measured stock, tab policy.      | Hotel folio and event workflow unless needed.                 |
| Hotel outlet                  | Restaurant profile plus room or folio payment adapter.                         | Internal hotel ledger unless the hotel contract requires it.  |
| Catering or function business | Restaurant profile plus leads, quote, deposit voucher, event plan, follow-up.  | Marketplace unless it is an active channel.                   |

## 5. Foundation, Location, User, and Logs

| ID  | Table                              | Mark | Key fields                                                                           | Why and where                                                                          |
| --- | ---------------------------------- | ---- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| F01 | `qcafe_businesses`                 | C    | `id`, `platform_tenant_id`, legal name, tax profile ref, timezone, currency          | Restaurant business boundary. A tenant can operate one or more businesses.             |
| F02 | `qcafe_locations`                  | C    | `business_id`, code, name, address, timezone, service status                         | Outlet, kitchen, and stock boundary. Supports branches without copying menu data.      |
| F03 | `qcafe_location_settings`          | C    | `location_id`, service options, bill rules, tax mode, day-close rule                 | Versioned operational settings per outlet.                                             |
| F04 | `qcafe_business_days`              | C    | `location_id`, business date, opened at, closed at, status                           | Makes late-night shifts and day close explicit.                                        |
| F05 | `qcafe_number_sequences`           | C    | `location_id`, document kind, prefix, next value                                     | Produces controlled numbers for orders, bills, vouchers, and KOTs.                     |
| F06 | `qcafe_service_channels`           | C    | `location_id`, code, kind, enabled                                                   | Dine-in, takeaway, delivery, QR, event, and marketplace entry points.                  |
| F07 | `qcafe_location_capabilities`      | G    | `location_id`, capability key, enabled from, configuration ref                       | Enables booking, alcohol, events, marketplace, or remote printing deliberately.        |
| F08 | `qcafe_location_staff_assignments` | C    | `location_id`, `platform_user_id`, operational role, active dates                    | Assigns a platform user to an outlet role. It does not replace platform permissions.   |
| F09 | `qcafe_activity_events`            | C    | event type, actor ref, subject type and id, correlation id, payload ref, occurred at | Append-only operational history for order, payment, stock, kitchen, and device events. |
| F10 | `qcafe_data_change_log`            | G    | entity type and id, version, change kind, occurred at, origin device ref             | Sync feed for Q Cafe-owned data. It is not the source of truth.                        |

Example: a cashier opens an order. `qcafe_activity_events` records `order.opened`, while the order table remains the current state.

## 6. Item Master, Prices, Images, and Availability

| ID  | Table                        | Mark | Key fields                                                                | Why and where                                                                             |
| --- | ---------------------------- | ---- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| M01 | `qcafe_menu_categories`      | C    | parent id, name, display order, active                                    | Groups food, beverages, packages, and services.                                           |
| M02 | `qcafe_menu_items`           | C    | SKU, name, item type, category id, tax class ref, active                  | Saleable master item. Item type distinguishes food, beverage, service, and packaged item. |
| M03 | `qcafe_menu_variants`        | C    | item id, code, name, quantity basis, active                               | Small, regular, large, bottle, and other sellable variants.                               |
| M04 | `qcafe_price_books`          | C    | location scope, channel scope, currency, effective dates, status          | Holds a normal price list and controlled alternatives.                                    |
| M05 | `qcafe_menu_prices`          | C    | price book id, item or variant id, amount, tax inclusion, effective dates | Server-owned price history.                                                               |
| M06 | `qcafe_special_campaigns`    | G    | name, scope, schedule, priority, status                                   | Festival, happy hour, special menu, or function pricing campaign.                         |
| M07 | `qcafe_special_prices`       | G    | campaign id, item or variant id, amount or rule, limit                    | Campaign-specific price with explicit limits.                                             |
| M08 | `qcafe_modifier_groups`      | G    | name, min and max selections, active                                      | Add-ons such as milk choice, spice level, or toppings.                                    |
| M09 | `qcafe_modifier_options`     | G    | group id, name, price adjustment, stock item ref                          | Selectable modifier values.                                                               |
| M10 | `qcafe_item_modifier_groups` | G    | item or variant id, group id, display order                               | Connects menu items to permitted modifiers.                                               |
| M11 | `qcafe_media_assets`         | C    | storage object ref, checksum, mime type, width, height, status            | Image metadata only. The image binary remains in Platform Storage.                        |
| M12 | `qcafe_menu_item_media`      | C    | item or variant id, media asset id, usage, display order                  | Shows menu, QR-order, and delivery images without duplicate files.                        |
| M13 | `qcafe_item_availability`    | G    | item or variant id, location id, channel id, date range, status, reason   | Stops an item for one outlet, channel, or time window.                                    |
| M14 | `qcafe_allergen_tags`        | G    | code, name, severity                                                      | Allergen master.                                                                          |
| M15 | `qcafe_item_allergens`       | G    | item or variant id, allergen tag id, note                                 | Required when menu safety information is published.                                       |

Example: a Diwali sweets campaign uses `qcafe_special_campaigns` and `qcafe_special_prices`. It does not overwrite the normal menu price.

## 7. Seating, Booking, Customer, and QR Entry

| ID  | Table                        | Mark | Key fields                                                                | Why and where                                                                 |
| --- | ---------------------------- | ---- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| S01 | `qcafe_dining_areas`         | G    | location id, name, kind, display order, active                            | Dining room, terrace, bar, or private room.                                   |
| S02 | `qcafe_dining_tables`        | G    | area id, code, capacity, position label, active                           | Physical table master.                                                        |
| S03 | `qcafe_table_sessions`       | G    | table id, status, opened at, closed at, primary order id                  | Current occupancy window. Never use a browser-only table state.               |
| S04 | `qcafe_table_session_tables` | G    | session id, table id                                                      | Supports a combined table session.                                            |
| S05 | `qcafe_customers`            | G    | name, phone, email, consent flags, external reference                     | Customer record for booking, receipt delivery, loyalty, and event follow-up.  |
| S06 | `qcafe_reservations`         | G    | customer id, location id, arrival time, party size, status, source, notes | Booking lifecycle from requested to seated, cancelled, or no-show.            |
| S07 | `qcafe_reservation_tables`   | G    | reservation id, table id, assigned at                                     | Planned table assignment.                                                     |
| S08 | `qcafe_reservation_events`   | G    | reservation id, event type, actor ref, note, occurred at                  | Booking audit and follow-up history.                                          |
| S09 | `qcafe_table_qr_tokens`      | G    | location id, table id, token hash, version, active dates, revoked at      | Rotatable QR entry token. A scan never exposes an internal table id directly. |
| S10 | `qcafe_scanner_profiles`     | I    | device ref, location id, scan purpose, accepted formats, active           | Configures QR or barcode scanners for a specific device and purpose.          |

Example: a guest scans a table QR code. The public token resolves to a valid table session or starts the permitted QR ordering flow.

## 8. POS, Takeaway, Parcels, and Delivery

Takeaway is a service channel on the same order model. It must not become a second sales system.

| ID  | Table                        | Mark | Key fields                                                                                         | Why and where                                                                      |
| --- | ---------------------------- | ---- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| O01 | `qcafe_orders`               | C    | number, location id, channel id, customer id, table session id, status, opened by, totals snapshot | Commercial intent and operational order state.                                     |
| O02 | `qcafe_order_lines`          | C    | order id, item snapshot, variant snapshot, quantity, unit price, tax snapshot, line status         | Immutable sale snapshot after confirmation.                                        |
| O03 | `qcafe_order_line_modifiers` | G    | order line id, option snapshot, quantity, price adjustment                                         | Preserves the modifier chosen at sale time.                                        |
| O04 | `qcafe_order_events`         | C    | order id, event type, actor ref, reason, occurred at                                               | Order history including hold, cancel, reopen, and handoff.                         |
| O05 | `qcafe_fulfillment_jobs`     | C    | order id, kind, status, promised at, ready at, handover at, handler ref                            | Tracks dine-in service, counter collection, parcel handover, or delivery dispatch. |
| O06 | `qcafe_takeaway_details`     | C    | fulfillment job id, collection name, contact ref, pickup code, pickup window                       | Collects parcel-specific details without duplicating the order.                    |
| O07 | `qcafe_delivery_details`     | G    | fulfillment job id, address ref, delivery partner ref, dispatch state, tracking ref                | Own delivery or a verified third-party delivery adapter.                           |
| O08 | `qcafe_order_adjustments`    | G    | order id, kind, amount, reason, approval actor ref                                                 | Discounts, service recovery, and rounding need explicit approval history.          |
| O09 | `qcafe_order_notes`          | G    | order id or line id, note kind, content, visibility                                                | Guest, kitchen, and internal notes with separate visibility.                       |

Example: a counter parcel creates one order, one takeaway fulfillment job, kitchen tickets if required, then one bill and payment trail.

## 9. Kitchen Order Tickets and Preparation

| ID  | Table                                | Mark | Key fields                                                               | Why and where                                                           |
| --- | ------------------------------------ | ---- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| K01 | `qcafe_kitchen_stations`             | G    | location id, code, name, active                                          | Bar, hot kitchen, bakery, or packing station.                           |
| K02 | `qcafe_item_station_routes`          | G    | item or variant id, station id, priority, active                         | Routes each preparation item to the right station.                      |
| K03 | `qcafe_kitchen_tickets`              | G    | number, order id, station id, status, fired at, ready at                 | Durable KOT header. One order can produce tickets for several stations. |
| K04 | `qcafe_kitchen_ticket_lines`         | G    | ticket id, order line id, quantity, status, preparation note             | Kitchen-specific line state.                                            |
| K05 | `qcafe_kitchen_ticket_events`        | G    | ticket or line id, event type, actor or device ref, occurred at          | Fire, accept, prepare, ready, recall, and void events.                  |
| K06 | `qcafe_preparation_profiles`         | G    | item or variant id, lead time, hold time, batch rule                     | Supports promised-ready estimates and production planning.              |
| K07 | `qcafe_production_batches`           | G    | location id, planned item id, quantity, status, started at, completed at | Daily batch production for regular demand and specials.                 |
| K08 | `qcafe_production_batch_consumption` | G    | batch id, stock item id, planned quantity, actual quantity               | Links production to inventory consumption.                              |

Example: coffee routes to Bar and a sandwich routes to Hot Kitchen. Both tickets can become ready independently before parcel handover.

## 10. Inventory, Reservations, and Daily Planning

| ID  | Table                        | Mark | Key fields                                                                                    | Why and where                                                                  |
| --- | ---------------------------- | ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| I01 | `qcafe_stock_units`          | C    | code, name, precision, conversion basis                                                       | Gram, kilogram, millilitre, piece, bottle, and pack units.                     |
| I02 | `qcafe_stock_items`          | C    | SKU, name, stock unit id, reorder level, valuation rule, active                               | Raw material, resale item, packaging, or consumable master.                    |
| I03 | `qcafe_recipes`              | G    | menu item or variant id, yield quantity, active dates, version                                | Standard recipe or bill of materials.                                          |
| I04 | `qcafe_recipe_components`    | G    | recipe id, stock item id, quantity, loss allowance                                            | Expected ingredient consumption per sale or batch.                             |
| I05 | `qcafe_stock_lots`           | G    | stock item id, location id, received date, expiry date, quantity, cost                        | Lot and expiry tracking where needed.                                          |
| I06 | `qcafe_stock_movements`      | C    | stock item id, location id, lot id, movement kind, quantity, unit cost, source ref, posted at | Single stock ledger for receive, reserve, consume, count, waste, and transfer. |
| I07 | `qcafe_stock_reservations`   | G    | stock item id, location id, demand source kind and id, quantity, status, expires at           | Holds stock for an event, special, confirmed order, or daily plan before use.  |
| I08 | `qcafe_daily_plans`          | G    | location id, business date, status, planner ref, approved by                                  | Daily operational plan.                                                        |
| I09 | `qcafe_daily_plan_lines`     | G    | plan id, demand type, item or recipe id, forecast quantity, planned quantity, source ref      | Regular POS forecast, special campaign, booking, and event demand in one plan. |
| I10 | `qcafe_purchase_orders`      | G    | supplier ref, location id, status, expected date, total                                       | Supplier order workflow.                                                       |
| I11 | `qcafe_purchase_order_lines` | G    | purchase order id, stock item id, quantity, price, received quantity                          | Expected purchase quantities.                                                  |
| I12 | `qcafe_goods_receipts`       | G    | purchase order id, location id, received at, receiver ref, status                             | Records actual delivery from a supplier.                                       |
| I13 | `qcafe_goods_receipt_lines`  | G    | receipt id, stock item id, lot id, received quantity, accepted quantity, unit cost            | Posts accepted stock into the ledger.                                          |
| I14 | `qcafe_stock_counts`         | G    | location id, status, counted at, approver ref                                                 | Stock count session.                                                           |
| I15 | `qcafe_stock_count_lines`    | G    | count id, stock item id, expected quantity, actual quantity, variance reason                  | Count variance becomes an approved stock movement.                             |
| I16 | `qcafe_waste_events`         | G    | stock item or production batch ref, quantity, reason, approval ref                            | Spoilage, breakage, and kitchen waste.                                         |

Example: a wedding event reserves 20 kg of ingredients. The daily plan sees that reservation before it plans regular counter production.

## 11. Billing, Payments, Vouchers, Accounts, and Settlement

| ID  | Table                            | Mark | Key fields                                                                               | Why and where                                                                      |
| --- | -------------------------------- | ---- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| B01 | `qcafe_bills`                    | C    | number, order id, status, currency, subtotal, tax, discount, payable, issued at          | Fiscal and customer-facing charge document.                                        |
| B02 | `qcafe_bill_lines`               | C    | bill id, order line ref, description snapshot, quantity, tax and amount snapshots        | Preserves bill content even if menu data changes.                                  |
| B03 | `qcafe_bill_taxes`               | C    | bill id, tax code ref, taxable amount, tax amount                                        | Tax breakdown for receipt and reporting.                                           |
| B04 | `qcafe_payment_methods`          | C    | location scope, code, kind, active, configuration ref                                    | Cash, card, UPI, bank transfer, room charge, marketplace collection.               |
| B05 | `qcafe_payments`                 | C    | bill id, method id, purpose, amount, status, provider reference, received at             | Money movement. Purpose includes sale, advance, refund, and adjustment.            |
| B06 | `qcafe_payment_tender_details`   | C    | payment id, tender kind, masked reference, approval code, received amount, change amount | Payment-specific details without unsafe card storage.                              |
| B07 | `qcafe_receipts`                 | C    | number, bill id, payment id, status, issued at, rendered document ref                    | Customer payment receipt. Create before print or delivery.                         |
| B08 | `qcafe_vouchers`                 | G    | number, kind, customer or event ref, status, value, issued at, expires at                | Advance receipt, credit, refund, or adjustment voucher.                            |
| B09 | `qcafe_voucher_applications`     | G    | voucher id, bill or event ref, applied amount, applied at                                | Applies an advance voucher against a later bill or event settlement.               |
| B10 | `qcafe_refunds`                  | G    | original payment id, refund payment id, reason, approver ref, status                     | Controlled reversal path. Never edit a posted payment.                             |
| B11 | `qcafe_cash_drawers`             | C    | location id, code, active                                                                | Counter cash drawer master.                                                        |
| B12 | `qcafe_cash_shifts`              | C    | drawer id, business day id, cashier ref, opening float, status, opened at, closed at     | Cash custody window.                                                               |
| B13 | `qcafe_cash_movements`           | C    | cash shift id, kind, amount, reason, actor ref, approved by                              | Cash in, cash out, float adjustment, and safe drop.                                |
| B14 | `qcafe_shift_settlements`        | C    | cash shift id, expected totals, counted totals, variance, approved by, status            | Cashier handover and variance resolution.                                          |
| B15 | `qcafe_day_closes`               | C    | business day id, status, sales total, tax total, payment totals, closed by               | Outlet daily settlement.                                                           |
| B16 | `qcafe_accounting_accounts`      | I    | code, name, account type, external ledger ref, active                                    | Chart-of-account mapping only when Q Cafe posts to an approved accounting process. |
| B17 | `qcafe_accounting_journals`      | I    | number, source document ref, status, posted at, external reference                       | Accounting export or posting header.                                               |
| B18 | `qcafe_accounting_journal_lines` | I    | journal id, account id, debit, credit, tax ref                                           | Double-entry lines when required by the statutory accounting integration.          |

Example: an event customer pays an advance. Q Cafe records a payment with purpose `advance`, issues a voucher, and later applies it to the event bill.

## 12. Festival, Function, and Follow-up Workflow

| ID  | Table                        | Mark | Key fields                                                                     | Why and where                                                          |
| --- | ---------------------------- | ---- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| E01 | `qcafe_event_leads`          | G    | customer id, source, occasion type, event date, guest count, status, owner ref | First enquiry for a festival package, catering, or function.           |
| E02 | `qcafe_event_followups`      | G    | lead id, scheduled at, outcome, note, owner ref, completed at                  | Explicit follow-up queue.                                              |
| E03 | `qcafe_event_bookings`       | G    | lead id, location id, status, event schedule, guest count, customer ref        | Confirmed event commitment.                                            |
| E04 | `qcafe_event_requirements`   | G    | event booking id, category, details, responsible ref, status                   | Dietary needs, seating, equipment, venue, and decoration requirements. |
| E05 | `qcafe_event_quotes`         | G    | booking id, number, status, currency, valid until, total                       | Commercial proposal before confirmed order.                            |
| E06 | `qcafe_event_quote_lines`    | G    | quote id, item or service ref, description snapshot, quantity, amount          | Food package, rental, service, and custom items.                       |
| E07 | `qcafe_event_orders`         | G    | event booking id, order id, role                                               | Links a confirmed event to one or more operational orders.             |
| E08 | `qcafe_event_schedule_items` | G    | event booking id, starts at, ends at, activity, owner ref, status              | Preparation, delivery, service, and collection timeline.               |
| E09 | `qcafe_event_tasks`          | G    | event booking id, task, due at, owner ref, status                              | Accountable work checklist.                                            |

Example: a festival enquiry becomes a lead, then a follow-up, quote, confirmed booking, advance voucher, production plan, orders, and final settlement.

## 13. Marketplace Orders

Marketplace support is an optional channel. It must use official partner contracts and must not copy a partner's full data model.

| ID  | Table                             | Mark | Key fields                                                                     | Why and where                                                |
| --- | --------------------------------- | ---- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| X01 | `qcafe_marketplace_connections`   | I    | location id, provider, external store ref, status, configuration ref           | Swiggy, Zomato, or another supported marketplace connection. |
| X02 | `qcafe_marketplace_menu_mappings` | I    | connection id, menu item or variant id, external item ref, status              | Maps Q Cafe menu records to partner records.                 |
| X03 | `qcafe_marketplace_orders`        | I    | connection id, external order ref, order id, external status, received at      | Idempotent partner order intake linked to the normal order.  |
| X04 | `qcafe_marketplace_events`        | I    | marketplace order id, event type, payload reference, received at, processed at | Stores verified webhook processing history.                  |
| X05 | `qcafe_marketplace_settlements`   | I    | connection id, external settlement ref, period, gross, fees, net, status       | Reconciles marketplace collections.                          |

## 14. Printers, Documents, Delivery, Devices, and Sync

| ID  | Table                       | Mark | Key fields                                                                                            | Why and where                                                                                               |
| --- | --------------------------- | ---- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| P01 | `qcafe_printer_profiles`    | C    | location id, name, transport, device ref, printer name or address, capabilities, active               | Printer configuration. Transport is `windows_service`, `web_gateway`, `bluetooth`, `network`, or `browser`. |
| P02 | `qcafe_printer_routes`      | C    | location id, document kind, station or channel scope, printer profile id, copies, priority            | Routes receipt, voucher, KOT, token, and report jobs to the correct printer.                                |
| P03 | `qcafe_print_jobs`          | C    | document kind and ref, route id, render mode, transport, status, requested at, correlation id         | Durable print request. Render mode is `preview` or `direct`.                                                |
| P04 | `qcafe_print_attempts`      | C    | print job id, attempt number, device ref, request ref, response code, error, started and completed at | Records every send, retry, acknowledgement, failure, and operator action.                                   |
| P05 | `qcafe_document_files`      | C    | document kind and ref, storage object ref, checksum, format, rendered at                              | Immutable PDF or print-ready document reference.                                                            |
| P06 | `qcafe_document_deliveries` | G    | document file id, channel, recipient reference, consent ref, status, provider ref, delivered at       | Email PDF, WhatsApp share, or another approved customer delivery channel.                                   |
| P07 | `qcafe_device_profiles`     | G    | platform device ref, location id, device kind, mode, active                                           | Counter, kitchen display, mobile handheld, scanner, or local print host profile.                            |
| P08 | `qcafe_sync_cursors`        | G    | device profile id, stream name, last version, acknowledged at                                         | Per-device synchronization progress.                                                                        |
| P09 | `qcafe_sync_conflicts`      | G    | entity type and id, local version, remote version, status, resolution ref                             | Explicit conflict queue for offline mobile or desktop changes.                                              |

### 14.1 Print rules

| Case                          | Required record sequence                                                                              | Rule                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Receipt with preview          | Receipt -> rendered document -> preview print job -> operator confirms -> print attempt               | Preview is a user action. The document cannot change after rendering.                              |
| Direct Windows print          | Receipt or KOT -> rendered document -> direct print job -> Windows service attempt -> acknowledgement | The Windows service prints with no preview. It must return an idempotency reference.               |
| Web printer gateway           | Document -> routed print job -> gateway attempt -> acknowledgement or failure                         | Gateway identity and printer routing are controlled by the adapter.                                |
| Bluetooth or wireless printer | Document -> routed print job -> device attempt -> acknowledgement or retry                            | Availability is local-device dependent. Keep the job pending until it is acknowledged or rerouted. |
| Network printer               | Document -> routed print job -> network attempt -> acknowledgement or failure                         | Do not mark complete merely because the socket opened.                                             |
| Email PDF or WhatsApp PDF     | Render document -> delivery record -> provider attempt -> delivered or failed status                  | Use consent and an approved adapter. Store no provider secret in Q Cafe.                           |

## 15. Required End-to-End Flows

### 15.1 Standard POS sale

| Step                | Records involved     | Outcome                                                                      |
| ------------------- | -------------------- | ---------------------------------------------------------------------------- |
| 1. Start shift      | F04, B12             | Business day and cash custody are open.                                      |
| 2. Load menu        | M01-M13              | Only active, available items and effective prices are offered.               |
| 3. Open order       | O01, O02, O04        | A cashier creates an order for counter, table, parcel, or QR channel.        |
| 4. Prepare          | K01-K05 when enabled | Items route to KOT stations. Non-prepared items bypass KOT.                  |
| 5. Fulfil           | O05, O06 or O07      | Order is served, collected, or dispatched.                                   |
| 6. Bill and collect | B01-B07              | Bill, payment, receipt, and document exist before printing.                  |
| 7. Deliver receipt  | P01-P06              | Print preview, direct print, email PDF, or WhatsApp share is tracked.        |
| 8. Settle           | B13-B15, F09         | Cashier closes shift and outlet closes business day with a full event trail. |

### 15.2 Booking to dine-in sale

| Step                 | Records involved | Outcome                                                       |
| -------------------- | ---------------- | ------------------------------------------------------------- |
| 1. Reserve           | S05-S08          | Customer, booking, assigned table, and booking history exist. |
| 2. Seat guest        | S03-S04, S08     | A table session starts and can combine tables.                |
| 3. Serve and collect | O01-O05, B01-B07 | Normal POS and KOT flow applies.                              |
| 4. Close table       | S03, F09         | Table is available only after session close rules pass.       |

### 15.3 Festival or function sale

| Step                 | Records involved          | Outcome                                                           |
| -------------------- | ------------------------- | ----------------------------------------------------------------- |
| 1. Capture enquiry   | E01-E02                   | Owner has a dated follow-up, not a forgotten free-text note.      |
| 2. Quote and confirm | E03-E06                   | Quote becomes a confirmed event with requirements.                |
| 3. Take advance      | B05, B08-B09              | Payment and advance voucher are issued and later applied.         |
| 4. Plan and reserve  | I07-I09, K07-K08, E08-E09 | Event demand reserves stock before regular counter planning.      |
| 5. Deliver and close | E07, O01-O05, B01-B15     | Event orders, final bill, receipts, and settlement remain linked. |

### 15.4 Offline and multi-device flow

| Step                 | Records involved  | Outcome                                                                                             |
| -------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| 1. Register device   | P07               | Device has a location and operational mode.                                                         |
| 2. Make local change | Source table, F10 | Current state changes under concurrency control and emits a change record.                          |
| 3. Synchronize       | P08               | Device acknowledges ordered changes through the approved sync contract.                             |
| 4. Resolve collision | P09, F09          | A conflict is visible, assigned, and resolved. Financial postings never use silent last-write-wins. |

## 16. State Rules

| Subject           | Allowed progression                                             | Important prohibition                                                      |
| ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Order             | draft -> confirmed -> preparing -> ready -> fulfilled -> closed | A closed order changes only through approved adjustment or refund records. |
| Kitchen ticket    | new -> fired -> accepted -> preparing -> ready -> completed     | A printed KOT cannot disappear. Void or recall is an event.                |
| Reservation       | requested -> confirmed -> seated -> completed                   | Cancellation and no-show retain a reason and event history.                |
| Bill              | draft -> issued -> paid or part-paid -> settled                 | A posted bill is not edited in place.                                      |
| Payment           | initiated -> authorized -> captured or failed -> refunded       | Do not store card numbers or provider secrets.                             |
| Voucher           | issued -> partially applied -> fully applied or expired         | An advance cannot be silently converted into a discount.                   |
| Print job         | queued -> sent -> acknowledged or failed                        | A direct print needs an adapter acknowledgement.                           |
| Stock reservation | planned -> reserved -> consumed or released                     | Event and special reservations must reduce available planning stock.       |
| Shift             | open -> counted -> settled -> closed                            | Variance needs an explanation and approver.                                |

## 17. Phased Delivery Order

| Phase                             | Work items                                                                                         | Tables                                                     | Acceptance result                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 0. Contracts                      | Confirm platform identity, tenant, storage, audit, sync, printer, payment, and delivery contracts. | No new Q Cafe tables.                                      | Owners, API boundaries, and statutory constraints are approved.                          |
| 1. Counter core                   | F01-F06, F08-F09, M01-M05, M11-M12, O01-O06, B01-B07, B11-B15, P01-P05.                            | Core counter records.                                      | One outlet can sell a parcel, accept payment, print a receipt, and settle a shift.       |
| 2. Restaurant operations          | F07, M08-M10 and M13, S01-S09, K01-K08, I01-I09.                                                   | Seating, KOT, recipes, planning, reservations.             | A table sale routes to kitchen and daily planning can reserve stock.                     |
| 3. Events and advanced inventory  | I10-I16, B08-B10, E01-E09.                                                                         | Purchases, counts, waste, advance vouchers, events.        | A function moves from follow-up through advance, plan, service, and final collection.    |
| 4. Device and customer delivery   | P06-P09, M14-M15, S10.                                                                             | Document delivery, devices, sync, scanners, allergen data. | Mobile, desktop, and web clients can recover from offline work with recorded exceptions. |
| 5. Verified external integrations | O07, B16-B18, X01-X05.                                                                             | Delivery, accounting, and marketplace integration records. | Each adapter passes contract, retry, reconciliation, and support tests.                  |

## 18. Legacy Consolidation and Migration Plan

| Legacy group                           | Target approach      | Import rule                                                                                                |
| -------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Menu categories and menu items         | M01-M05, M11-M12     | Preserve legacy identifiers as import references. Rebuild prices as effective dated records.               |
| Orders and order lines                 | O01-O04              | Import closed records as historical orders and immutable lines. Preserve old number as a legacy reference. |
| Receipts and payment-like records      | B01-B07              | Import only verified monetary values. Unknown tender data is flagged for reconciliation.                   |
| Legacy KOT activity                    | K03-K05 where useful | Import as historical event data only. Do not infer missing ticket states.                                  |
| Staff records                          | F08                  | Map to existing platform identities only after an approved identity match.                                 |
| Browser table state and special prices | S03 and M06-M07      | Do not import transient browser state. Import only verified current table and campaign data.               |
| Legacy logs and sync columns           | F09-F10              | Keep historical raw source references. Do not treat legacy timestamps as complete audit evidence.          |

Migration runs must support a dry run, validation report, reconciliation totals, retryable import batches, and a signed cutover decision. Existing production data is read-only during reconciliation.

## 19. First Work After Approval

1. Confirm Phase 0 platform contracts and legal billing requirements for the first target location.
2. Build only the Phase 1 core schema and migrations in the Q Cafe app boundary.
3. Prove the standard parcel sale end to end: open order, add items, bill, cash or digital payment, receipt, direct or preview print, shift settlement, and event history.
4. Add Phase 2 only after the core flow has database, API, desktop, and recovery verification.

This sequence keeps the first release practical while preserving a clean route to restaurant, event, mobile, multi-location, and integration capabilities.
