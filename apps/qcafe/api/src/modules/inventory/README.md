# Q Cafe Inventory Module

The inventory module owns stock units, stock items, stock adjustments, and the source-linked stock movement ledger.

It depends on `qcafe.foundation` and `qcafe.menu`.

QC-0601 exposes unit/item creation and adjustment controls. Every accepted adjustment posts one ledger movement per line with `source_type=adjustment` and the adjustment identifier. A stock reduction requires an approver. Items with tracking disabled cannot post movements.

QC-0602 exposes recipe creation and revision controls. Each recipe revision keeps its effective dates, revision number, source recipe link, and change reason. Components reference tracked stock items with positive milli quantities.

QC-0603 exposes daily plans and plan lines. Each plan is unique per location and date. Every plan line identifies its demand source (`regular`, `special`, `booking`, or `event`) with an optional demand reference. Only draft plans accept lines.

QC-0604 exposes stock reservations for confirmed events, daily plans, specials, and approved orders. An active reservation reduces available planning stock (`available = on-hand - reserved`) without posting a ledger movement. Release and consume resolve the hold; only active reservations can be resolved.

QC-0605 exposes purchase orders (draft/sent/partial/received/cancelled), goods receipts with lot assignment, stock lots, stock counts, and waste events. Receipts post `purchase_in` ledger movements linked to the receipt. Count variances post `count_in`/`count_out` movements and require a reason plus approver; waste posts `waste_out` and always requires a reason plus approver. Migration `006` lifts the ledger `source_id` foreign key so purchase, count, and waste sources can link their records while preserving all existing rows.

QC-0606 exposes recipe consumption for final sales and event plans. Consumption resolves the active recipe for the menu item or variant on the given date, explodes components by portion count, checks available planning stock (on-hand minus active reservations), and posts `consumption_out` ledger movements linked to a consumption record that traces the sale or event source. Procurement and consumption persistence lives in `repository/inventory-procurement.repository.ts` to keep each authored file within the 700-line limit.
