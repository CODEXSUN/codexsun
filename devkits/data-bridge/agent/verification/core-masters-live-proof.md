# Core Masters live migration verification

Verified: 2026-10-23T16:39:05.109Z

The import preserves existing target values. Common parents run before master and child tables.

## ALTEX

Source: altex_cloud_db → altex_db. Result: **success**.
Verified existing rows: 659. Warnings: 0. Orphan references: 0 across 31 relationships.
Source unchanged: true. Repeat inserted zero rows.

| Master table | Source | Verified | Warnings | Status |
|---|---:|---:|---:|---|
| core_companies | 1 | 1 | 0 | success |
| core_companies_addresses | 0 | 0 | 0 | success |
| core_companies_bank_accounts | 0 | 0 | 0 | success |
| core_companies_emails | 0 | 0 | 0 | success |
| core_companies_phones | 0 | 0 | 0 | success |
| core_companies_social_links | 0 | 0 | 0 | success |
| core_contacts | 62 | 62 | 0 | success |
| core_contacts_addresses | 62 | 62 | 0 | success |
| core_contacts_bank_accounts | 0 | 0 | 0 | success |
| core_contacts_emails | 0 | 0 | 0 | success |
| core_contacts_phones | 17 | 17 | 0 | success |
| core_contacts_social_links | 0 | 0 | 0 | success |
| core_products | 34 | 34 | 0 | success |
| core_work_orders | 76 | 76 | 0 | success |
| core_financial_years | 1 | 1 | 0 | success |
| core_default_company_settings | 1 | 1 | 0 | success |


## SUKRAA

Source: sukraa_cloud_db → sukraa_db. Result: **warning**.
Verified existing rows: 724. Warnings: 2. Orphan references: 0 across 31 relationships.
Source unchanged: true. Repeat inserted zero rows.

| Master table | Source | Verified | Warnings | Status |
|---|---:|---:|---:|---|
| core_companies | 1 | 1 | 0 | success |
| core_companies_addresses | 0 | 0 | 0 | success |
| core_companies_bank_accounts | 0 | 0 | 0 | success |
| core_companies_emails | 0 | 0 | 0 | success |
| core_companies_phones | 0 | 0 | 0 | success |
| core_companies_social_links | 0 | 0 | 0 | success |
| core_contacts | 80 | 80 | 0 | success |
| core_contacts_addresses | 84 | 84 | 0 | success |
| core_contacts_bank_accounts | 0 | 0 | 0 | success |
| core_contacts_emails | 0 | 0 | 0 | success |
| core_contacts_phones | 0 | 0 | 0 | success |
| core_contacts_social_links | 0 | 0 | 0 | success |
| core_products | 38 | 37 | 1 | warning |
| core_work_orders | 1 | 1 | 0 | success |
| core_financial_years | 1 | 1 | 0 | success |
| core_default_company_settings | 1 | 0 | 1 | warning |

- core_products, source ID 1: differing fields unit_id. Existing unique key (name) has different selected values. Kept existing row; skipped import.
- core_default_company_settings, source ID 1: differing fields company_id, landing_app. Existing unique key (singleton_key) has different selected values. Kept existing row; skipped import.
