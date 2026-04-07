# Phase 1 Stage 1.1: Release Baseline

## Purpose

Close the Phase 1 Stage 1.1 planning block for ecommerce go-live by defining:

- the temporary feature freeze rule
- the production target environment model
- domain and SSL baseline
- environment ownership
- release cutover checklist
- ownership confirmation for `ecommerce`, `cxapp`, `core`, and `frappe`
- the ordered P0 issue list for the next execution stages

## 1. Freeze Rule

Effective immediately, new non-critical storefront block additions are frozen until Phase 1 P0 commerce stability is complete.

### Allowed During Freeze

- checkout, order, tracking, payment, notification, security, backup, or monitoring fixes
- admin operations needed to manage live orders, payments, customers, or support
- legal, SEO, trust, accessibility, and performance fixes required for production launch
- e2e stabilization and release-blocking regression fixes

### Not Allowed During Freeze

- new decorative homepage blocks
- new visual-only marketing sections
- non-essential animation or style experiments
- unrelated storefront redesign work

Freeze exit condition:

- Phase 1 P0 items for reliability, payments, mailbox, security baseline, and storefront production minimum are complete or explicitly waived by release owner

## 2. Production Target Environment

## Environment Set

1. `local`
2. `staging`
3. `production`

## Recommended Production Runtime Shape

- one primary application runtime for the current suite shell
- MariaDB as the production transactional database
- optional PostgreSQL only if analytics is activated later
- SQLite reserved for local or offline paths, not production commerce
- reverse proxy or load balancer terminating TLS in front of the app runtime
- background job execution enabled for payments, mail, reconciliation, and retries once those jobs are implemented

## Required Production Runtime Expectations

- `DB_DRIVER=mariadb`
- `TLS_ENABLED=true`
- `JWT_SECRET` generated uniquely for production and rotated through controlled process
- production SMTP credentials present and verified
- live Razorpay keys present and verified
- backup storage path configured and tested
- monitoring and log collection connected before public launch

## 3. Domain And SSL Baseline

## Recommended Domain Topology

Current product architecture supports one main origin cleanly. Use:

- primary commerce origin: `https://<primary-domain>`

Current route model under that origin:

- storefront: `/`
- catalog and products: `/catalog`, `/products/*`
- cart and checkout: `/cart`, `/checkout`
- customer portal: `/customer/*`
- admin dashboard: `/admin/dashboard`
- operator workspace: `/dashboard`

## Optional Future Split

If operational separation is needed later:

- public commerce: `https://<primary-domain>`
- operator/admin: `https://ops.<primary-domain>`

This is not required for first go-live and should not block release.

## SSL Baseline

- all production traffic must be HTTPS-only
- HTTP requests must redirect to HTTPS
- TLS certificates must be managed and renewed outside app code
- HSTS should be enabled at the proxy layer after cutover validation
- internal API routes must never be exposed as unauthenticated public admin endpoints

## 4. Environment Ownership

## Framework-Owned Runtime Environment

`apps/framework` runtime config owns:

- host and port values
- TLS flags and certificate paths
- database driver and connection values
- analytics database values
- JWT runtime primitives

## CxApp-Owned Environment

`apps/cxapp` owns:

- auth policy and admin-facing session behavior
- mailbox and SMTP operational usage
- company and runtime settings surfaces

## Ecommerce-Owned Environment

`apps/ecommerce` owns:

- storefront payment behavior
- Razorpay keys and commerce-facing payment settings
- storefront support and communication expectations
- order, checkout, customer, and catalog runtime behavior

## Frappe-Owned Environment

`apps/frappe` owns:

- ERPNext base URL
- API key and secret
- connector defaults, sync behavior, and future ERP bridge settings

## Secret Ownership Rule

- no production secrets in git
- no production `.env` committed
- secret rotation must be owned by deployment operator and recorded in release checklist
- staging and production values must be separated physically and procedurally

## 5. Ownership Confirmation For Go-Live Work

## Ecommerce

