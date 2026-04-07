# Task

## Active Batch

### Reference

`#45`

### Title

`Storefront desktop width standardization to 96rem`

## Ecommerce Go-Live Schedule

### Reference

`#34`

### Title

`Plan 9 ecommerce go-live execution schedule`

## Phase 1: Go-Live Stabilization

### Stage 1.1: Release Baseline

- [x] 1.1.1 freeze non-critical storefront block additions until P0 commerce stability is complete
- [x] 1.1.2 define production target environment, domains, SSL, env ownership, and release cutover checklist
- [x] 1.1.3 confirm ownership boundaries between `ecommerce`, `cxapp`, `core`, and `frappe` for all go-live work
- [x] 1.1.4 create the P0 issue list and assign execution order from this file

Stage 1.1 baseline document:
- [phase-1-stage-1-1-release-baseline.md](/E:/Workspace/codexsun/ASSIST/Planning/phase-1-stage-1-1-release-baseline.md)

### Stage 1.2: Checkout And Order Reliability

- [x] 1.2.1 stabilize guest checkout flow end to end
- [x] 1.2.2 stabilize authenticated checkout flow end to end
- [x] 1.2.3 cover failed payment, closed payment modal, and retry paths
- [x] 1.2.4 cover order-confirmation and order-tracking flows with stable e2e tests
- [x] 1.2.5 formalize the order state machine: `created`, `payment_pending`, `paid`, `fulfilment_pending`, `shipped`, `delivered`, `cancelled`, `refunded`
- [x] 1.2.6 add idempotent payment verification and duplicate-submit protection

### Stage 1.3: Mailbox And Customer Communications

- [x] 1.3.1 create all missing storefront mailbox templates including `storefront_order_confirmed`
- [x] 1.3.2 add resend tools for order confirmation and payment-related customer mails
- [x] 1.3.3 add failure logging and retry handling for customer-facing commerce notifications
- [x] 1.3.4 verify communication content for checkout, tracking, support, and account flows

### Stage 1.4: Payments And Reconciliation

- [x] 1.4.1 add Razorpay webhook endpoint with signature verification
- [x] 1.4.2 add webhook event store with idempotency and replay safety
- [x] 1.4.3 add payment reconciliation job between internal orders and Razorpay state
- [x] 1.4.4 add settlement visibility and failed-payment exception reporting
- [x] 1.4.5 define refund initiation and refund-status data model

### Stage 1.5: Security And Operations Baseline

- [x] 1.5.1 enforce HTTPS-only production settings
- [x] 1.5.2 define secret rotation, env segregation, and access policy
- [x] 1.5.3 add structured application logs with correlation ids
- [x] 1.5.4 add monitoring and alerts for checkout, payment verify, webhook, order creation, and mail send
- [x] 1.5.5 define database backup cadence and run one restore drill
- [x] 1.5.6 add audit logging for admin-critical actions
- [x] 1.5.7 add security review checklist based on OWASP ASVS areas

### Stage 1.6: Storefront Production Minimum

- [x] 1.6.1 add legal and trust pages: shipping, returns, privacy, terms, and contact
- [x] 1.6.2 add route-level metadata for storefront pages
- [x] 1.6.3 add canonical URLs, Open Graph, and sitemap or robots baseline
- [x] 1.6.4 audit accessibility for homepage, catalog, PDP, cart, checkout, and tracking
- [x] 1.6.5 audit mobile responsiveness for core storefront flows with fixed device matrix

## Phase 2: Commerce Operations

### Stage 2.1: Admin Order Operations

- [x] 2.1.1 build ecommerce admin order queue
- [x] 2.1.2 add order detail operations: cancel, mark fulfilled, add tracking id, resend confirmation
- [x] 2.1.3 add payment exception queue
- [x] 2.1.4 add refund queue and refund-status operations
- [ ] 2.1.5 add customer service queue linked to orders

### Stage 2.2: Customer Portal Maturity

- [ ] 2.2.1 add invoice or receipt download in customer portal
- [ ] 2.2.2 add returns and cancellation request workflow
- [ ] 2.2.3 add support request entry linked to order number
- [ ] 2.2.4 add repeat-order and wishlist-to-cart utilities
- [ ] 2.2.5 add clearer communication history where practical

### Stage 2.3: User And Role Management

- [ ] 2.3.1 define ecommerce operator roles: super admin, ecommerce admin, catalog manager, order manager, support agent, finance operator, analyst
- [ ] 2.3.2 map route and action permissions to those roles
- [ ] 2.3.3 add admin session hardening, lockout, and audit checks
- [ ] 2.3.4 add customer lifecycle states: active, blocked, deleted or anonymized
- [ ] 2.3.5 define email verification and suspicious-login handling policy

### Stage 2.4: Finance And Reporting

- [ ] 2.4.1 add daily payment summary export
- [ ] 2.4.2 add failed-payment report
- [ ] 2.4.3 add refund and settlement gap reports
- [ ] 2.4.4 add fulfilment-aging and refund-aging operational reports
- [ ] 2.4.5 add dashboard KPIs for conversion, AOV, order count, paid vs failed, fulfilment aging, and refund aging

## Phase 3: Inventory, Pricing, Shipping, And Tax

