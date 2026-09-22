# Orship Infras Module

This module owns Orship infrastructure records.

It stores generic Orship records in SQLite at `storage/apps/devkits/orship/private/data/orship_db.sqlite`.

The first record kind is `infras`. Each record has a numeric `id`, a `uuid`, a `kind`, and a JSON payload.
