# Day Sheet

## Whole Application Issues

### Launch-Critical

- [x] Storefront smoke product path and seeded checkout flow were restored for `/products/aster-linen-shirt`.
- [x] Homepage performance budget is back inside the automated `3500ms` `LCP` budget.
- [x] Product performance test passed a clean focused rerun for `/products/aster-linen-shirt`.
- [ ] Production release environment still has blockers for real domains, TLS, live Razorpay completeness, owner emails, and secrets rotation metadata.
- [ ] Storefront confirmation email delivery is failing under local smoke credentials and still needs proper SMTP/live mailbox validation.

### Operational Risks

- [ ] Production media/update safety is still unresolved and needs a verified non-destructive update flow.
- [ ] Production ERP launch mode is still not confirmed.
- [ ] Off-machine backup and ops alerting are currently not confirmed as pre-go-live controls.

### Repository Quality Risks

- [ ] `npm run lint` is currently too noisy for launch use and should not be treated as the first launch gate.
- [ ] Cross-app boundary hardening remains future work after launch stabilization.
- [ ] Large mixed-responsibility services remain a post-launch maintenance risk.

## Current Focus

- [x] `#237` Clean rerun storefront product performance test.
- [x] `#238` Restore homepage `LCP` under the automated `3500ms` budget.
