# Frappe tasks

## Mobile customer source, 17-10-2026

- [x] Replace person Contact import with Mobile Contact Customer associations and validate both linked records.
- [x] Preserve separate customers sharing a mobile and combine multiple mobiles for the same remote Customer.
- [x] Preserve legacy import links and scope new identities to the source site. Reject inactive local customers and disabled remote Customers.
- [x] Update import UI, customer lookup invalidation, and import audit events.
- [x] Verify isolated database E2E and a live read/import into disposable local Core storage.
      Evidence: `test:e2e:frappe-mobile-customers`; logicx.tmnext.in preview returned 50 associations.
      Repeated import of one live association retained its local identity and mobile. No existing tenant customer or remote records changed.

## LogicX source reference

- [x] Catalogue all 25 DocType definitions and adjacent controller/form functions in the supplied LogicX HR folder.
      Evidence: [source catalogue](LOGICX-CRM-REFERENCE.md) and [CRM comparison](../../crm/agent/FRAPPE-COMPARISON.md), reviewed on 17-10-2026.
      `check:component-docs` and `test:component-docs` passed (2 tests). No live site was exercised.
- [x] Bind the three approved Duty DocTypes to the LogicX source field contract.
      Evidence: [field mapping](CRM-DUTY-FIELD-MAPPING.md), source-derived contract fixture,
      seven mapping tests, and the isolated Duty API/database E2E, 17-10-2026.
      The combined `npm run test:crm-frappe` suite passes 90 unit tests and the database E2E.
      CRM/Frappe API and web typechecks, lint, package builds, and the Platform web production build passed.
- [x] Verify actual remote metadata and worker delivery against `logicx.tmnext.in`.
      Evidence: `npm run test:e2e:crm-duties-live`, 17-10-2026: Daily, Weekly, Monthly, Yearly,
      twelve remote creates, all mapped/fetched field assertions, four report PUT retries, and successful cleanup.
      Exact-email Employee mapping was verified and saved with a platform audit event.
      A separate read-only check confirmed zero labelled remote fixtures and disposable local databases remained.
- [ ] Verify Platform authentication, queue relay scheduling, and browser/mobile acceptance separately.
      Remote inactive/effective-date fields, structured report outcomes/revision identities,
      unsupported recurrences, and guaranteed first-create deduplication remain remote contract limits.

## Responsibility

Verified external connections, user mappings, imports, exports, and approved CRM integration workers.

Use the public verified connection contract. Resolve tenant credentials server-side. Queue retryable transfers and preserve parent mapping, idempotency, and audit behavior.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Frappe source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs frappe`
- `npm run typecheck -w @codexsun/frappe-api`
- `npm run lint -w @codexsun/frappe-api`
- `npm run build -w @codexsun/frappe-api`
- `npm run typecheck -w @codexsun/frappe-web`
- `npm run lint -w @codexsun/frappe-web`
- `npm run build -w @codexsun/frappe-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
