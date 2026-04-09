# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing.spec.ts >> billing workspace loads after login and exposes voucher/report screens
- Location: tests\e2e\billing.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('cell', { name: 'SAL-2026-001' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('cell', { name: 'SAL-2026-001' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - link "Codexsun Commerce" [ref=e7] [cursor=pointer]:
          - /url: /admin/dashboard
          - img "Codexsun Commerce" [ref=e10]
        - generic [ref=e11]:
          - generic [ref=e14]:
            - link "Category" [ref=e16] [cursor=pointer]:
              - /url: /dashboard/billing/categories
              - img [ref=e17]
              - generic [ref=e21]: Category
            - link "Ledger" [ref=e23] [cursor=pointer]:
              - /url: /dashboard/billing/chart-of-accounts
              - img [ref=e24]
              - generic [ref=e28]: Ledger
            - link "Voucher Group" [ref=e30] [cursor=pointer]:
              - /url: /dashboard/billing/voucher-groups
              - img [ref=e31]
              - generic [ref=e34]: Voucher Group
            - link "Voucher Type" [ref=e36] [cursor=pointer]:
              - /url: /dashboard/billing/voucher-types
              - img [ref=e37]
              - generic [ref=e39]: Voucher Type
            - link "Sales" [ref=e41] [cursor=pointer]:
              - /url: /dashboard/billing/sales-vouchers
              - img [ref=e42]
              - generic [ref=e44]: Sales
            - link "Purchase" [ref=e46] [cursor=pointer]:
              - /url: /dashboard/billing/purchase-vouchers
              - img [ref=e47]
              - generic [ref=e49]: Purchase
            - link "Payment" [ref=e51] [cursor=pointer]:
              - /url: /dashboard/billing/payment-vouchers
              - img [ref=e52]
              - generic [ref=e54]: Payment
            - link "Receipt" [ref=e56] [cursor=pointer]:
              - /url: /dashboard/billing/receipt-vouchers
              - img [ref=e57]
              - generic [ref=e59]: Receipt
            - link "Journal" [ref=e61] [cursor=pointer]:
              - /url: /dashboard/billing/journal-vouchers
              - img [ref=e62]
              - generic [ref=e64]: Journal
            - link "Contra" [ref=e66] [cursor=pointer]:
              - /url: /dashboard/billing/contra-vouchers
              - img [ref=e67]
              - generic [ref=e69]: Contra
            - link "Credit Note" [ref=e71] [cursor=pointer]:
              - /url: /dashboard/billing/credit-note
              - img [ref=e72]
              - generic [ref=e74]: Credit Note
            - link "Sales Return" [ref=e76] [cursor=pointer]:
              - /url: /dashboard/billing/sales-return
              - img [ref=e77]
              - generic [ref=e80]: Sales Return
            - link "Debit Note" [ref=e82] [cursor=pointer]:
              - /url: /dashboard/billing/debit-note
              - img [ref=e83]
              - generic [ref=e85]: Debit Note
            - link "Purchase Return" [ref=e87] [cursor=pointer]:
              - /url: /dashboard/billing/purchase-return
              - img [ref=e88]
              - generic [ref=e91]: Purchase Return
            - link "Stock" [ref=e93] [cursor=pointer]:
              - /url: /dashboard/billing/stock
              - img [ref=e94]
              - generic [ref=e97]: Stock
            - link "Statements" [ref=e99] [cursor=pointer]:
              - /url: /dashboard/billing/statements
              - img [ref=e100]
              - generic [ref=e103]: Statements
            - link "GST Sales Register" [ref=e105] [cursor=pointer]:
              - /url: /dashboard/billing/gst-sales-register
              - img [ref=e106]
              - generic [ref=e109]: GST Sales Register
            - link "GST Purchase Register" [ref=e111] [cursor=pointer]:
              - /url: /dashboard/billing/gst-purchase-register
              - img [ref=e112]
              - generic [ref=e115]: GST Purchase Register
            - link "Input vs Output Tax" [ref=e117] [cursor=pointer]:
              - /url: /dashboard/billing/input-output-tax-summary
              - img [ref=e118]
              - generic [ref=e121]: Input vs Output Tax
            - link "Voucher Register" [ref=e123] [cursor=pointer]:
              - /url: /dashboard/billing/voucher-register
              - img [ref=e124]
              - generic [ref=e126]: Voucher Register
            - link "Day Book" [ref=e128] [cursor=pointer]:
              - /url: /dashboard/billing/day-book
              - img [ref=e129]
              - generic [ref=e132]: Day Book
            - link "Double Entry" [ref=e134] [cursor=pointer]:
              - /url: /dashboard/billing/double-entry
              - img [ref=e135]
              - generic [ref=e139]: Double Entry
            - link "Bank Book" [ref=e141] [cursor=pointer]:
              - /url: /dashboard/billing/bank-book
              - img [ref=e142]
              - generic [ref=e145]: Bank Book
            - link "Cash Book" [ref=e147] [cursor=pointer]:
              - /url: /dashboard/billing/cash-book
              - img [ref=e148]
              - generic [ref=e151]: Cash Book
            - link "Bank Reconciliation" [ref=e153] [cursor=pointer]:
              - /url: /dashboard/billing/bank-reconciliation
              - img [ref=e154]
              - generic [ref=e157]: Bank Reconciliation
            - link "Trial Balance" [ref=e159] [cursor=pointer]:
              - /url: /dashboard/billing/trial-balance
              - img [ref=e160]
              - generic [ref=e163]: Trial Balance
            - link "P & L" [ref=e165] [cursor=pointer]:
              - /url: /dashboard/billing/profit-and-loss
              - img [ref=e166]
              - generic [ref=e169]: P & L
            - link "Balance Sheet" [ref=e171] [cursor=pointer]:
              - /url: /dashboard/billing/balance-sheet
              - img [ref=e172]
              - generic [ref=e175]: Balance Sheet
            - link "Month-End Checklist" [ref=e177] [cursor=pointer]:
              - /url: /dashboard/billing/month-end-checklist
              - img [ref=e178]
              - generic [ref=e181]: Month-End Checklist
            - link "Financial-Year Close" [ref=e183] [cursor=pointer]:
              - /url: /dashboard/billing/financial-year-close
              - img [ref=e184]
              - generic [ref=e187]: Financial-Year Close
            - link "Audit Trail" [ref=e189] [cursor=pointer]:
              - /url: /dashboard/billing/audit-trail
              - img [ref=e190]
              - generic [ref=e193]: Audit Trail
            - link "Bill Outstanding" [ref=e195] [cursor=pointer]:
              - /url: /dashboard/billing/bill-outstanding
              - img [ref=e196]
              - generic [ref=e199]: Bill Outstanding
            - link "Ledger Guide" [ref=e201] [cursor=pointer]:
              - /url: /dashboard/billing/support/ledger-guide
              - img [ref=e202]
              - generic [ref=e205]: Ledger Guide
            - link "Backend" [ref=e207] [cursor=pointer]:
              - /url: /dashboard/apps/billing/backend
              - img [ref=e208]
              - generic [ref=e211]: Backend
            - link "Structure" [ref=e213] [cursor=pointer]:
              - /url: /dashboard/apps/billing/structure
              - img [ref=e214]
              - generic [ref=e217]: Structure
            - link "Web" [ref=e219] [cursor=pointer]:
              - /url: /dashboard/apps/billing/web
              - img [ref=e220]
              - generic [ref=e223]: Web
            - link "API" [ref=e225] [cursor=pointer]:
              - /url: /dashboard/apps/billing/api
              - img [ref=e226]
              - generic [ref=e230]: API
            - link "Database" [ref=e232] [cursor=pointer]:
              - /url: /dashboard/apps/billing/database
              - img [ref=e233]
              - generic [ref=e237]: Database
          - generic [ref=e240]:
            - link "Media Manager" [ref=e242] [cursor=pointer]:
              - /url: /dashboard/media
              - img [ref=e243]
              - generic [ref=e248]: Media Manager
            - link "Mail Service" [ref=e250] [cursor=pointer]:
              - /url: /dashboard/mail-service
              - img [ref=e251]
              - generic [ref=e254]: Mail Service
            - link "Users" [ref=e256] [cursor=pointer]:
              - /url: /dashboard/settings/users
              - img [ref=e257]
              - generic [ref=e262]: Users
            - link "Roles" [ref=e264] [cursor=pointer]:
              - /url: /dashboard/settings/roles
              - img [ref=e265]
              - generic [ref=e268]: Roles
            - link "Permissions" [ref=e270] [cursor=pointer]:
              - /url: /dashboard/settings/permissions
              - img [ref=e271]
              - generic [ref=e274]: Permissions
            - link "Companies" [ref=e276] [cursor=pointer]:
              - /url: /dashboard/settings/companies
              - img [ref=e277]
              - generic [ref=e281]: Companies
            - link "Core Settings" [ref=e283] [cursor=pointer]:
              - /url: /dashboard/settings/core-settings
              - img [ref=e284]
              - generic [ref=e287]: Core Settings
            - link "Audit Log" [ref=e289] [cursor=pointer]:
              - /url: /dashboard/settings/activity-log
              - img [ref=e290]
              - generic [ref=e293]: Audit Log
            - link "Alerts Dashboard" [ref=e295] [cursor=pointer]:
              - /url: /dashboard/settings/alerts-dashboard
              - img [ref=e296]
              - generic [ref=e301]: Alerts Dashboard
            - link "Data Backup" [ref=e303] [cursor=pointer]:
              - /url: /dashboard/settings/data-backup
              - img [ref=e304]
              - generic [ref=e308]: Data Backup
            - link "Queue Manager" [ref=e310] [cursor=pointer]:
              - /url: /dashboard/settings/queue-manager
              - img [ref=e311]
              - generic [ref=e315]: Queue Manager
            - link "Security Review" [ref=e317] [cursor=pointer]:
              - /url: /dashboard/settings/security-review
              - img [ref=e318]
              - generic [ref=e321]: Security Review
            - link "System Update" [ref=e323] [cursor=pointer]:
              - /url: /dashboard/system-update
              - img [ref=e324]
              - generic [ref=e329]: System Update
        - button "Sundar S" [ref=e333] [cursor=pointer]:
          - generic [ref=e334]:
            - img "Sundar" [ref=e335]
            - generic [ref=e336]: S
    - main [ref=e337]:
      - generic [ref=e338]:
        - generic [ref=e340]:
          - generic [ref=e341]:
            - button "Toggle sidebar" [ref=e342] [cursor=pointer]:
              - generic [ref=e343]: Toggle sidebar
            - generic [ref=e349]:
              - button "Billing" [ref=e350] [cursor=pointer]:
                - img
                - generic [ref=e351]: Billing
                - img
              - generic [ref=e352]: /
              - heading "Bill Outstanding" [level=1] [ref=e353]
          - generic [ref=e354]:
            - button "1" [ref=e355] [cursor=pointer]:
              - img
              - generic [ref=e356]: "1"
            - link "Home" [ref=e357] [cursor=pointer]:
              - /url: /
            - button "Open theme settings" [ref=e358] [cursor=pointer]:
              - img
              - generic [ref=e359]: Open theme settings
            - button "Logout" [ref=e360] [cursor=pointer]
        - main [ref=e361]:
          - generic [ref=e362]:
            - generic [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e366]: Business app
                - generic [ref=e367]: Signed in as Sundar (admin)
              - generic [ref=e369]:
                - heading "Billing" [level=1] [ref=e370]
                - paragraph [ref=e371]: Accounting, vouchers, inventory, ledgers, billing documents, and reporting foundations. This workspace reads from apps/billing/src and apps/billing/web.
            - generic [ref=e372]:
              - generic [ref=e374]:
                - generic [ref=e375]: Bill Outstanding
                - generic [ref=e376]: Receivable and payable control view covering open bills, aging, follow-up, overpayment or on-account exceptions, and party-wise settlement summaries.
              - generic [ref=e377]:
                - generic [ref=e379]:
                  - paragraph [ref=e380]: Receivables
                  - paragraph [ref=e381]: ₹0
                  - paragraph [ref=e382]: Open sales bills after receipt adjustments.
                - generic [ref=e384]:
                  - paragraph [ref=e385]: Payables
                  - paragraph [ref=e386]: ₹0
                  - paragraph [ref=e387]: Open purchase bills after payment adjustments.
                - generic [ref=e389]:
                  - paragraph [ref=e390]: Open bills
                  - paragraph [ref=e391]: "0"
                  - paragraph [ref=e392]: Each item tracks original, settled, and outstanding values.
                - generic [ref=e394]:
                  - paragraph [ref=e395]: Exceptions
                  - paragraph [ref=e396]: "0"
                  - paragraph [ref=e397]: Advance, on-account, and overpayment cases needing operator attention.
              - generic [ref=e398]:
                - generic [ref=e399]:
                  - generic [ref=e400]:
                    - generic [ref=e401]: Receivable Aging
                    - generic [ref=e402]: Sales-side dues as of 2026-03-31.
                  - generic [ref=e403]:
                    - generic [ref=e404]:
                      - generic [ref=e405]: Current
                      - generic [ref=e406]: ₹0
                    - generic [ref=e407]:
                      - generic [ref=e408]: 1-30 Days
                      - generic [ref=e409]: ₹0
                    - generic [ref=e410]:
                      - generic [ref=e411]: 31-60 Days
                      - generic [ref=e412]: ₹0
                    - generic [ref=e413]:
                      - generic [ref=e414]: 61-90 Days
                      - generic [ref=e415]: ₹0
                    - generic [ref=e416]:
                      - generic [ref=e417]: 91+ Days
                      - generic [ref=e418]: ₹0
                - generic [ref=e419]:
                  - generic [ref=e420]:
                    - generic [ref=e421]: Payable Aging
                    - generic [ref=e422]: Purchase-side dues as of 2026-03-31.
                  - generic [ref=e423]:
                    - generic [ref=e424]:
                      - generic [ref=e425]: Current
                      - generic [ref=e426]: ₹0
                    - generic [ref=e427]:
                      - generic [ref=e428]: 1-30 Days
                      - generic [ref=e429]: ₹0
                    - generic [ref=e430]:
                      - generic [ref=e431]: 31-60 Days
                      - generic [ref=e432]: ₹0
                    - generic [ref=e433]:
                      - generic [ref=e434]: 61-90 Days
                      - generic [ref=e435]: ₹0
                    - generic [ref=e436]:
                      - generic [ref=e437]: 91+ Days
                      - generic [ref=e438]: ₹0
              - generic [ref=e439]:
                - generic [ref=e440]:
                  - generic [ref=e441]: Settlement Follow-up
                  - generic [ref=e442]: Open bills ranked by overdue position and collection or payment action.
                - table [ref=e445]:
                  - rowgroup [ref=e446]:
                    - row "Voucher Counterparty Due Overdue Priority Outstanding Action" [ref=e447]:
                      - columnheader "Voucher" [ref=e448]
                      - columnheader "Counterparty" [ref=e449]
                      - columnheader "Due" [ref=e450]
                      - columnheader "Overdue" [ref=e451]
                      - columnheader "Priority" [ref=e452]
                      - columnheader "Outstanding" [ref=e453]
                      - columnheader "Action" [ref=e454]
                  - rowgroup
              - generic [ref=e455]:
                - generic [ref=e456]:
                  - generic [ref=e457]:
                    - generic [ref=e458]: Settlement Exceptions
                    - generic [ref=e459]: Advance, on-account, and overpayment positions needing explicit treatment.
                  - generic [ref=e460]:
                    - generic [ref=e461]:
                      - generic [ref=e463]:
                        - paragraph [ref=e464]: Advance
                        - paragraph [ref=e465]: ₹0
                        - paragraph [ref=e466]: New-reference settlements recorded before bill matching.
                      - generic [ref=e468]:
                        - paragraph [ref=e469]: On account
                        - paragraph [ref=e470]: ₹0
                        - paragraph [ref=e471]: Unmatched on-account settlements still pending allocation.
                      - generic [ref=e473]:
                        - paragraph [ref=e474]: Overpayment
                        - paragraph [ref=e475]: ₹0
                        - paragraph [ref=e476]: Collections or payments exceeding original bill value.
                    - table [ref=e478]:
                      - rowgroup [ref=e479]:
                        - row "Voucher Counterparty Category Reference Amount Note" [ref=e480]:
                          - columnheader "Voucher" [ref=e481]
                          - columnheader "Counterparty" [ref=e482]
                          - columnheader "Category" [ref=e483]
                          - columnheader "Reference" [ref=e484]
                          - columnheader "Amount" [ref=e485]
                          - columnheader "Note" [ref=e486]
                      - rowgroup
                - generic [ref=e487]:
                  - generic [ref=e488]:
                    - generic [ref=e489]: Party-wise Collection and Payment Summary
                    - generic [ref=e490]: Receipt and payment behavior summarized by counterparty.
                  - table [ref=e493]:
                    - rowgroup [ref=e494]:
                      - row "Counterparty Receipts Payments Allocated Unallocated" [ref=e495]:
                        - columnheader "Counterparty" [ref=e496]
                        - columnheader "Receipts" [ref=e497]
                        - columnheader "Payments" [ref=e498]
                        - columnheader "Allocated" [ref=e499]
                        - columnheader "Unallocated" [ref=e500]
                    - rowgroup
              - generic [ref=e501]:
                - generic [ref=e502]:
                  - generic [ref=e503]: Open Bills
                  - generic [ref=e504]: Detailed bill-wise exposure as of 2026-03-31.
                - table [ref=e507]:
                  - rowgroup [ref=e508]:
                    - row "Voucher Type Counterparty Due Overdue Original Settled Outstanding" [ref=e509]:
                      - columnheader "Voucher" [ref=e510]
                      - columnheader "Type" [ref=e511]
                      - columnheader "Counterparty" [ref=e512]
                      - columnheader "Due" [ref=e513]
                      - columnheader "Overdue" [ref=e514]
                      - columnheader "Original" [ref=e515]
                      - columnheader "Settled" [ref=e516]
                      - columnheader "Outstanding" [ref=e517]
                  - rowgroup
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test"
  2  | 
  3  | test("billing workspace loads after login and exposes voucher/report screens", async ({
  4  |   page,
  5  | }) => {
  6  |   await page.goto("/login?next=/dashboard/billing")
  7  | 
  8  |   await page.getByLabel("Email").fill("sundar@sundar.com")
  9  |   await page.getByLabel("Password").fill("Kalarani1@@")
  10 |   await page.getByRole("button", { name: "Login" }).click()
  11 | 
  12 |   await expect(page).toHaveURL(/\/dashboard\/billing$/)
  13 |   await expect(page.getByText("Billing Menu", { exact: true })).toBeVisible()
  14 | 
  15 |   await page.locator('[data-slot="sidebar"]').getByRole("link", { name: "Voucher Register", exact: true }).click()
  16 |   await expect(page).toHaveURL(/\/dashboard\/billing\/voucher-register$/)
  17 |   await expect(page.getByRole("button", { name: "New Voucher" })).toBeVisible()
  18 |   await expect(page.getByPlaceholder("Search vouchers")).toBeVisible()
  19 | 
  20 |   await page.goto("/dashboard/billing/trial-balance")
  21 |   await expect(page.getByRole("heading", { name: "Trial Balance" })).toBeVisible()
  22 |   await expect(page.getByRole("cell", { name: "Sales Account", exact: true })).toBeVisible()
  23 | 
  24 |   await page.goto("/dashboard/billing/bill-outstanding")
  25 |   await expect(page.getByRole("heading", { name: "Bill Outstanding" })).toBeVisible()
> 26 |   await expect(page.getByRole("cell", { name: "SAL-2026-001" })).toBeVisible()
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  27 | })
  28 | 
  29 | test("billing ledger master updates from popup without invalid payload errors", async ({
  30 |   page,
  31 | }) => {
  32 |   await page.goto("/login?next=/dashboard/billing/chart-of-accounts")
  33 | 
  34 |   await page.getByLabel("Email").fill("sundar@sundar.com")
  35 |   await page.getByLabel("Password").fill("Kalarani1@@")
  36 |   await page.getByRole("button", { name: "Login" }).click()
  37 | 
  38 |   await expect(page).toHaveURL(/\/dashboard\/billing\/chart-of-accounts$/)
  39 |   await expect(page.getByRole("button", { name: "New Ledger" })).toBeVisible()
  40 | 
  41 |   await page.getByRole("cell", { name: "Cash-in-Hand", exact: true }).waitFor()
  42 |   await page.getByRole("button", { name: "Open ledger actions" }).first().click()
  43 |   await page.getByRole("menuitem", { name: "Edit" }).click()
  44 | 
  45 |   await expect(page.getByRole("heading", { name: "Update ledger master" })).toBeVisible()
  46 |   const updateResponse = await Promise.all([
  47 |     page.waitForResponse(
  48 |       (response) =>
  49 |         response.request().method() === "PATCH" &&
  50 |         response.url().includes("/internal/v1/billing/ledger?")
  51 |     ),
  52 |     page.getByRole("button", { name: "Update ledger" }).click(),
  53 |   ]).then(([response]) => response)
  54 | 
  55 |   expect(updateResponse.status()).toBe(200)
  56 |   await expect(page.getByText("Invalid request payload.")).toHaveCount(0)
  57 |   await expect(page.getByRole("heading", { name: "Update ledger master" })).toHaveCount(0)
  58 |   await expect(page.getByRole("cell", { name: "Cash-in-Hand", exact: true })).toBeVisible()
  59 | })
  60 | 
```