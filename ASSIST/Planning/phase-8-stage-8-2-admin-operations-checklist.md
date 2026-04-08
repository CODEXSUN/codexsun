# Phase 8 Stage 8.2: Admin Operations Checklist

## Goal

Make the ecommerce admin release gate explicit for the four operator surfaces that must work before go-live:

- storefront content management
- orders
- payments
- support

## Dedicated Command

- `npm.cmd run test:e2e:ecommerce-admin-ops`

## Covered Runtime Path

The gate logs into the admin workspace and verifies:

1. storefront content workflow loads with draft/live status, save action, and version history
2. order operations queue loads with search and queue tabs
3. payment operations load with exports and reconciliation controls
4. support operations load with queue filters and case detail panel

## Acceptance Rule

Stage `8.2` passes only when the dedicated admin-ops command succeeds on the built repo test stack without manual page repair, raw database edits, or bypassed auth.

## Boundaries

- this gate proves workspace operability, not every destructive mutation path
- deeper workflow correctness remains covered by service, route, and focused e2e tests from earlier stages
- residual downstream warnings should be recorded, but they do not fail `8.2` unless these four admin surfaces stop loading or lose their primary controls
