# Billing Split-Table Execution Track

## Purpose

This task file covers the split-table execution model described in
`ASSIST/Database/BILLING.md`.

The target is clear:

1. keep `billing_vouchers` as the raw source-of-truth
2. use normalized header and ledger tables for shared accounting control
3. use voucher-type split tables and item sub-tables for fast operational queries
4. stop loading large voucher JSON payloads when a report only needs one voucher family

## Current Reality

Already present:

- [x] raw JSON voucher store
- [x] voucher headers
- [x] voucher lines
- [x] ledger entries
- [x] first-level split voucher tables
- [x] bank book and cash book split tables

Still missing from the documented split-table model:

- [x] itemized split sub-tables for sales, purchase, receipt, payment, journal, and contra
- [x] bill reference register
- [x] bill settlement ledger
- [x] overdue tracking table
- [ ] report cutover to use split tables instead of raw voucher scans where applicable
- [ ] focused tests proving split tables stay in sync across create, update, delete, reverse, and review flows

## Delivery Order

### Stage T5.1: Item Split Tables

- [x] add sales item split table
- [x] add purchase item split table
- [x] add receipt allocation split table
- [x] add payment allocation split table
- [x] add journal line split table
- [x] add contra line split table
- [x] sync those rows from `voucher-split-store.ts`

### Stage T5.2: Bill Engine Tables

- [x] add `billing_bill_references`
- [x] add `billing_bill_settlements`
- [x] add `billing_bill_overdue_tracking`
- [x] define write rules from sales, purchase, receipt, payment, debit note, and credit note

### Stage T5.3: Query Cutover

- [ ] move sales register drill queries to split sales tables
- [ ] move purchase register drill queries to split purchase tables
- [ ] move receipt/payment settlement analysis to allocation split tables
- [ ] move journal drill views to journal item split table
- [ ] move contra detail views to contra item split table

### Stage T5.4: Integrity And Validation

- [ ] add sync validation tests for split voucher tables
- [ ] add reverse/delete lifecycle coverage for item tables
- [ ] add migration registration and prepare-path verification
- [ ] confirm typecheck and targeted billing tests stay green

## First Implementation Step

Implement Stage `T5.1` first.

That gives immediate performance value because item-heavy voucher families
can be queried by their own narrow tables without deserializing the full
voucher payload collection into memory.
