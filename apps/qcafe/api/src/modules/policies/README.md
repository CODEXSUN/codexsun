# Q Cafe Policies Module

The policies module owns operational role policies for cashier, waiter, kitchen, manager, and owner users.

It depends on `qcafe.foundation` and the Platform identity contracts. It writes no business tables.

QC-0902 exposes the role-to-permission matrix and the API authorization guard. Effective permissions combine the actor's resolved identity permissions with the matrix of every assigned operational role. Denied actions throw before any service runs, and routes translate the denial to HTTP 403. Money-sensitive billing endpoints (refunds, reversals, cash movements, shift settlement, and day close) enforce the guard.