`apps/ecommerce` owns:

- storefront
- cart
- checkout
- payment orchestration
- order tracking
- customer portal commerce surfaces
- storefront management and content designers

## CxApp

`apps/cxapp` owns:

- the only browser login and backend session system
- admin shell
- roles and permissions
- mailbox and mail templates
- company identity and suite runtime settings

## Core

`apps/core` owns:

- shared products
- contacts
- brands
- categories
- units
- HSN
- common modules and shared master data

## Frappe

`apps/frappe` owns:

- ERPNext connection settings
- ERP snapshots
- connector sync orchestration
- future ERP transaction bridge orchestration

Rule:

- no direct ad hoc cross-app writes from storefront code into ERP or auth boundaries
- any ERP-aware commerce behavior must come through narrow app-owned services

## 6. Release Cutover Checklist

## Pre-Cutover

- [ ] staging matches production topology closely enough for checkout and mail verification
- [ ] production env file prepared and reviewed
- [ ] live Razorpay keys verified in staging-like environment
- [ ] SMTP verified with production mailbox templates
- [ ] MariaDB production database provisioned
- [ ] backup job configured
- [ ] restore procedure documented
- [ ] monitoring and alerting connected
- [ ] DNS records prepared
- [ ] TLS certificates prepared
- [ ] rollback owner assigned

## Cutover Window

- [ ] database backup taken before switch
- [ ] deployment artifact version recorded
- [ ] env values loaded on target runtime
- [ ] migrations executed
- [ ] seeders run only if explicitly required for target environment
- [ ] health endpoint checked
- [ ] homepage checked
- [ ] login checked
- [ ] checkout checked
- [ ] Razorpay payment checked
- [ ] order confirmation mail checked
- [ ] order tracking checked
- [ ] admin dashboard checked

## Post-Cutover

- [ ] first successful paid order recorded
- [ ] logs show no payment verification errors
- [ ] webhook delivery verified once webhook support is live
- [ ] mailbox sends verified
- [ ] backup job verified
- [ ] monitoring alerts verified
- [ ] release signoff recorded

## Rollback Trigger

Rollback if any of these occur:

- checkout cannot create valid orders
- payment verification fails consistently
- customer login or session routing is broken
- orders are created with incorrect totals or broken states
- admin cannot view or operate live orders

## 7. Ordered P0 Issue List

Execution order for P0 after Stage 1.1:

1. `1.2.1` stabilize guest checkout flow end to end
2. `1.2.2` stabilize authenticated checkout flow end to end
3. `1.2.3` cover failed payment, closed payment modal, and retry paths
4. `1.2.4` cover order-confirmation and order-tracking flows with stable e2e tests
5. `1.2.5` formalize order state machine
6. `1.2.6` add idempotent payment verification and duplicate-submit protection
7. `1.3.1` create all missing storefront mailbox templates
8. `1.3.2` add resend tools for order confirmation and payment-related mails
9. `1.3.3` add failure logging and retry handling for commerce notifications
10. `1.4.1` add Razorpay webhook endpoint with signature verification
11. `1.4.2` add webhook event store with idempotency and replay safety
12. `1.4.3` add payment reconciliation job
13. `2.1.1` build ecommerce admin order queue
14. `2.1.2` add core order detail operations
15. `1.5.1` enforce HTTPS-only production settings
16. `1.5.2` define secret rotation, env segregation, and access policy
17. `1.5.3` add structured application logs with correlation ids
18. `1.5.4` add monitoring and alerts
19. `1.5.5` define backup cadence and run one restore drill
20. `1.6.1` add legal and trust pages
21. `1.6.2` add route-level metadata
22. `1.6.3` add canonical URLs, Open Graph, and sitemap or robots baseline

## 8. Stage 1.1 Completion Decision

Stage 1.1 is complete when:

- freeze policy is active
- production environment shape is defined
- domain and SSL baseline is defined
- environment ownership is defined
- cutover checklist exists
- app ownership for go-live work is confirmed
- P0 execution order is documented
