# Q Cafe Task Guide

## Session Rules

1. Read `apps/qcafe/agent/skills.md`.
2. Keep changes inside `apps/qcafe`.
3. Use package public contracts for shared capabilities.
4. Start hosts through root `dev:qcafe-api` and `dev:qcafe-web` commands.
5. Run the application tests and `node tools/check-root-layout.mjs`.

## Product Goal

Build Q Cafe as a complete restaurant POS, KOT, and booking application.

Q Cafe must support dine-in, takeaway, delivery, counter sales, table service,
kitchen tickets, reservations, payments, settlement, and restaurant reports.

## Phase 1: Product Foundation

1. Define the Q Cafe module map.
2. Create owner modules for POS, KOT, booking, menu, tables, payments, and reports.
3. Document each module owner, public contracts, and dependencies.
4. Add typed API contracts for health, catalog, and workspace bootstrap data.
5. Add a web shell for the restaurant dashboard inside the shared MDI workspace.
6. Verify API and web hosts with focused checks.

## Phase 2: Menu And Table Setup

1. Build menu categories, items, variants, modifiers, and prices.
2. Build table areas, tables, table states, and service modes.
3. Add manager screens for menu and table setup.
4. Add validation for duplicate names, invalid prices, and inactive items.
5. Add tests for menu and table business rules.

## Phase 3: POS Order Flow

1. Build a fast POS order screen for touch use.
2. Support dine-in, takeaway, delivery, and counter orders.
3. Add cart editing, item notes, modifiers, quantity changes, and discounts.
4. Support table assignment, waiter assignment, and customer selection.
5. Save open orders before payment.
6. Verify the core sale path in the browser.

## Phase 4: KOT Workflow

1. Send new and changed order items to the kitchen as KOT entries.
2. Track KOT status as pending, preparing, ready, served, and canceled.
3. Add a kitchen display view for active tickets.
4. Support reprint, cancellation reason, and item-level status changes.
5. Add tests for KOT creation from order changes.

## Phase 5: Payment And Settlement

1. Add cash, card, UPI, wallet, split payment, and credit payment modes.
2. Add receipt generation and settlement records.
3. Add refund, void, no-sale, and cash drawer audit events.
4. Support direct receipt printing only through the desktop boundary.
5. Show a clear browser-runtime error when direct printing is not available.
6. Verify payment, print, and reset behavior with focused tests.

## Phase 6: Booking And Guest Management

1. Add table booking with date, time, guest count, and customer details.
2. Show booking conflicts before confirmation.
3. Convert a booking to a dine-in order.
4. Add booking states for pending, confirmed, seated, completed, canceled, and no-show.
5. Add customer history, notes, and loyalty touchpoints.

## Phase 7: Inventory Touchpoints

1. Track item availability from manual stock status.
2. Add recipe links for menu items.
3. Record stock use after settled sales.
4. Warn the cashier when an item is unavailable.
5. Keep inventory integration behind public contracts.

## Phase 8: Reports And Controls

1. Add sales summary, tax summary, payment summary, and item sales reports.
2. Add table turnover and kitchen preparation time reports.
3. Add shift close and manager approval workflows.
4. Add role permissions for cashier, waiter, kitchen, manager, and owner users.
5. Add audit records for sensitive actions.

## Phase 9: Desktop And Deployment Readiness

1. Add desktop-only native printing through the approved Tauri boundary.
2. Add local device configuration for receipt and KOT printers.
3. Verify web, API, and desktop targets for affected flows.
4. Record environment, command, result, date, and limitation in `assist/records`.
5. Prepare deployment profile documentation for the selected restaurant setup.

## Work First

1. Start with Phase 1.
2. Build the module map and application bootstrap contract first.
3. Add the restaurant dashboard shell second.
4. Add menu and table setup after the shell has a stable API contract.
5. Do not start payment, printing, or booking before POS order basics exist.