### Stage 3.1: Inventory Authority

- [ ] 3.1.1 decide authoritative source for sellable stock: `core`, ERPNext, or staged sync
- [ ] 3.1.2 define low-stock and oversell prevention rules
- [ ] 3.1.3 add stock reservation policy during checkout or payment-pending stage
- [ ] 3.1.4 define warehouse and stock visibility rules for storefront availability

### Stage 3.2: Pricing And Promotions

- [ ] 3.2.1 decide authoritative source for sell price and compare-at price
- [ ] 3.2.2 add explicit coupon validation rules, expiry handling, and usage constraints
- [ ] 3.2.3 define future promotion engine scope and phased rollout
- [ ] 3.2.4 document price-list compatibility with ERPNext if ERP becomes source of truth

### Stage 3.3: Shipping And Tax

- [ ] 3.3.1 add shipping methods, courier options, SLA, and ETA model
- [ ] 3.3.2 add zone-based shipping logic and COD eligibility rules if needed
- [ ] 3.3.3 add GST or tax breakdown review for each order
- [ ] 3.3.4 verify invoice and tax reporting compatibility with accounting workflows

## Phase 4: Frontend Management And Publishing

### Stage 4.1: Storefront Designer Governance

- [ ] 4.1.1 ensure every storefront block supports enable or disable, content, media, links, preview, validation, and safe defaults
- [ ] 4.1.2 add server-side validation for URLs, colors, and media references
- [ ] 4.1.3 add designer-level permissions by role
- [ ] 4.1.4 remove risky direct-live editing patterns where rollback is not possible

### Stage 4.2: Publishing Workflow

- [ ] 4.2.1 add draft, preview, publish, and rollback workflow for storefront content
- [ ] 4.2.2 add version history for storefront settings and key content blocks
- [ ] 4.2.3 define approval flow for production content changes

### Stage 4.3: Storefront Performance

- [ ] 4.3.1 add performance budget and Lighthouse or Web Vitals CI checks
- [ ] 4.3.2 continue optimizing image delivery, sizes, and formats
- [ ] 4.3.3 review remaining heavy homepage sections for rendering and scroll performance
- [ ] 4.3.4 define standards for adding future rails, cards, and blocks without degrading first paint

## Phase 5: ERPNext Foundation Through Frappe

### Stage 5.1: Connector Hardening

- [ ] 5.1.1 harden Frappe connection management and verification workflows
- [ ] 5.1.2 define production-safe retry, timeout, and failure behavior for connector syncs
- [ ] 5.1.3 add connector observability and exception logging

### Stage 5.2: Master Sync Contracts

- [ ] 5.2.1 define sync contract for ERPNext Item to `frappe` snapshot to `core` product projection
- [ ] 5.2.2 define sync contract for price list projection into commerce pricing
- [ ] 5.2.3 define sync contract for warehouse and stock projection into storefront availability
- [ ] 5.2.4 define sync contract for customer group and commercial profile enrichment
- [ ] 5.2.5 keep all connector orchestration inside `apps/frappe`

### Stage 5.3: Projection Into Commerce

- [ ] 5.3.1 add explicit projection services from `frappe` snapshots into `core`
- [ ] 5.3.2 add narrow ecommerce-facing services that consume projected ERP data without direct cross-app writes
- [ ] 5.3.3 confirm storefront runtime does not depend on live ERP response time

## Phase 6: ERP Transaction Bridge

### Stage 6.1: Order Push

- [ ] 6.1.1 push paid ecommerce orders into ERPNext Sales Order
- [ ] 6.1.2 define internal approval and retry rules before ERP push
- [ ] 6.1.3 add persistent mapping between ecommerce order ids and ERP sales-order ids

### Stage 6.2: Fulfilment And Finance Return Flow

- [ ] 6.2.1 sync delivery-note and shipment references back into ecommerce
- [ ] 6.2.2 sync invoice references back into ecommerce
- [ ] 6.2.3 sync refund and return states back into ecommerce
- [ ] 6.2.4 add reconciliation queue for mismatches and replay tools

## Phase 7: Scale And Maturity

### Stage 7.1: Advanced Commerce

- [ ] 7.1.1 add recommendation or search-ranking improvements
- [ ] 7.1.2 add segmented pricing and promotion maturity
- [ ] 7.1.3 add customer lifecycle marketing support
- [ ] 7.1.4 add merchandising automation and experimentation support

### Stage 7.2: Advanced Operations

- [ ] 7.2.1 add multi-warehouse readiness if inventory authority requires it
- [ ] 7.2.2 add full RMA and customer-service workflow maturity
- [ ] 7.2.3 add deeper analytics and attribution model

## Final Release Gate

- [ ] 8.1 full ecommerce smoke checklist passes from homepage to paid order and tracking
- [ ] 8.2 admin operations checklist passes for content, orders, payments, and support
- [ ] 8.3 security, backup, restore, and monitoring checks pass
- [ ] 8.4 production env and secret checklist passes
- [ ] 8.5 ERP integration decision is explicit: deferred, master-sync only, or transactional bridge enabled
- [ ] 8.6 go-live signoff is recorded with rollback plan and owner list
