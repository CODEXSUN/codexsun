# Plan 9: Ecommerce Go-Live Blueprint

## Purpose

Define the production go-live blueprint for `apps/ecommerce` with clear next actions across storefront, customer flows, admin operations, backend controls, security, observability, and ERPNext support through `apps/frappe`.

This plan is repo-specific. It uses the current Codexsun app boundaries:

- `apps/ecommerce` owns storefront, cart, checkout, payments, orders, tracking, customer portal, and storefront management.
- `apps/core` owns shared masters such as products, contacts, units, HSN, categories, brands, warehouses, and common modules.
- `apps/cxapp` owns the only browser login/session system, admin shell, mailbox, roles, permissions, and company/runtime settings.
- `apps/frappe` owns ERPNext connector settings, snapshots, and sync orchestration.

## Current Baseline

### Already Present

- Live storefront with dynamic block-driven homepage sections and separate designer screens.
- Catalog, product, cart, checkout, tracking, and customer portal surfaces.
- Razorpay order creation and checkout integration.
- Storefront settings service, home-slider designer, footer designer, floating-contact designer, coupon/gift/trending/branding/campaign designers.
- Shared TanStack Query storefront shell data path.
- Frappe connector boundary with settings, item snapshots, purchase receipt snapshots, and sync logs.

### Current Gaps Seen In Repository

- Go-live quality is not yet proven by a stable full ecommerce e2e suite.
- Order confirmation email template `storefront_order_confirmed` is missing in mailbox storage.
- Payment lifecycle is integrated, but webhook-grade production hardening and reconciliation are not yet the operating model.
- ERPNext connector is still snapshot/sync oriented, not yet a transactional commerce bridge.
- Customer, order, inventory, return, settlement, and support operations are not yet run from one production-grade control plane.

## Go-Live Definition

Ecommerce is considered ready for go-live only when all of the following are true:

1. A customer can discover, purchase, pay, receive confirmation, track, and contact support without manual intervention.
2. Admin users can manage catalog, homepage content, orders, customers, payments, and support without touching raw data.
3. Stock, pricing, taxes, shipping, and payment states are authoritative, auditable, and recoverable.
4. Security, access control, backups, monitoring, retries, and rollback paths are in place.
5. ERPNext integration either owns downstream ERP duties or is deliberately deferred behind explicit manual operating procedures.

## Industrial-Standard Target Model

### 1. Frontend Storefront

#### Required

- Core Web Vitals target:
  - LCP under 2.5s on critical landing pages
  - INP under 200ms
  - CLS under 0.1
- Optimized images:
  - responsive sizes
  - lazy load below the fold
  - explicit dimensions/aspect handling
  - WebP/AVIF where practical
- SEO baseline:
  - per-page titles and descriptions
  - canonical URLs
  - Open Graph and Twitter cards
  - schema.org for product, breadcrumb, organization, and FAQ where used
  - XML sitemap and robots rules
- Accessibility baseline:
  - keyboard navigation
  - visible focus states
  - labels for all actionable controls
  - contrast checks
  - dialog focus trap and escape behavior
- Trust UX:
  - shipping policy
  - return/refund policy
  - privacy policy
  - terms
  - contact/support details
  - payment and fulfillment disclosures

#### Next Actions

- Add a storefront performance budget and Lighthouse/Web Vitals CI checks.
- Add route-level metadata and structured data support.
- Audit the mobile homepage, catalog, product, cart, checkout, and tracking pages with a fixed device matrix.
- Replace any remaining raw `<img>` usage that lacks stronger optimization rules where appropriate.

### 2. Frontend Management

#### Required

- Every editable storefront block must support:
  - enable/disable
  - text and link control
  - media selection
  - preview
  - validation
  - safe defaults
- Changes should be publishable without breaking public rendering.
- Long-term, marketing changes should support draft/publish and version history.

#### Next Actions

- Introduce publish workflow for storefront designers:
  - draft
  - preview
  - publish
  - rollback
- keep designer governance explicit by enforcing client-side validation for required content, media, and link fields across the editable storefront homepage blocks before save
- Add server-side validation for links, color fields, and media references.
- Add designer-level permissions so not every admin can edit every live storefront surface.

