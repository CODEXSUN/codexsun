# Q Cafe Kitchen Module

The kitchen module owns stations, item routes, kitchen tickets, ticket lines, and preparation events.

It depends on `qcafe.foundation`, `qcafe.menu`, and `qcafe.pos`.

The `qcafe.kitchen.001` migration creates K01-K05 records and append-only KOT print attempts.

An item route sends each prepared order line to one station. Order confirmation creates one ticket for each selected station. Ticket actions support accept, prepare, ready, serve, recall, and void transitions.

Each print or reprint request creates a new print attempt. Phase 7 will connect these requests to printer profiles and device services.
