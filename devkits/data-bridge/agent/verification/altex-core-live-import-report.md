# Altex live Core import report

**altex_cloud_db → altex_db**
Completed: 2026-10-23T13:48:06.499Z

**659 imported · 0 existing · 0 warnings · 0 failed tables**

All 47 Core tables processed in foreign-key parent order. Empty tables have no source records.
Saved business values and row counts match: true.
Foreign-key relationships checked: 31; orphan references: 0.
Queue jobs completed: true (39 jobs).
Source data unchanged: true.

Target generates IDs, UUIDs and creation/update metadata. Foreign keys refer to the resolved destination parents. Existing rows are preserved.

| Table | Source | Imported | Existing | Warnings | Target | Result | Saved audit |
|---|---:|---:|---:|---:|---:|---|---|
| core_address_types | 6 | 6 | 0 | 0 | 6 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=2210af2a-59b8-41bf-b1b8-b0c5386fda9d) |
| core_bank_names | 158 | 158 | 0 | 0 | 158 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=eccc2dee-8d55-423d-834d-2a770ac69050) |
| core_brands | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=9fe6c7d2-ee16-449f-91bc-ab661f88d2bc) |
| core_colours | 6 | 6 | 0 | 0 | 6 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=f7417346-40e5-4e21-882d-203e8bad2c0b) |
| core_companies | 1 | 1 | 0 | 0 | 1 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=adb1213e-0e99-439a-a95e-01e9fe3b43c5) |
| core_companies_addresses | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_companies_bank_accounts | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_companies_emails | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_companies_phones | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_companies_social_links | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_contact_groups | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=4e811109-55ef-47eb-a7a7-f92353bce07b) |
| core_contact_types | 6 | 6 | 0 | 0 | 6 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=79db0e8d-1d6d-437a-a3db-c1136916c339) |
| core_contacts | 62 | 62 | 0 | 0 | 62 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=1ffaed84-afff-49cf-b672-c635c1bddd6c) |
| core_contacts_bank_accounts | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_contacts_emails | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_contacts_phones | 17 | 17 | 0 | 0 | 17 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=f113cc65-8b52-4a81-b420-b6fb72c11b25) |
| core_contacts_social_links | 0 | 0 | 0 | 0 | 0 | empty | No source rows |
| core_countries | 6 | 6 | 0 | 0 | 6 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=f3bbaf22-56ab-458d-814d-87f88b904d4c) |
| core_currencies | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=1b7d573d-ee7c-45b2-b424-01889759fb59) |
| core_destinations | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=b7be6980-af82-44ae-953a-fbc3641ed69b) |
| core_financial_years | 1 | 1 | 0 | 0 | 1 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=5ebe0267-6b2b-4969-bf6e-a7e9c0fecb7d) |
| core_default_company_settings | 1 | 1 | 0 | 0 | 1 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=22443dda-6284-43af-8f76-29e184c1533c) |
| core_hsn_codes | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=0ed84e49-2477-469e-9d31-1485833c6ad3) |
| core_ledger_groups | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=623b0751-77af-43a0-bff1-7ef0908078a6) |
| core_ledgers | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=467923ea-463e-4436-a612-c8c464f40456) |
| core_months | 13 | 13 | 0 | 0 | 13 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=b70ce2bb-a1cc-46b6-addd-d6ebf80d5b81) |
| core_payment_terms | 4 | 4 | 0 | 0 | 4 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=a258c8e0-7be6-46c7-8cf0-660720d5e72b) |
| core_priorities | 4 | 4 | 0 | 0 | 4 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=f42d138c-dc49-48a4-b489-278a24858612) |
| core_product_categories | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=f2341b8f-0bc4-4ce0-93dc-e709222b49dc) |
| core_product_groups | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=92721fb9-fa3d-4f7e-9fd2-0a72c1d3b9bc) |
| core_product_types | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=582e5359-dd5e-4da2-806b-93527e855da1) |
| core_sales_types | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=cf645165-dd90-499f-b7c2-5d549803d057) |
| core_sizes | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=d2493908-c81a-417e-b8a3-c5bab5f653c3) |
| core_states | 38 | 38 | 0 | 0 | 38 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=4260d011-4bfe-4a70-976a-f933c7f0c996) |
| core_districts | 40 | 40 | 0 | 0 | 40 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=f26f0308-3fd5-40ee-b1b1-29f6a3a2bac6) |
| core_cities | 30 | 30 | 0 | 0 | 30 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=aba58a0e-ace4-4b63-93db-d70c0953f978) |
| core_pincodes | 42 | 42 | 0 | 0 | 42 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=d634b0a1-ed14-4609-ad30-dffac6b71c93) |
| core_contacts_addresses | 62 | 62 | 0 | 0 | 62 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=97ee7d3a-bb8e-4ecb-8fe4-7bf819eeaeda) |
| core_stock_rejection_types | 3 | 3 | 0 | 0 | 3 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=344b0571-1042-4c04-a308-a92d97c14fd5) |
| core_styles | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=cdeaf4df-1fd4-411a-bc21-d8783d791526) |
| core_taxes | 5 | 5 | 0 | 0 | 5 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=2d9921d0-dd57-4767-a1d2-4d534bc6014c) |
| core_transports | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=b36cd066-fe85-46e7-ad31-e4c92bb43d1b) |
| core_units | 6 | 6 | 0 | 0 | 6 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=3ff1d7c0-8f2a-4b8c-bba6-a5f641d3d5d3) |
| core_products | 34 | 34 | 0 | 0 | 34 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=a3b2ef90-8efe-47ed-90ef-2dd2bf6260a6) |
| core_warehouses | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=791aedcd-65e3-4549-8c18-332933598ab6) |
| core_work_orders | 76 | 76 | 0 | 0 | 76 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=63074c82-7309-4035-9a66-6ced8b6f39a2) |
| core_work_order_types | 2 | 2 | 0 | 0 | 2 | success | [View rows](http://127.0.0.1:7020/sa/data-bridge-results?transfer=2857da0a-9a52-4ca4-9128-891cb49994c0) |