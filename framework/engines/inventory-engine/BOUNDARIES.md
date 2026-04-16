## Inventory Engine Boundaries

This file defines how app layers should consume the inventory engine without reversing ownership.

### Billing Boundary

`apps/billing` remains the owner of:
- purchase receipt
- goods inward
- accounting valuation posting
- stock-affecting voucher workflows

`inventory-engine` should provide:
- movement contracts
- putaway contracts
- transfer contracts
- reservation and availability contracts

Rule:
- billing may translate its purchase, inward, issue, return, and adjustment workflows into inventory-engine movement inputs
- inventory-engine must not import billing services or billing persistence directly

### Core Boundary

`apps/core` remains the owner of:
- product master identity
- aggregate stock read models until migration replaces them

`inventory-engine` should provide:
- availability projections
- warehouse and location identities
- movement-derived stock facts

Rule:
- core should consume inventory-engine output as a read-model source
- inventory-engine must not take ownership of product master creation or product content management

### Ecommerce Boundary

`apps/ecommerce` remains the owner of:
- checkout reservation requests
- fulfilment-facing order context
- delivery and return-facing customer state

`inventory-engine` should provide:
- reservation contracts
- allocation contracts later
- availability facts

Rule:
- ecommerce may request holds, releases, and allocation-related operations through engine-facing adapters
- inventory-engine must not own storefront UX, cart UX, or customer delivery workflows

### CxApp Boundary

`cxapp` remains the owner of:
- shell composition
- workspace navigation
- cross-app route orchestration

`inventory-engine` should provide:
- manifests
- neutral engine contracts
- engine-facing metadata later if needed

Rule:
- cxapp may compose inventory-related app surfaces
- cxapp must not absorb inventory business rules

### Migration Guardrail

Migration should follow this order:

1. define engine contracts
2. define app adapters
3. add translation layers inside consuming apps
4. move one use case at a time
5. remove old ownership only after new flows are working
