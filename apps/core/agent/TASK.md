# Core tasks

## Team Head workspace reads — 2026-10-21

- Extended the repeatable Core workspace read grant to `team-head` so the new role can load CRM setup and contact lookups.
- No Core write or lifecycle grants were added. The CRM scope database suite verifies this read permission for Team Head.

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

### Company image branding formats, 21-10-2026

- Company Logo accepts light logo, dark logo, and favicon files in SVG, PNG, JPEG, WebP, AVIF, GIF, ICO, and BMP formats.
- Platform checks the image signature before it writes the file. SVG files also reject scripts and external content.
- Core stores branding paths. Platform reads the assets through the existing Default Company public contract.
- SVG files are limited to 640 KB. Raster image files are limited to 5 MB.
- The custom-domain login page and public home page use the Default Company name.

### Core workspace read access for User role, 19-10-2026

- The repeatable Core permission seed grants `core.application.records.view` to Admin, Super Admin, Manager, and User roles.
- The User role receives no Core create, update, delete, or lifecycle permission from this grant.
- `npm run test:e2e:crm-work-reports` verifies the grants on an isolated tenant database and confirms CRM enquiry view remains separately permission-scoped.

### Frappe contact document identity, 18-10-2026

- Core resolves Frappe Customer records using the actual document name as contact code and preserves the local identity when correcting a legacy `EXT-<hash>` code.
- Repeat import, shared mobile, and source-site collision behavior pass in `npm run test:e2e:frappe-mobile-customers`.
- Live LogicX verification confirmed Customer `C9138` is stored as the local code and repeat import keeps the same local ID. Frappe export match/mismatch verification was read-only; mismatch export is blocked without remote record creation.
- Core and Platform API typechecks, Core lint, and Core/Frappe boundary checks passed. Core has no contact-specific unit test files; the contact persistence E2E is the targeted behavioral test.

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

## 2026-10-17: Live CRM workspace acceptance

Core workspace read seeds now include Admin, Super Admin, and Manager. Reconciled both live tenant databases. Master write grants remain Admin-only.
