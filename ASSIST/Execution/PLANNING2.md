# Billing Planning Track

## Purpose

This file is the dedicated planning track for `apps/billing`.

Use it to define the real billing roadmap separately from the ecommerce execution sheet. Treat `apps/billing` as a full accounting product boundary, not just a voucher-entry screen.

## What Billing Is

`apps/billing` is the accounting, books, reporting, compliance, and inventory-facing business app for Codexsun.

In target form, billing should operate as a full accounting software product with:

1. chart of accounts
2. voucher entry and posting
3. party receivables and payables
4. sales and purchase invoicing
5. credit note and debit note flows
6. stock-aware accounting hooks
7. tax and GST compliance
8. statements, books, and operational registers
9. period close and year-end controls
10. audit-safe accounting reports

## Current Repository Baseline

Implemented now inside `apps/billing`:

1. category masters
2. ledger masters
3. voucher-group masters
4. voucher-type masters
5. voucher posting for `payment`, `receipt`, `sales`, `purchase`, `contra`, and `journal`
6. GST-aware auto-posting for sales and purchase vouchers
7. bill allocation support for receipts and payments
8. mock e-invoice and e-way bill generation hooks
9. accounting reports:
   - trial balance
   - profit and loss
   - balance sheet
   - bill outstanding
10. migrations, seeders, workspace routes, and focused voucher-service tests

## Current Gaps

The current billing app is a strong accounting baseline, but it is not yet a full production-grade accounting software.

Major gaps:

1. no explicit posting state, approval state, lock date, or period-close control
2. vouchers are stored through app JSON-store payloads rather than normalized accounting tables and ledger-entry tables
3. no immutable journal-entry ledger for audit-grade posting traceability
4. no reversal, cancellation, void, or amendment workflow
5. no credit note or debit note implementation despite workspace placeholders
6. no full sales or purchase return workflow
7. no bank reconciliation workflow
8. no payment follow-up, dunning, or aging analysis
9. no tax return, GST register, input-credit, or filing-oriented reporting
10. no inventory valuation, stock ledger, or stock-account bridge
11. no cost center, branch, project, or department accounting dimensions
12. no invoice print/export, document numbering policy controls, or document templates
13. no month-end or year-end close process
14. no strict audit trail for edit/delete/repost activity
15. no role-based billing operator model documented for accounting segregation of duties

## First Blockers To Solve

These are the first blockers because they affect accounting correctness and auditability, not just UX completeness.

### Blocker 1: Posting Integrity Model

Problem:

- the current voucher model behaves like editable business documents, but a full accounting app needs explicit posting discipline
- posted accounting records must be traceable, controlled, and reversible without silent history rewrite

Required outcome:

1. define voucher lifecycle states such as `draft`, `posted`, `cancelled`, and `reversed`
2. define who can edit before posting and what is immutable after posting
3. define reversal workflow instead of destructive correction
4. define lock-date and financial-period rules

### Blocker 2: Ledger Entry Storage Model

Problem:

- today the app stores voucher payloads, but not a durable journal-entry layer suitable for audit, reporting rebuilds, and reconciliation

Required outcome:

1. introduce normalized accounting persistence for voucher headers, voucher lines, and posted ledger entries
2. make reports derive from posted entries, not from mutable document payload alone
3. preserve traceable source links from report rows back to voucher and line origins

### Blocker 3: Credit Note And Debit Note Implementation

Problem:

- these routes exist in the billing workspace plan, but live accounting behavior is not implemented

Required outcome:

1. define accounting treatment for customer credit notes and supplier debit notes
2. support tax-aware reversal or adjustment logic
3. connect note documents to original invoices or bills where applicable

### Blocker 4: Bank Reconciliation And Statement Trust

Problem:

- payment and receipt vouchers exist, but there is no reconciliation layer to prove bank-book correctness

Required outcome:

1. add bank book and reconciliation workflow
2. track cleared date, statement reference, and unreconciled items
3. expose reconciliation reports and mismatch handling

### Blocker 5: Inventory And Accounting Boundary

Problem:

- billing is supposed to own inventory behavior, but stock valuation and stock-account posting rules are not yet formalized

