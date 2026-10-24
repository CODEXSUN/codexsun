# Data Bridge live import verification

Completed: 2026-10-24T03:50:49.283Z

Core data and existing target business rows were preserved. Repository migrations created or upgraded Billing schema.
Source users, roles, permissions, migration history, activities, queued commands, events, and dashboard caches were not imported.
Both source databases and every pre-existing target business row passed independent hash checks.

| Tenant | Group | Tables | Source rows | Imported | Existing | Warnings |
|---|---|---:|---:|---:|---:|---:|
| SUKRAA | common | 31 | 520 | 0 | 520 | 0 |
| SUKRAA | masters | 16 | 206 | 0 | 205 | 1 |
| SUKRAA | billing | 23 | 1254 | 1253 | 0 | 1 |
| ALTEX | common | 31 | 405 | 0 | 405 | 0 |
| ALTEX | masters | 16 | 254 | 0 | 254 | 0 |
| ALTEX | billing | 23 | 4812 | 4812 | 0 | 0 |

## Invoice aggregate verification

| Source | Invoices matched | Item rows matched | Deleted history retained |
|---|---:|---:|---:|
| sukraa_cloud_db | 137/137 | 521 | 0 |
| altex_cloud_db | 184/184 | 690 | 5 |

Every invoice header, item, available compliance document, and other business child matched after foreign-ID translation.
Invoice subtotals, tax, and totals also reconcile to their source item sums.

Independent verification checked 140 tables and 354 relationships. No source row is missing and no foreign key is broken.
All 106 import jobs completed once under the correct target tenant context.

## Approved warnings

- SUKRAA product `SHORTS/`: source row 26 is soft-deleted. Target row 18 remains active, as approved.
- SUKRAA Billing company settings: target numbering, layout, and related settings remain unchanged. Source setting row 1 maps to target setting row 2.
- Existing target sales numbering uses four digits with a prefix. Source invoices keep their original numbers. Review future numbering settings separately.
- ALTEX retains five soft-deleted invoices and all their children. The active sales query excludes those five rows.
- Target dashboard snapshots refreshed during repository lifecycle work. They are derived runtime data and were not copied from source.

## Commit boundary

Imports commit per table through Queue Manager. Parent-first ordering and final aggregate comparison cover full invoices.
This result does not claim one transaction spanning an invoice and all its child tables.

## Local proof files

Proof files are under `dist/.cache/verification/billing-rehearsal/`.
Verified backup copies are under `D:/workspace/codexsun-backups/data-bridge/2026-10-24T03-26-33-611Z/`.
Backups contain private data and remain outside source control. All three disposable rehearsal databases were removed after verification.

## Evidence inventory

- `summary.json`
- `live-table-verification.json`
- `live-invoice-proof.json`
- `live-queue-proof.json`
- `preservation-proof.json`
- `backup-manifest.json`
- `source-invoice-balance-audit.json`
- `browser-stage-proof.json`

## Exact import order

