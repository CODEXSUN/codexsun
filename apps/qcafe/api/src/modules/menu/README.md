# Q Cafe Menu Module

The menu module owns categories, items, variants, prices, availability, modifiers, and item media metadata.

It depends on `qcafe.foundation` for business/location scope and the public activity recorder contract.

## Current Contracts

- `qcafe.menu.catalog.v1` manages categories, items, variants, price books, and dated prices.
- `qcafe.menu.effective-price.v1` selects the most specific eligible price for item, variant, location, service channel, and business date.

The module owns the `qcafe_menu_*` and `qcafe_price_books` tables and the `/api/v1/qcafe/menu` routes. Prices use integer minor units. A location/channel price wins over a general price; later effective dates break ties.

## Persisted Schema

`qcafe.menu.001` created the first catalog tables. The append-only `qcafe.menu.002` migration completes the M01-M15 schema from `apps/qcafe/agent/exec/qcafe-table.md`:

| Range | Records |
| --- | --- |
| M01-M05 | Categories, items, variants, scoped price books, and effective prices |
| M06-M07 | Scheduled special campaigns and their item or variant prices |
| M08-M10 | Modifier groups, options, and item or variant assignments |
| M11-M12 | Storage-backed media metadata and menu media assignments |
| M13 | Location, channel, variant, and time-window availability |
| M14-M15 | Allergen tags and item or variant allergen assignments |

The migration is schema readiness, not behavioral completion. Availability, modifiers, media, campaigns, and allergens remain unavailable to clients until their manager contracts, validation, authorization, audit events, and screens are implemented in the ordered Phase 1 tasks.
