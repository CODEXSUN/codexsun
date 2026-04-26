## Inventory Engine

This engine is the first reusable stock foundation in the new architecture base.

Current scope:
- inventory engine manifest
- warehouse contract
- warehouse-location contract
- stock-movement contract
- stock-reservation contract
- topology, transfer, putaway, movement-event, and availability contracts
- identity contracts for stock unit, batch, serial, and barcode
- identity policy and numbering-rule contracts
- adapter boundaries for billing, core, ecommerce, and cxapp
- translation contracts for billing, core, ecommerce, and cxapp consumption
- service ports for movement posting, transfer execution, reservation execution, putaway, and availability projection
- runtime diagnostics for persisted movements, putaway tasks, transfers, reservations, and availability inspection

Planned later scope:
- warehouse topology rules
- movement ledger services
- reservation and allocation rules
- availability projection
- transfer workflows

Non-goal for this batch:
- migrating current live stock logic out of `apps/billing`

Current engine-owned runtime helpers:
- `runtime-services.ts` for persisted MVP write and availability behavior
- `runtime-diagnostics.ts` for record inspection without adding transport routes yet
