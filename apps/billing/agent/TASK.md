# Billing tasks

## Responsibility

Tenant billing entries, quotations, purchases, sales, receipts, payments, opening balances, and outstanding reports.

Keep company and financial-year scope explicit. Draft reservations do not settle balances. Preserve allocation, tax, lifecycle, and accounting reconciliation rules.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Billing source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

### Summary printing, October 16, 2026

- Customer Summary and Supplier Summary now provide Print actions with module-owned A4 layouts.
- Both layouts follow the statement company header, bordered table, and generated footer format.
- Printing uses all rows that match the current search. Printed totals use those same rows.
- Table headings repeat across pages. Empty results show a clear message.
- Existing customer and supplier statement printing remains unchanged.
- No database, permission, or API contract changes are required.
- Passed Billing API and web type checks, lint, and builds.
- Passed Billing module boundaries, component documentation checks and tests, and the root dependency check.
- Browser printing, physical printing, and database E2E checks were not run for this UI change.

- `node tools/check-module-boundaries.mjs billing`
- `npm run typecheck -w @codexsun/billing-api`
- `npm run lint -w @codexsun/billing-api`
- `npm run build -w @codexsun/billing-api`
- `npm run typecheck -w @codexsun/billing-web`
- `npm run lint -w @codexsun/billing-web`
- `npm run build -w @codexsun/billing-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.

## WhiteBooks review, October 16, 2026

- [x] Correct domestic and export payloads, address reads, dates, taxes, and unit codes.
- [x] Add domestic standalone E-way generation and explicit transport distance.
- [x] Reject false success responses and client-supplied generated records.
- [x] Preserve completed compliance records and prevent local destructive changes.
- [x] Verify sandbox authentication and generate an IRN, an IRN-linked E-way, and a standalone E-way.
- [x] Test provider response failures, transport validation, scope, persistence, reload, and repeated generation.
- [x] Keep the root `.env` ignored and active sandbox credentials separate from staged production product keys.
- [x] Add durable Queue Manager dispatch, concurrent submission claims, and ambiguous-result reconciliation before production release.
- [x] Implement and test provider cancellation before local cancellation of generated documents.
- [x] Verify browser generation, cancellation recovery, and invoice print-page output. Native print-dialog pagination and physical printing are not certified.
- [ ] Configure the real company taxpayer login and verify production authentication before an explicit go-live.

Sandbox result numbers and the current configuration contract are recorded in the README.
Passed all 20 Billing unit tests and both disposable MariaDB test stages after the fixes.
Passed Billing API/web type checks, lint, builds, formatting, module boundaries, component documentation checks/tests, and dependency layout.
No production invoice was submitted. The queue update adds two owner migration steps and requires normal deployment migration preflight.
The disposable quotation fixture now includes `core_contacts.deleted_at` from initial setup.
Its database checks also verify the compliance company/address reads and provider result persistence.

## Queue and cancellation verification, October 16, 2026

- Sales and Export Sales own durable request tables, saved provider outcomes, and cancellation/recovery rules. Platform dispatches trusted tenant jobs through Queue Manager.
- Concurrent submissions share one active operation. Conditional worker claims and invoice locks prevent duplicate generation and local edits during an uncertain operation.
- Interrupted requests use provider lookup. Saved results replay locally. Unknown standalone E-way results require a matching provider bill number. No blind generation retry is permitted.
- Cancellation keeps original identifiers and audit history. Cancel E-way before IRN, then cancel the local voucher. Provider-confirmed active cancellation failures permit a fresh cancellation attempt.
- The browser generated and cancelled sandbox invoice WBQA2156318508, acknowledgment 112610278704526, and E-way 181012938120. Interrupted E-way cancellation recovered through the browser Check provider status action.
- Reloaded cancellation state and the IRN CANCELLED print-page banner were verified. Customer Summary and Supplier Summary exposed Print actions; printable supplier empty-state content and totals were checked. Native print-dialog pagination and physical output remain unverified.
- The QA company, contact and cancelled provider identifiers remain as local evidence. Original company 1 / financial year 1 selection was restored.
- Passed 20 unit tests and all three disposable MariaDB stages. Added a passing regression for interrupted cancellation, active-provider lookup, and safe cancellation retry.
- Passed Billing API/web and Platform API type checks, lint and builds; Platform web build; Billing/Platform boundaries; component documentation checks/tests; root dependency layout.
- Root migration-contract check still fails on unrelated Chat, QCafe, Sites, Docs and other owner definitions; it reports no Billing compliance table violations. This remains a repository-wide release limitation.
- Two additive compliance queue migrations require deployment preflight and execution. Production taxpayer credentials/authentication, production rollout, and Redis backend recovery were not verified. Active WhiteBooks mode remains sandbox; no production invoice was submitted.
