# Billing Task Track

## Purpose

This file is the execution checklist for the billing app.

It exists because billing now needs its own delivery track separate from ecommerce. Treat this as the working task list for building `apps/billing` into a full accounting software boundary.

## What Billing Means In This Repository

`apps/billing` is not just invoice entry.

It is the app that should own:

1. accounting masters
2. voucher posting
3. books and reports
4. receivables and payables
5. tax and compliance workflows
6. inventory-accounting policy
7. finance operations and controls

## Current Baseline Already Present

- [x] category masters
- [x] ledger masters
- [x] voucher-group masters
- [x] voucher-type masters
- [x] sales vouchers
- [x] purchase vouchers
- [x] payment vouchers
- [x] receipt vouchers
- [x] contra vouchers
- [x] journal vouchers
- [x] GST-aware sales and purchase auto-posting
- [x] bill-wise allocation for receipts and payments
- [x] trial balance
- [x] profit and loss
- [x] balance sheet
- [x] bill outstanding summary

## Blockers To Solve First

### Stage B1: Accounting Integrity

- [x] B1.1 define voucher lifecycle states: `draft`, `posted`, `cancelled`, `reversed`
- [x] B1.2 prevent silent mutation of posted accounting records
- [x] B1.3 implement reversal workflow instead of destructive correction
- [x] B1.4 add lock-date and financial-period validation
- [x] B1.5 add audit logging for create, post, reverse, cancel, and delete actions

### Stage B2: Posting Data Model

- [x] B2.1 define normalized accounting storage for voucher headers
- [x] B2.2 define normalized accounting storage for voucher lines
- [x] B2.3 define immutable posted ledger-entry storage
- [x] B2.4 rebuild accounting reports from posted entries
- [x] B2.5 preserve source traceability from reports back to voucher origin

### Stage B3: Missing Core Accounting Documents

- [x] B3.1 implement credit note workflow
- [x] B3.2 implement debit note workflow
- [x] B3.3 link note documents to original invoice or bill where applicable
- [x] B3.4 support tax-aware adjustment and reversal treatment
- [x] B3.5 expose note registers and detail views in the billing workspace

## Core Accounting Operations

### Stage B4: Books And Statements

- [x] B4.1 add general ledger report
- [ ] B4.2 add ledger account statement
- [x] B4.3 add customer statement
- [x] B4.4 add supplier statement
- [x] B4.5 add day-book refinement with posted-state filtering
- [x] B4.6 add voucher drill-down from statements into source posting

### Stage B5: Receivable And Payable Control

- [x] B5.1 add receivable aging report
- [x] B5.2 add payable aging report
- [x] B5.3 add bill settlement follow-up workflow
- [x] B5.4 add overpayment, advance, and on-account handling clarity
- [x] B5.5 add party-wise collection and payment summaries

### Stage B6: Bank And Cash Control

- [x] B6.1 add bank book
- [x] B6.2 add cash book
- [x] B6.3 add bank reconciliation workflow
- [x] B6.4 add cleared date, statement reference, and mismatch handling
- [x] B6.5 add reconciliation reports

## Compliance And Commercial Documents

### Stage B7: GST And Tax

- [ ] B7.1 add GST sales register
- [ ] B7.2 add GST purchase register
- [ ] B7.3 add input vs output tax summary
- [ ] B7.4 add tax-period filters and filing-ready summaries
- [ ] B7.5 replace mock-only posture with explicit live or manual-compliance mode

### Stage B8: Sales And Purchase Document Maturity

- [ ] B8.1 add sales return workflow
- [ ] B8.2 add purchase return workflow
- [ ] B8.3 add invoice print and export templates
- [ ] B8.4 add document numbering policy controls
- [ ] B8.5 add approval or review flow for sensitive finance documents

## Inventory And Accounting Integration

### Stage B9: Stock Accounting Foundation

