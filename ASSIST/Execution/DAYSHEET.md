# Day Sheet

## Whole Application Issues

### Launch-Critical

- [ ] Storefront smoke is failing on seeded product route `/products/aster-linen-shirt`.
- [ ] PDP add-to-cart control is missing in storefront smoke runs.
- [ ] Checkout auth return flow is redirecting to `/login` instead of returning to the expected customer/checkout path in smoke runs.
- [ ] Homepage performance budget is failing with measured `LCP` around `4068ms` against the current `3500ms` budget.
- [ ] Product performance test is failing and is currently mixed with a functional product-not-found state.
- [ ] Production release environment still has blockers for real domains, TLS, live Razorpay completeness, owner emails, and secrets rotation metadata.

### Operational Risks

- [ ] Production media/update safety is still unresolved and needs a verified non-destructive update flow.
- [ ] Production ERP launch mode is still not confirmed.
- [ ] Off-machine backup and ops alerting are currently not confirmed as pre-go-live controls.

### Repository Quality Risks

- [ ] `npm run lint` is currently too noisy for launch use and should not be treated as the first launch gate.
- [ ] Cross-app boundary hardening remains future work after launch stabilization.
- [ ] Large mixed-responsibility services remain a post-launch maintenance risk.

## Current Focus

- [ ] `#221` Fix storefront smoke product-path failure first.