| Order | Tenant | Group | Table | Source | Imported | Existing | Result |
|---:|---|---|---|---:|---:|---:|---|
| 1 | SUKRAA | common | core_countries | 6 | 0 | 6 | success |
| 2 | SUKRAA | common | core_states | 38 | 0 | 38 | success |
| 3 | SUKRAA | common | core_districts | 42 | 0 | 42 | success |
| 4 | SUKRAA | common | core_cities | 42 | 0 | 42 | success |
| 5 | SUKRAA | common | core_pincodes | 49 | 0 | 49 | success |
| 6 | SUKRAA | common | core_ledger_groups | 6 | 0 | 6 | success |
| 7 | SUKRAA | common | core_ledgers | 6 | 0 | 6 | success |
| 8 | SUKRAA | common | core_address_types | 4 | 0 | 4 | success |
| 9 | SUKRAA | common | core_bank_names | 158 | 0 | 158 | success |
| 10 | SUKRAA | common | core_contact_groups | 3 | 0 | 3 | success |
| 11 | SUKRAA | common | core_contact_types | 6 | 0 | 6 | success |
| 12 | SUKRAA | common | core_currencies | 3 | 0 | 3 | success |
| 13 | SUKRAA | common | core_months | 13 | 0 | 13 | success |
| 14 | SUKRAA | common | core_payment_terms | 4 | 0 | 4 | success |
| 15 | SUKRAA | common | core_priorities | 4 | 0 | 4 | success |
| 16 | SUKRAA | common | core_sales_types | 3 | 0 | 3 | success |
| 17 | SUKRAA | common | core_brands | 2 | 0 | 2 | success |
| 18 | SUKRAA | common | core_colours | 20 | 0 | 20 | success |
| 19 | SUKRAA | common | core_hsn_codes | 31 | 0 | 31 | success |
| 20 | SUKRAA | common | core_product_categories | 2 | 0 | 2 | success |
| 21 | SUKRAA | common | core_product_groups | 2 | 0 | 2 | success |
| 22 | SUKRAA | common | core_product_types | 3 | 0 | 3 | success |
| 23 | SUKRAA | common | core_sizes | 47 | 0 | 47 | success |
| 24 | SUKRAA | common | core_styles | 2 | 0 | 2 | success |
| 25 | SUKRAA | common | core_taxes | 5 | 0 | 5 | success |
| 26 | SUKRAA | common | core_units | 8 | 0 | 8 | success |
| 27 | SUKRAA | common | core_destinations | 2 | 0 | 2 | success |
| 28 | SUKRAA | common | core_stock_rejection_types | 3 | 0 | 3 | success |
| 29 | SUKRAA | common | core_transports | 2 | 0 | 2 | success |
| 30 | SUKRAA | common | core_warehouses | 2 | 0 | 2 | success |
| 31 | SUKRAA | common | core_work_order_types | 2 | 0 | 2 | success |
| 32 | SUKRAA | masters | core_companies | 1 | 0 | 1 | success |
| 33 | SUKRAA | masters | core_companies_addresses | 0 | 0 | 0 | empty |
| 34 | SUKRAA | masters | core_companies_bank_accounts | 0 | 0 | 0 | empty |
| 35 | SUKRAA | masters | core_companies_emails | 0 | 0 | 0 | empty |
| 36 | SUKRAA | masters | core_companies_phones | 0 | 0 | 0 | empty |
| 37 | SUKRAA | masters | core_companies_social_links | 0 | 0 | 0 | empty |
| 38 | SUKRAA | masters | core_contacts | 80 | 0 | 80 | success |
| 39 | SUKRAA | masters | core_contacts_addresses | 84 | 0 | 84 | success |
| 40 | SUKRAA | masters | core_contacts_bank_accounts | 0 | 0 | 0 | empty |
| 41 | SUKRAA | masters | core_contacts_emails | 0 | 0 | 0 | empty |
| 42 | SUKRAA | masters | core_contacts_phones | 0 | 0 | 0 | empty |
| 43 | SUKRAA | masters | core_contacts_social_links | 0 | 0 | 0 | empty |
| 44 | SUKRAA | masters | core_products | 38 | 0 | 37 | warning |
| 45 | SUKRAA | masters | core_work_orders | 1 | 0 | 1 | success |
| 46 | SUKRAA | masters | core_financial_years | 1 | 0 | 1 | success |
| 47 | SUKRAA | masters | core_default_company_settings | 1 | 0 | 1 | success |
| 48 | SUKRAA | billing | billing_company_settings | 1 | 0 | 0 | warning |
| 49 | SUKRAA | billing | billing_export_sales | 0 | 0 | 0 | empty |
| 50 | SUKRAA | billing | billing_export_sales_comments | 0 | 0 | 0 | empty |
| 51 | SUKRAA | billing | billing_export_sales_einvoices | 0 | 0 | 0 | empty |
| 52 | SUKRAA | billing | billing_export_sales_eway_bills | 0 | 0 | 0 | empty |
| 53 | SUKRAA | billing | billing_export_sales_items | 0 | 0 | 0 | empty |
| 54 | SUKRAA | billing | billing_gst_filings | 2 | 2 | 0 | success |
| 55 | SUKRAA | billing | billing_opening_balances | 0 | 0 | 0 | empty |
| 56 | SUKRAA | billing | billing_payments | 3 | 3 | 0 | success |
| 57 | SUKRAA | billing | billing_purchases | 185 | 185 | 0 | success |
| 58 | SUKRAA | billing | billing_payment_allocations | 0 | 0 | 0 | empty |
| 59 | SUKRAA | billing | billing_purchase_items | 289 | 289 | 0 | success |
| 60 | SUKRAA | billing | billing_quotations | 4 | 4 | 0 | success |
| 61 | SUKRAA | billing | billing_quotation_items | 47 | 47 | 0 | success |
| 62 | SUKRAA | billing | billing_receipts | 46 | 46 | 0 | success |
| 63 | SUKRAA | billing | billing_receipt_export_allocations | 0 | 0 | 0 | empty |
| 64 | SUKRAA | billing | billing_sales | 137 | 137 | 0 | success |
| 65 | SUKRAA | billing | billing_receipt_allocations | 0 | 0 | 0 | empty |
| 66 | SUKRAA | billing | billing_sales_comments | 0 | 0 | 0 | empty |
| 67 | SUKRAA | billing | billing_sales_einvoices | 10 | 10 | 0 | success |
| 68 | SUKRAA | billing | billing_sales_eway_bills | 9 | 9 | 0 | success |
| 69 | SUKRAA | billing | billing_sales_items | 521 | 521 | 0 | success |
| 70 | SUKRAA | billing | billing_settings | 0 | 0 | 0 | empty |
| 1 | ALTEX | common | core_countries | 6 | 0 | 6 | success |
| 2 | ALTEX | common | core_states | 38 | 0 | 38 | success |
| 3 | ALTEX | common | core_districts | 40 | 0 | 40 | success |
| 4 | ALTEX | common | core_cities | 30 | 0 | 30 | success |
| 5 | ALTEX | common | core_pincodes | 42 | 0 | 42 | success |
| 6 | ALTEX | common | core_ledger_groups | 2 | 0 | 2 | success |
| 7 | ALTEX | common | core_ledgers | 2 | 0 | 2 | success |
| 8 | ALTEX | common | core_address_types | 6 | 0 | 6 | success |
| 9 | ALTEX | common | core_bank_names | 158 | 0 | 158 | success |
| 10 | ALTEX | common | core_contact_groups | 3 | 0 | 3 | success |
| 11 | ALTEX | common | core_contact_types | 6 | 0 | 6 | success |
| 12 | ALTEX | common | core_currencies | 3 | 0 | 3 | success |
| 13 | ALTEX | common | core_months | 13 | 0 | 13 | success |
| 14 | ALTEX | common | core_payment_terms | 4 | 0 | 4 | success |
| 15 | ALTEX | common | core_priorities | 4 | 0 | 4 | success |
| 16 | ALTEX | common | core_sales_types | 3 | 0 | 3 | success |
| 17 | ALTEX | common | core_brands | 2 | 0 | 2 | success |
| 18 | ALTEX | common | core_colours | 6 | 0 | 6 | success |
| 19 | ALTEX | common | core_hsn_codes | 3 | 0 | 3 | success |
| 20 | ALTEX | common | core_product_categories | 3 | 0 | 3 | success |
| 21 | ALTEX | common | core_product_groups | 2 | 0 | 2 | success |
| 22 | ALTEX | common | core_product_types | 3 | 0 | 3 | success |
| 23 | ALTEX | common | core_sizes | 2 | 0 | 2 | success |
| 24 | ALTEX | common | core_styles | 2 | 0 | 2 | success |
| 25 | ALTEX | common | core_taxes | 5 | 0 | 5 | success |
| 26 | ALTEX | common | core_units | 6 | 0 | 6 | success |
| 27 | ALTEX | common | core_destinations | 2 | 0 | 2 | success |
| 28 | ALTEX | common | core_stock_rejection_types | 3 | 0 | 3 | success |
| 29 | ALTEX | common | core_transports | 2 | 0 | 2 | success |
| 30 | ALTEX | common | core_warehouses | 2 | 0 | 2 | success |
| 31 | ALTEX | common | core_work_order_types | 2 | 0 | 2 | success |
| 32 | ALTEX | masters | core_companies | 1 | 0 | 1 | success |
| 33 | ALTEX | masters | core_companies_addresses | 0 | 0 | 0 | empty |
| 34 | ALTEX | masters | core_companies_bank_accounts | 0 | 0 | 0 | empty |
| 35 | ALTEX | masters | core_companies_emails | 0 | 0 | 0 | empty |
| 36 | ALTEX | masters | core_companies_phones | 0 | 0 | 0 | empty |
| 37 | ALTEX | masters | core_companies_social_links | 0 | 0 | 0 | empty |
| 38 | ALTEX | masters | core_contacts | 62 | 0 | 62 | success |
| 39 | ALTEX | masters | core_contacts_addresses | 62 | 0 | 62 | success |
| 40 | ALTEX | masters | core_contacts_bank_accounts | 0 | 0 | 0 | empty |
| 41 | ALTEX | masters | core_contacts_emails | 0 | 0 | 0 | empty |
| 42 | ALTEX | masters | core_contacts_phones | 17 | 0 | 17 | success |
| 43 | ALTEX | masters | core_contacts_social_links | 0 | 0 | 0 | empty |
| 44 | ALTEX | masters | core_products | 34 | 0 | 34 | success |
| 45 | ALTEX | masters | core_work_orders | 76 | 0 | 76 | success |
| 46 | ALTEX | masters | core_financial_years | 1 | 0 | 1 | success |
| 47 | ALTEX | masters | core_default_company_settings | 1 | 0 | 1 | success |
| 48 | ALTEX | billing | billing_company_settings | 1 | 1 | 0 | success |
| 49 | ALTEX | billing | billing_export_sales | 0 | 0 | 0 | empty |
| 50 | ALTEX | billing | billing_export_sales_comments | 0 | 0 | 0 | empty |
| 51 | ALTEX | billing | billing_export_sales_einvoices | 0 | 0 | 0 | empty |
| 52 | ALTEX | billing | billing_export_sales_eway_bills | 0 | 0 | 0 | empty |
| 53 | ALTEX | billing | billing_export_sales_items | 0 | 0 | 0 | empty |
| 54 | ALTEX | billing | billing_gst_filings | 0 | 0 | 0 | empty |
| 55 | ALTEX | billing | billing_opening_balances | 0 | 0 | 0 | empty |
| 56 | ALTEX | billing | billing_payments | 33 | 33 | 0 | success |
| 57 | ALTEX | billing | billing_purchases | 1 | 1 | 0 | success |
| 58 | ALTEX | billing | billing_payment_allocations | 0 | 0 | 0 | empty |
| 59 | ALTEX | billing | billing_purchase_items | 1 | 1 | 0 | success |
| 60 | ALTEX | billing | billing_quotations | 983 | 983 | 0 | success |
| 61 | ALTEX | billing | billing_quotation_items | 2869 | 2869 | 0 | success |
| 62 | ALTEX | billing | billing_receipts | 50 | 50 | 0 | success |
| 63 | ALTEX | billing | billing_receipt_export_allocations | 0 | 0 | 0 | empty |
| 64 | ALTEX | billing | billing_sales | 184 | 184 | 0 | success |
| 65 | ALTEX | billing | billing_receipt_allocations | 0 | 0 | 0 | empty |
| 66 | ALTEX | billing | billing_sales_comments | 0 | 0 | 0 | empty |
| 67 | ALTEX | billing | billing_sales_einvoices | 0 | 0 | 0 | empty |
| 68 | ALTEX | billing | billing_sales_eway_bills | 0 | 0 | 0 | empty |
| 69 | ALTEX | billing | billing_sales_items | 690 | 690 | 0 | success |
| 70 | ALTEX | billing | billing_settings | 0 | 0 | 0 | empty |