Required outcome:

1. decide whether inventory authority stays fully in `apps/billing` or is shared with `apps/core`
2. define stock ledger, valuation method, and accounting posting rules
3. define sales, purchase, return, and adjustment stock impacts

## Canonical Decisions For Billing Work

1. `apps/billing` owns accounting logic, voucher rules, finance reports, inventory-accounting policy, and compliance reporting behavior.
2. `apps/core` may continue to own shared masters such as product and contact records, but accounting ownership stays in `apps/billing`.
3. `apps/api` owns route transport only; billing business rules remain inside `apps/billing/src/services`.
4. financial writes must be explicit, traceable, reversible, and audit-safe.
5. billing work must not claim production-grade accounting completeness until posting controls, audit trails, and close-process rules are implemented.

## Execution Strategy

Build billing in waves, with blocker removal before convenience features.

### Wave 1: Accounting Core Hardening

1. define voucher lifecycle and posting policy
2. introduce immutable posted-entry model
3. add reversal and cancellation rules
4. add lock-date and financial-period controls
5. add audit logging for accounting-critical actions

### Wave 2: Core Accounting Operations

1. implement credit note workflow
2. implement debit note workflow
3. implement sales return and purchase return handling
4. add bank and cash book refinement
5. add reconciliation workflows

### Wave 3: Books, Statements, And Compliance

1. general ledger
2. ledger account statement
3. customer statement
4. supplier statement
5. GST sales, purchase, and tax registers
6. aging reports
7. document print and export support

### Wave 4: Inventory And Commercial Accounting

1. stock ledger
2. item valuation
3. warehouse-level stock position
4. stock-to-account posting bridge
5. landed cost and adjustment handling

### Wave 5: Controls And Maturity

1. branch and cost-center accounting dimensions
2. budgeting support
3. approvals and maker-checker controls
4. month-end and year-end close
5. audit, exception, and compliance review tooling

## Recommended First Implementation Batch

The first real billing batch should solve the accounting model before adding more pages.

Recommended first batch:

1. define voucher lifecycle states
2. add posted vs draft behavior
3. add reversal support
4. add lock-date config and enforcement
5. update reports so they are explicitly based on posted records only

## Validation Standard For Billing Changes

Every accounting change should aim to run:

1. `npm run typecheck`
2. `npm run lint`
3. targeted billing tests under `tests/billing`
4. `npm run build`

Minimum extra checks for accounting model changes:

1. balanced entry validation
2. posting immutability validation
3. reversal behavior validation
4. period-lock validation
5. report correctness validation

## Current Delivery Batch

### `#67` 2026-04-08

Scope completed in this batch:

1. finished Stage `B1` accounting integrity with lifecycle states, immutability, reversal workflow, lock-date and closed-period validation, and billing audit logging
2. finished Stage `B2` posting-model hardening with normalized voucher headers, voucher lines, immutable posted ledger entries, report rebuilding from posted entries, and report traceability back to voucher origin
3. finished Stage `B3` note-document maturity with first-class credit note and debit note workflows, source-document linkage, GST-aware note treatment, and explicit note register/detail surfaces
4. completed Stage `B4.1` by adding a general ledger report derived from normalized posted ledger entries

Validation run for this batch:

1. `npm run typecheck`
2. `npx.cmd tsx --test tests\\billing\\voucher-service.test.ts tests\\billing\\reporting-service.test.ts tests\\api\\internal\\routes.test.ts`

## Risks

1. adding more billing screens before hardening posting rules will create UX breadth without accounting trust
2. continuing with mutable document-only storage will make later audit-grade migration harder
3. inventory features will remain ambiguous until valuation and ownership rules are explicit
4. GST and compliance claims must stay clearly labeled as baseline or mock until live integrations and filing-grade reports exist

## Definition Of Billing Success

Billing can be treated as a full accounting product only when:

1. books are posted through controlled states
2. posted entries are immutable and reversible
3. reports are rebuildable from traceable entries
4. bank, receivable, payable, tax, and stock-linked accounting flows are operational
5. audit and period-close controls exist
