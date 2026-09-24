# Q Cafe Inventory Module

The inventory module owns stock units, stock items, stock adjustments, and the source-linked stock movement ledger.

It depends on `qcafe.foundation` and `qcafe.menu`.

QC-0601 exposes unit/item creation and adjustment controls. Every accepted adjustment posts one ledger movement per line with `source_type=adjustment` and the adjustment identifier. A stock reduction requires an approver. Items with tracking disabled cannot post movements.

QC-0602 exposes recipe creation and revision controls. Each recipe revision keeps its effective dates, revision number, source recipe link, and change reason. Components reference tracked stock items with positive milli quantities.