- [ ] B9.1 decide inventory authority between `billing` and shared masters in `core`
- [ ] B9.2 define stock ledger model
- [ ] B9.3 define valuation method policy
- [ ] B9.4 add stock-to-account posting rules
- [ ] B9.5 add warehouse-wise stock position reporting

### Stage B10: Commercial Inventory Operations

- [ ] B10.1 add purchase-to-stock accounting bridge
- [ ] B10.2 add sales-to-stock reduction accounting bridge
- [ ] B10.3 add stock adjustment workflow
- [ ] B10.4 add landed-cost handling
- [ ] B10.5 add stock valuation report

## Control, Close, And Audit

### Stage B11: Accounting Controls

- [ ] B11.1 add maker-checker or approval policy for high-risk actions
- [ ] B11.2 add role model for accountant, finance manager, auditor, cashier, and operator
- [ ] B11.3 add branch, project, or cost-center accounting dimensions
- [ ] B11.4 add exception reporting for altered, reversed, or back-dated entries
- [ ] B11.5 add finance dashboard KPIs

### Stage B12: Period Close And Audit

- [ ] B12.1 add month-end checklist
- [ ] B12.2 add financial-year close workflow
- [ ] B12.3 add opening-balance rollover policy
- [ ] B12.4 add audit trail review surface
- [ ] B12.5 add year-end adjustment and carry-forward controls

## Framework, CxApp, and Core Improvements (Errors & Fixes)

### Stage F1: Framework Improvements & Fixes
- [ ] F1.1 Fix edge cases in runtime database driver switching (MariaDB/SQLite/PostgreSQL)
- [ ] F1.2 Improve dependency injection resolution and prevent cyclic dependencies in `apps/framework`
- [ ] F1.3 Add strict validation for workspace metadata during app suite registration
- [ ] F1.4 Standardize error handling and HTTP response mapping across internal and external APIs

### Stage C1: CxApp (Base Shell) Improvements & Fixes
- [ ] C1.1 Fix UI layout jumps and flash-of-unstyled-content during shell handoff and auth routing
- [ ] C1.2 Audit and fix browser-side session persistence and token refresh lifecycle
- [ ] C1.3 Enforce strict role and permission checks across all `/internal/v1/cxapp/*` protected routes
- [ ] C1.4 Improve operator-facing interface error states when composed apps fail to load

### Stage M1: Core (Master Modules) Improvements & Fixes
- [ ] M1.1 Fix inventory authority enforcement: ensure sellable quantity never drops below zero during storefront reads
- [ ] M1.2 Audit contact and product master entities for strict relational integrity
- [ ] M1.3 Optimize shared ERP contracts and reduce redundant database queries for master records
- [ ] M1.4 Validate category and ledger master immutability once referenced by posted vouchers

## Stage R1: Audit and Final Review (Pre-Release)

- [ ] R1.1 Perform cross-app ownership audit (ensure `apps/ui` has no business logic, `apps/api` only owns routes, etc.)
- [ ] R1.2 Verify all active reference numbers are aligned across `TASK.md`, `PLANNING.md`, `CHANGELOG.md`, and branches
- [ ] R1.3 Run full test suite covering auth lifecycle, demo installers, and workspace baseline assembly
- [ ] R1.4 Finalize documentation review against `ARCHITECTURE.md` single source of truth

## First Recommended Build Order

If work starts now, solve in this order:

1. Stage `B1`
2. Stage `B2`
3. Stage `B3`
4. Stage `B6`
5. Stage `B4`
6. Stage `B5`
7. Stage `B7`
8. Stage `B9`
9. Stage `B10`
10. Stage `B11`
11. Stage `B12`
12. Stage `F1`
13. Stage `C1`
14. Stage `M1`
15. Stage `R1`

## Validation Standard For Billing Changes

Every accounting change should aim to run:

1. `npm run typecheck`
2. `npm run lint`
3. targeted billing tests under `tests/billing`
4. `npm run build`


## Delivery Rule

Do not treat billing as production-grade accounting software until Stages `B1` and `B2` are complete. Those two stages are the trust boundary for all later reporting and compliance work.