### 3. Backend Commerce Management

#### Required

- Order state machine:
  - created
  - payment_pending
  - paid
  - fulfilment_pending
  - shipped
  - delivered
  - cancelled
  - refunded
- Idempotent payment verification and webhook/event handling.
- Order audit log and operator notes.
- Coupon, pricing, shipping, and tax rules with validation and expiry handling.
- Retryable notifications and reconciliation jobs.
- Export/report support for finance and support teams.

#### Next Actions

- Formalize order state transitions in one service contract.
- Add payment reconciliation job:
  - compare internal orders
  - Razorpay order/payment state
  - settlement status
- Add background job pattern for:
  - email
  - webhook processing
  - reconciliation
  - reminder flows
- Add admin order operations:
  - cancel
  - refund initiate
  - mark fulfilled
  - add tracking id
  - resend confirmation

### 4. User Management

#### Required

- Single auth system in `apps/cxapp` remains authoritative.
- Clear role separation:
  - super admin
  - ecommerce admin
  - catalog manager
  - order manager
  - support agent
  - finance operator
  - read-only analyst
- Customer identity controls:
  - password reset
  - email verification policy
  - session expiry
  - suspicious login logging
- Admin security:
  - strong password policy
  - login throttling
  - optional MFA for admin users

#### Next Actions

- Define suite roles and route/page permissions for ecommerce operations.
- Add admin session hardening checklist:
  - secure cookie flags
  - session invalidation
  - lockout/rate limit
  - audit trail
- Add customer account lifecycle states:
  - active
  - blocked
  - deleted/anonymized

### 5. Customer Portal

#### Required

- Customer can:
  - see orders
  - track shipment
  - view payment state
  - manage addresses
  - update profile
  - access invoices/receipts
  - raise support or return requests
- Communication history should be visible where practical.

#### Next Actions

- Add invoice/receipt download path.
- Add returns/cancellation request workflow with status tracking.
- Add support ticket entry linked to order number and customer account.
- Add wishlist to cart and repeat-order utilities.

### 6. Admin Portal

#### Required

- Admin should manage:
  - products and categories
  - homepage/storefront content
  - customers
  - orders
  - payments
  - shipments
  - support
  - operational reports
- Each area needs list filters, bulk operations where needed, and clear audit visibility.

#### Next Actions

- Build dedicated ecommerce operator pages for:
  - order queue
  - payment exceptions
  - shipment/tracking
  - refund queue
  - customer service queue
- Add dashboard KPIs:
  - conversion
  - AOV
  - order count
  - paid vs failed
  - fulfilment aging
  - refund aging

### 7. Payments And Finance

#### Required

- Every checkout payment must be tied to a server-created order.
- Payment verification must happen server-side.
- Webhooks must be:
  - signature-verified
  - idempotent
  - replay-safe
  - retry-aware
- Settlement, refund, and dispute visibility must exist.

#### Next Actions

- Add dedicated Razorpay webhook endpoint and event store.
- Record webhook event ids and processing result.
- Add refund model and settlement reconciliation model.
- Add finance report exports for:
  - daily payment summary
  - failed payments
  - refunds
  - settlement gap report

### 8. Inventory, Pricing, Shipping, Tax

#### Required

- One authoritative source for sellable stock and price.
- Prevent overselling with reservation strategy or explicit low-stock behavior.
- Support shipping charges, free-shipping threshold, and zone/service logic.
- Tax/GST rules must be explicit and reportable.

#### Next Actions

