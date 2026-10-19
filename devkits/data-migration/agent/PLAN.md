# Data Migration plan

The DevKit owns encrypted external MariaDB source connections, transfer validation, copy execution, and run history. Migration Settings owns the UI for external host, port, database, user, TLS, and saved secret changes. Platform supplies Super Admin identity, registered destination tenant database connections, master lifecycle composition, and desk navigation. The first delivery copies one table at a time into an existing empty table. Future larger migrations require a durable queue, batch checkpoints, and documented dependency ordering.

The Platform composition adapter may supply its configured MariaDB server connection to Migration Settings as a source preset. Only host, port, and username are returned to the browser; the API tests and encrypts the server-side password. Database discovery continues to exclude the Platform master database.

Before production use, verify schema upgrade on an existing master, two disposable tenant databases, rollback on conflict, super-admin denial, and the Super Admin browser desk.
