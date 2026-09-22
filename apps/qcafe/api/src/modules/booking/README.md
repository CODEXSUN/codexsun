# Q Cafe Booking Module

The booking module owns dining areas, tables, table sessions, customers, reservations, guest QR access, scanner profiles, and function sales.

It depends on the foundation, POS, and billing contracts. The module uses billing vouchers for event advances and links event orders to the POS lifecycle.

The append-only lifecycle creates these records in order:

- `qcafe.booking.001`: dining areas, tables, sessions, and session tables.
- `qcafe.booking.002`: customers, reservations, reservation tables, reservation events, table QR tokens, and scanner profiles.
- `qcafe.booking.003`: event leads, follow-ups, bookings, requirements, quotes, quote lines, linked orders, schedules, and tasks.
- `qcafe.booking.seed.001`: repeat-safe event quote sequence defaults.

The API rejects overlapping confirmed reservations for the same table. Seating creates a table session and POS order in one workflow. Public QR resolution exposes guest-safe labels only, and QR rotation revokes the previous token. Event completion requires linked orders to be settled and all tasks and schedule items to be complete.