- Keep `apps/core` as the current authoritative source for sellable storefront stock.
- Keep `apps/ecommerce` runtime reads on `core` stock rows and reserved quantities only.
- Stage future ERPNext stock through `apps/frappe` snapshots projected into `apps/core`, with any override rules applied before storefront reads.
- Treat sellable quantity `1` to `5` as low stock, and treat `0` as out of stock with checkout blocked.
- Keep cart and PDP stock indicators advisory only; checkout must revalidate against the latest sellable quantity before order creation.
- Do not allow backorders, silent partial fulfilment, or automatic oversell overrides in storefront runtime.
- Reserve stock when a new order enters `payment_pending`, keep the same reservation for duplicate pending-order reuse, and release it on pending-payment failure, admin cancellation, or expiry.
- Keep pending-payment reservation expiry aligned to the current `15` minute checkout-reuse window, and reject late payment capture after the reservation has already been released.
- Treat storefront availability as one aggregated pool across all active product stock rows, and keep warehouse-level detail internal to operations for now.
- Do not expose warehouse selection, split-shipment promises, pickup-only stock claims, or warehouse-specific ETA messaging until a later multi-warehouse implementation exists.
- Keep store pickup on the same shared sellable pool used by delivery orders until warehouse-aware allocation rules are implemented.
- Keep `apps/core` as the current authoritative source for storefront sell price and compare-at price.
- Keep `apps/ecommerce` runtime pricing reads on active `core` price rows using `sellingPrice` and `mrp`, with `basePrice` only as fallback when no active row exists.
- Do not derive effective customer-facing price from ERP snapshots, offer records, or coupon copy at request time until a later pricing-engine batch makes that behavior explicit.
- If ERPNext becomes pricing source of truth, resolve ERP item-price and price-list selection inside `frappe` projection flow first, then project one approved storefront-effective price record into `core`.
- Keep ERP compatibility aligned to current storefront pricing semantics:
  - projected `sellingPrice` stays the effective storefront transaction price
  - projected `mrp` stays the compare-at display price
  - `basePrice` remains fallback only when no active projected or local row exists
- Do not perform live customer-group, territory, channel, or price-list selection inside storefront request handling; those choices must already be normalized before `core` projection.
- Validate checkout coupon codes against ecommerce-owned customer coupon state with explicit ownership, expiry, minimum-order, and single-use rules.
- Reserve coupon usage while an order is pending, consume it on successful payment, and release it again when the pending order fails, is cancelled, or expires.
- Keep current storefront campaign, coupon-banner, gift-corner, promo slider, and related merchandising blocks as presentation-only promotion surfaces rather than transactional price authority.
- Phase the future promotion engine:
  - Phase A: current live baseline using `core` price authority plus ecommerce-owned customer coupons
  - Phase B: rule-driven ecommerce promotions for explicit percentage, fixed-amount, free-shipping, first-order, and catalog-scope rules with stacking precedence and audit visibility
  - Phase C: segmented pricing, customer targeting, and ERP-aware commercial models only after segmentation, analytics, and price-list contracts are defined
- Do not let future promotion logic bypass the current staged-sync pricing model or introduce live ERP promotion evaluation into storefront runtime.
- Add shipping methods and SLA model:
  - delivery-method catalog in `apps/ecommerce` storefront settings
  - courier
  - SLA
  - ETA
  - COD eligibility
- Resolve shipping charges by destination zone once checkout has country or state or pincode context.
- Match zones by explicit rule order and keep cart estimates generic until address-backed checkout resolution.
- Keep COD as an eligibility rule first; do not imply a live COD collection workflow until payment and fulfilment states are extended for it.
- Add GST review on each order as a stored operational snapshot derived from product tax ids and seller-state versus customer-state comparison.
- Keep the current review tax-inclusive for item prices, and defer authoritative invoice-posting and shipping-charge tax treatment to accounting compatibility work.
- Verify accounting compatibility from the ecommerce side with an operator-facing report that flags mixed-rate GST orders, refund note follow-up, and unmapped shipping or handling tax treatment before billing entry.
- Keep storefront designer link and media persistence behind shared server-side schema validation so bypassed admin clients cannot save unsafe URL protocols or invalid asset references.
- Split storefront designer permissions into read-only visibility and edit rights so content-review roles can inspect live configuration without inheriting direct mutation access.
- Keep direct-live storefront editing behind automatic revision snapshots until the full draft, publish, and rollback workflow is introduced, so each live change preserves a recoverable previous state.
- Keep public storefront rendering on the live settings document only, while internal designers save into a shared draft workspace and publish explicitly when ready.
- Support rollback by restoring only immutable live revision snapshots, and clear the active draft after publish or rollback so editor state matches the currently effective live storefront.
- Derive storefront version history from the same immutable live revision snapshots, and expose filtered block-aware history so unchanged blocks do not show noisy duplicate versions.
- Split storefront production approval from storefront draft editing so catalog-design roles can prepare changes while only approval-capable roles publish or rollback live storefront content.
- Keep storefront performance budgets on a production-like built frontend path, and enforce them at least across home, catalog, and product detail routes before adding more homepage surface weight.
- Normalize storefront image delivery through shared image primitives with explicit intrinsic sizing on hero, category, card, and product-gallery surfaces before introducing more media-heavy merchandising sections.
- Defer heavy below-the-fold homepage merchandising sections behind intersection-aware rendering and lazy-loaded block imports so homepage first render stays narrower as more rails are added.
- Keep future homepage rails behind shared storefront performance standards that define deferral, reserved layout footprint, and fallback behavior before the rail is added to the public composition path.

