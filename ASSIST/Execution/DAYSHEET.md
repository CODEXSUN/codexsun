# Day Sheet

## Whole Application Issues

### Launch-Critical

- [x] Storefront smoke product path and seeded checkout flow were restored for `/products/aster-linen-shirt`.
- [x] Homepage performance budget is back within the current automated `LCP` budget after first-render slimming.
- [ ] Product performance test still needs a clean rerun now that the functional smoke blocker is fixed.
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

- [ ] `#223` Manual full-load storefront verification.
- [ ] Next storefront performance slice after `#223`: shrink public entry preload and remove first-screen `motion` cost.
