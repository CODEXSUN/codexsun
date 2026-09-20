# Q Cafe Menu Module

The menu module owns categories, items, variants, prices, availability, modifiers, and item media metadata.

It depends on `qcafe.foundation` for business/location scope and the public activity recorder contract.

## Current Contracts

- `qcafe.menu.catalog.v1` manages categories, items, variants, price books, and dated prices.
- `qcafe.menu.effective-price.v1` selects the most specific eligible price for item, variant, location, service channel, and business date.
- `qcafe.menu.media.v1` stores private image bytes through Platform Storage and owns only their references, checksums, dimensions, status, usage, and item assignments in M11-M12.
- `qcafe.menu.availability.v1` manages M13 outlet, channel, variant, and time-window rules and exposes the saleability guard used before an order accepts an item.
- `qcafe.menu.customization.v1` manages M08-M10 modifier groups, options, and item assignments together with M14-M15 allergen tags and item declarations.
- `qcafe.menu.saleability.v1` makes the final server-side sale decision from catalog status, outlet and channel scope, price-book eligibility, effective price, availability, and required modifier configuration.
- `qcafe.menu.campaign-pricing.v1` manages M06-M07 scheduled campaigns and resolves their fixed-price or percentage rules over an eligible normal price.

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

The migration and Menu behavior are complete for M01-M15. Manager workflows cover catalog records, price books, normal prices, campaigns, media, availability, modifiers, and allergens.

Availability defaults to available when no rule matches. Rules are restricted to one outlet. Variant rules outrank item-wide rules, channel rules outrank outlet-wide rules, and the latest start time breaks ties. End times are exclusive.

Modifier groups enforce bounded selection counts. Options use minor-unit price adjustments and may retain an inventory reference. Modifier and allergen assignments are idempotent so a retried command does not duplicate an item or variant relationship.

The saleability endpoint returns a deterministic list of blocking reason codes and the selected price and availability rule. POS must call `assertSaleable` before accepting an order line; the browser result is diagnostic and never grants sale authority.

Campaigns use inclusive start and exclusive end times. An active campaign overlays, but never replaces, a valid normal price. Higher priority wins, followed by variant and outlet specificity. Usage-limited rules stop resolving when their recorded count reaches the limit. Duplicate item or variant rules inside one campaign are rejected.

Focused tests prove inclusive price start and end dates, later-price precedence, business-scoped duplicate codes, inactive category/item/variant/price-book rejection, inclusive availability starts, exclusive availability ends, and outlet/channel scope validation.
