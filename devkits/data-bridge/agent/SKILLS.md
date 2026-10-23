# Data Bridge working rules

Read the Data Bridge README, TASK, and PLAN with the repository Agent Guide and governance rules before changing this owner.

## Ownership and safety

- Keep common-table import behavior, preview, schema checks, snapshots, and import status inside Data Bridge.
- Platform owns authentication, Super Admin navigation/composition, and registered-tenant connection resolution.
- Data Migration owns saved external sources and encrypted source credentials. Use its public server-side access contract; never import its private repository or return a resolved secret to a client.
- Common Tables uses the fixed Core allowlist. Guided transfers discover source and target base tables from the selected databases. Validate live table/field metadata, require transactional destination tables, quote identifiers, and bind row values. Resolve declared foreign references through business identity or an unambiguous full business-record match; never copy source parent IDs as destination identity. Block required sensitive fields and ambiguous relationships.
- Preserve target records on duplicate keys. Do not add merge, overwrite, delete, or truncate behavior without a separate contract and tests.
- Treat saved row snapshots as sensitive migration data and verify imports only against disposable databases.

## Verification

Run API/web checks, `node tools/check-module-boundaries.mjs data-bridge`, Platform composition checks, component docs, dependency layout checks, and isolated database/browser tests before claiming the workflow works.
