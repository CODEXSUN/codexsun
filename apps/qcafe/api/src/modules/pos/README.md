# Q Cafe POS Module

The POS module owns restaurant orders, order lines, fulfillment jobs, adjustments, notes, and takeaway details.

It depends on `qcafe.foundation` and `qcafe.menu`.

The `qcafe.pos.001` migration creates durable O01-O09 records. The order keeps item, variant, price, and modifier snapshots.

The API supports order creation, line changes, line removal, hold, resume, confirmation, cancellation, and fulfillment. The server selects the sale price. Each state change also records an order event and an activity event.

Takeaway orders use the normal order record. A fulfillment job stores the collection name, contact reference, pickup window, and pickup code.
