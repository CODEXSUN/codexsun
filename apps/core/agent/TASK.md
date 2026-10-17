# Core tasks

## Responsibility

Shared tenant masters, contact and product identity, organization records, and geographic relationships.

A concrete leaf owns its schema, repository, validation, routes, seeds, and UI. Other apps use public lookup contracts rather than private Core implementations.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Core source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

### External customer resolution, 17-10-2026

- Added public `resolveExternalCustomerForDatabase` for stable external identities and multiple phone associations.
- Separate source customers sharing one phone remain separate. Repeat and concurrent imports are idempotent.
- Inactive/deleted customers and changes to generated external identity codes are rejected.
- Evidence: `npm run test:e2e:frappe-mobile-customers`, using real Core migrations and a disposable database.

### Default Company edit refresh, 17-10-2026

- Default Company stores Edit mode in the workspace URL instead of local component state. The summary card is hidden while editing.
- Chrome confirmed `?form=edit` survives refresh. Keep editing retains the form; Discard changes opens the selected list.
- Default Company is one configuration card, so table search, filters, columns, and a New action do not apply.
- Core and Platform web typecheck and lint passed. This change has no schema, permission, or stored-data effect.

- `node tools/check-module-boundaries.mjs core`
- `npm run typecheck -w @codexsun/core-api`
- `npm run lint -w @codexsun/core-api`
- `npm run build -w @codexsun/core-api`
- `npm run typecheck -w @codexsun/core-web`
- `npm run lint -w @codexsun/core-web`
- `npm run build -w @codexsun/core-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.

### Compact Organisation and master lists, 17-10-2026

- All 36 Core list workspaces use the CRM list tone and render New through the host application header. The singleton Default Company screen also omits its repeated header.
- Column labels and record projections remain in each owning leaf. Shared UI supplies only controls, header placement, and query state. Column filtering runs before existing pagination.
- Common Master New/Edit paths remain unchanged. Application-hosted dialogs render as workspace form panels so sidebar draft confirmation stays available.
- Browser layout checks passed for all 36 Core lists. Countries New opened at its /new URL with the expected form. Existing module services, relationships, and lifecycle checks remain unchanged.
- Passed: Core API/web typechecks, web lint and build, Core boundaries, component documentation checks, and dependency layout check.
- Database persistence and lifecycle mutations were not rerun because this change modifies presentation and navigation only. No migration is required.

### Contact duplicate prevention, 17-10-2026

- Core rejects matching name and phone combinations within a contact group, including ungrouped contacts.
- The transactional check covers create, update, and external phone attachment, with serialized concurrent saves.
- Existing duplicates are not deleted or merged. No migration is required.
- Evidence: `test:e2e:crm-contact-upsert` checks create and edit conflicts, case and whitespace normalization,
  different groups, unchanged self-edits, shared phones for different names, and simultaneous duplicate saves.
- Local browser evidence: submitting sundar with 9655227738 was rejected with the duplicate message.
- Core API typecheck, lint, build, Core/CRM boundaries, formatting, and component documentation checks passed.
- Regression evidence: 90 CRM/Frappe unit tests and both contact database E2E tests passed.