### 9. Security, Compliance, And Operations

#### Required

- HTTPS-only production.
- Secret rotation and env segregation.
- Database backup and restore drill.
- Audit logs for admin-critical actions.
- Error tracking and alerting.
- Abuse controls:
  - rate limit
  - bot protection on auth/checkout/search as needed
- Data lifecycle:
  - retention
  - soft delete
  - export/anonymization policy where required

#### Next Actions

- Add structured application logging with correlation ids.
- Add uptime monitoring and alerting for:
  - checkout
  - payment verify
  - webhook
  - order creation
  - email send
- Add backup cadence and restore test.
- Add security review checklist based on OWASP ASVS areas:
  - authentication
  - session management
  - access control
  - logging
  - configuration

## ERPNext / Frappe Integration Blueprint

### Current Connector Maturity

Current `apps/frappe` scope is partial:

- settings
- connection verification
- item snapshots
- purchase receipt snapshots
- todo snapshots
- sync logs

This is not yet a live commerce-to-ERP operating loop.

### Recommended Integration Ownership

#### ERPNext Should Own

- item master if ERP is the commercial source of truth
- warehouse stock
- price lists
- customers and B2B terms where ERP governs credit/commercial policy
- sales orders
- delivery notes / shipment docs
- invoices
- returns
- purchase receipts and inward stock
- accounting postings

#### Codexsun Ecommerce Should Own

- storefront content and merchandising
- customer session and portal UX
- cart state
- checkout orchestration
- payment UX and payment verification
- storefront search/browse UX
- marketing blocks, CMS-like homepage sections, and customer-facing order tracking

### Recommended Integration Flows

#### Phase A: Master Sync

- ERPNext Item -> `apps/frappe` snapshot -> `apps/core` product projection -> `apps/ecommerce` storefront read
- ERPNext Price List -> `apps/frappe` snapshot -> `apps/core` price projection -> `apps/ecommerce` storefront read
- ERPNext Warehouse/Stock -> `apps/frappe` snapshot -> `apps/core` stock projection -> `apps/ecommerce` storefront read
- ERPNext Customer Group / territory / sales settings -> customer commercial profile enrichment

#### Phase B: Transaction Push

- Ecommerce paid order -> internal order approval -> ERPNext Sales Order
- Fulfilment start -> ERPNext Delivery Note / shipment reference
- Invoice creation -> ERPNext Sales Invoice
- Refund / return -> ERPNext return and finance linkage

#### Phase C: Reconciliation Loop

- ERPNext document status back to ecommerce:
  - sales order id
  - delivery note id
  - invoice id
  - shipment/tracking
  - return status
- Scheduled sync and exception queue for mismatches.

### ERPNext Execution Notes

- Keep connector orchestration in `apps/frappe`.
- Keep sellable-stock authority in `apps/core` until a projection has been validated and persisted there.
- Keep storefront pricing authority in `apps/core` until ERP price-list projections have been validated and persisted there.
- If ERPNext owns price lists, select the storefront-effective price row before projection and persist only normalized effective pricing fields that `ecommerce` already understands.
- If ecommerce needs ERP-aware behavior, add narrow projection services in `apps/ecommerce`, not direct cross-app writes.
- Start with one-way master sync and one-way order push before attempting full bidirectional transaction mutation.
- Do not make storefront runtime depend on live ERPNext response time for page render or checkout completion.

