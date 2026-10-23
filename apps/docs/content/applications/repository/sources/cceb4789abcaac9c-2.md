# Frappe tasks

Repository source: `apps/frappe/agent/TASK.md`

Source SHA-256 (LF line endings): `1c94014c63cd705e71850d3ca73f253b2d044f15f1c87f2f1792363ceac7a7d4`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
; the exact remote test document and local CRM fixture were then removed and absence verified. CRM did not create another Frappe Customer or Supplier. This was a local browser/API queue test against the live Frappe site, not a production deployment.

## Enquiry live sync and source timestamps - 2026-10-18

- [x] Enforce the approved outbound scope at the Frappe export service boundary: enquiries may be
      exported; contacts, activities, and call logs are blocked for both manual and queued requests.
      Verification remains available for every kind. Imports and stored data are unchanged.
      Regression: `export.policy.test.ts`.

- [x] Limit scheduled CRM-to-Frappe exports to Enquiries; do not automatically export Contacts,
      Activities, or Call Logs without separate approval. Regression:
      `frappe-live-sync.policy.test.ts` (2/2).
- [ ] Deploy the current sync changes. Production preflight is blocked because the guarded updater
      expects Compose project `codexsun-billing` / service `platform-api`, while the live API is
      owned by project `codexsun` / service `codexsun-api`; the checked-in updater's deployment
      environment also does not match the active release. Preflight stopped before backup or
      container changes. CXApp and all current application containers remained running.
- [ ] Preserve exact Frappe creation/modified timestamps and comment timestamps when importing or
      reconciling enquiries. Incrementally receive Frappe changes and post CRM enquiry creates and
      updates to the verified linked Frappe document through the live queue.
- [ ] Verify queue worker operation, one safe live create/update/readback, and inbound reconciliation
      on the configured tenant. Record production evidence only after remote and local values match.
      Frappe system `creation` is server-generated on a new remote document; CRM business date maps
      to the Enquiry `date` field.

## Frappe contact document identity - 2026-10-18

- [x] Store the actual Frappe Customer document name as the Core contact code and keep site-scoped identity links separately.
- [x] Convert a legacy `EXT-<hash>` code in place when its existing imported Frappe association is re-imported; preserve the local contact ID and linked data.
- [x] Show identity status on import and export, reject cross-site or Customer/Supplier code mismatches, and block export when that parent identity is not exact.
- [x] Verify `C9138` live with outbound match and mobile-only post/readback; `npm run test:e2e:frappe-mobile-customers` covers legacy identity correction, repeat imports, and source collisions.
      API/web typechecks and lint, Core/Frappe boundary checks, and component docs validation passed. The tenant migration is part of the local migration path; no production migration or deployment was run.

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

## Live CRM create and edit regression - 17-10-2026

- [x] Verify all four SOP frequencies against logicx.tmnext.in using the saved connection.
- [x] Verify assignment Index edits and report Date/Actions edits update existing remote documents.
- [x] Verify mapped and fetched fields, outcome/issue preservation, revision evidence, and local edit history.
- [x] Check one remote report per SOP and stable identity on retry.
- [x] Delete twelve test documents and confirm no labelled remote documents or disposable databases remain.
      Evidence: `npm run test:e2e:crm-duties-live`; eight mapping tests and isolated Duty E2E also passed.
      Direct worker dispatch was used. Background relay scheduling was not tested.

## Enquiry assignment and numbering round trip — 2026-10-23

- [x] Export the assignee through the verified site-scoped Employee mapping. Block missing or ambiguous mappings.
- [x] Reject unmapped inbound Employee assignments before updating CRM. Keep explicit remote unassignment supported.
- [x] Preserve a CRM-originated enquiry list when the remote group is empty and the outbound group contract remains deferred.
- [x] Resolve exports against installed Enquiry Status names. The live ERP uses Open and rejects the old Pending alias.
- [x] Adopt the serial returned by Frappe after posting. Reconcile existing links in a transaction with collision relocation and activity history.
- [x] Gate failed-event retry by the existing authorized context, bidirectional settings, verified credentials, and supported event types.
- [x] Pass 127 CRM enquiry and Frappe tests, the isolated inbound checkpoint/retry database test, API builds, lint, boundaries, and dependency layout.
- [x] Deploy the scoped API patch to TECHMEDIA's existing erp1.techmedia.in connection. Verify all eight deployed JavaScript checksums and public health.
- [x] Verify web enquiry Q2062, mobile enquiry Q2063, and Frappe-origin enquiry Q2064. Confirm number, mobile, customer association, message, assignee, status, priority, and the tested due date.
- [x] Verify mobile Job Comments export and remote comments import. Repeat Redis exports and two imports without duplicate enquiries or comments.
- [x] Observe automatic import jobs 1242-1245 one minute apart, each completed with zero failures and advancing checkpoints.
- [ ] Resolve missing Frappe Mobile Contact Customer associations for nine older CRM enquiries, currently numbered 2083-2091. Retry checks report missing identities rather than guessing Customers.

The backup is /home/codexsun/.container/backups/techmedia-before-enquiry-align-20261023T1435.sql with a verified SHA-256 sidecar.
The API image is codexsun/api:1.1.47-enquiry-align. Web remains 1.1.47 and the emulator uses TechMedia 1.1.48.
Tasks remain local. No LogicX source, Customer record, customer association, or shared infrastructure was changed.
Frappe writes and reads used the saved connection API. This does not claim Frappe Desk UI verification.

## Nine enquiry repairs completed — 2026-10-23

- [x] Resolve the earlier nine association blockers through existing Customers. Use user-selected C2083 for seven enquiries, C3663 for Need Printer, and exact unique match C9325 for Need latest camera.
- [x] Create eight minimum Mobile Contacts and eight associations. Preserve original Customer details and local record history.
- [x] Verify all nine synced records and remote links, with matching serials 2065-2073.
- [x] Replay twelve exports through Redis/BullMQ jobs 1296-1307. All reused existing remote identities.
- [x] Repeat imports 1308-1309: each scanned nine, created zero, skipped nine, and failed zero. Verify zero unsent enquiry events.
- [x] Verify green web indicators for all nine, Frappe Desk Q2066, and mobile assigned enquiry 2071. Other assignees retain their existing visibility.

The previous blocked checklist records the earlier state. These repairs supersede that blocker. No new Customer or LogicX source change was required. Tasks remain local.

## Test record cleanup verified — 2026-10-23

- [x] Verify Q2057, Q2058, Q2060-Q2064, and Q2067 are Closed with one matching Job Comments closure note each.
- [x] Confirm zero unsent enquiry events after cleanup. Verify Q2062 Closed in Frappe Desk.
- [x] Retain SOP-14, ASSIGN3, and REPORTING353 with test-completion notes. SOP Item and SOP Assigned have no Closed field.

See [CRM cleanup and emulator evidence](../../crm/agent/RELEASE-1.1.50-VERIFICATION.md). Tasks remain local. Existing business enquiries, Customers, and collection history remain intact.
```