## Repo-Specific Gap Matrix

### P0: Must Close Before Go-Live

- Stable ecommerce e2e suite for:
  - guest checkout
  - authenticated checkout
  - failed payment
  - webhook reconciliation
  - order tracking
- Mailbox template setup for all customer-facing commerce messages.
- Explicit production payment/webhook configuration and verification.
- Order operations dashboard for support and finance.
- Security and backup baseline.
- SEO/legal pages and trust surfaces.

### P1: Strongly Recommended Before Public Scale

- Draft/publish/versioning for storefront designers.
- Returns and refund workflow.
- Shipment/tracking admin workflow.
- Payment exception queue.
- Web-vitals/performance CI.
- Structured analytics and attribution.
- Role-based ecommerce operator permissions.

### P2: Scale And Maturity

- ERPNext transactional sync.
- Promotion engine and segmented pricing.
- Recommendation/search ranking logic.
- Multi-warehouse and reservation model.
- Customer service and RMA workflow.
- A/B experimentation and merchandising insights.

## Execution Plan

### Wave 1: Go-Live Stabilization

- Freeze new block-building work except critical fixes.
- Close payment, order, notification, and admin-operability blockers.
- Add missing mailbox templates and order communications.
- Finish e2e and smoke coverage.
- Add backup, monitoring, and alerting.

### Wave 2: Commerce Operations

- Build order management workspace.
- Build support and refund operations.
- Add finance reconciliation and reporting.
- Add shipping/tracking operational flows.

### Wave 3: ERP Foundation

- Harden Frappe connection management.
- Define canonical sync contracts for item, stock, price list, customer, and warehouse.
- Add snapshot-to-projection pipeline into `core` and `ecommerce`.

### Wave 4: ERP Transaction Bridge

- Push paid orders to ERPNext Sales Order.
- Sync fulfilment/invoice state back to ecommerce.
- Add exception queue and replay tools.

### Wave 5: Scale

- publish/version workflow for designers
- performance budgets
- analytics maturity
- merchandising automation
- customer lifecycle marketing

## Suggested Immediate Next Task List

1. Create a production-readiness checklist issue set for P0.
2. Add missing mailbox templates and resend tools.
3. Add Razorpay webhook endpoint, event store, and reconciliation job.
4. Build ecommerce admin order operations workspace.
5. Finish stable guest and authenticated checkout e2e coverage.
6. Define ERP authority model for item, stock, and price.
7. Expand `apps/frappe` from snapshot management to explicit master-sync contracts that project stock and pricing into `apps/core`.
8. Add legal/trust/SEO baseline pages and metadata.
9. Add production logging, alerts, and restore-tested backups.

## Acceptance Criteria For Plan 9 Completion

- A new execution batch can pick P0 items one by one without re-deciding scope.
- Ecommerce and ERPNext ownership boundaries stay explicit.
- Frontend, backend, admin, customer, and ERP support work are separated into executable waves.
- The blueprint can be used as the release-governance checklist for first production launch.

## Reference Notes

- Frappe permissions and role model: https://docs.frappe.io/framework/v14/user/en/basics/users-and-permissions
- ERPNext Sales Order flow: https://docs.frappe.io/erpnext/v14/user/manual/en/selling/sales-order
- ERPNext Item master: https://docs.frappe.io/erpnext/v14/user/manual/en/stock/item
- ERPNext Item Price and price lists:
  - https://docs.frappe.io/erpnext/v14/user/manual/en/stock/item-price
  - https://docs.frappe.io/erpnext/v14/user/manual/en/stock/price-lists
- Razorpay server integration and webhook guidance:
  - https://razorpay.com/docs/payments/server-integration
  - https://razorpay.com/docs/webhooks
  - https://razorpay.com/docs/webhooks/best-practices/
- OWASP developer guidance and ASVS coverage areas:
  - https://owasp.org/www-project-developer-guide/
