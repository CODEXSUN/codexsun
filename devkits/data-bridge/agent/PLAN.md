# Data Bridge plan

## Ordered business import addition

Add one queued action for the verified pair: Common → Masters → Billing, in parent order.
Use saved verified mappings and target business identity for foreign IDs.
Verify complete eligible invoice descendants and detect source drift afterward.
Keep one report with Summary, Common, Masters, Billing, Invoices, and Warnings tabs.
Do not expose internal chunk sessions as separate user reports.
Retain per-table transaction boundaries and preserve target conflicts.
Use disposable integration tests before live execution.

## Current delivery

The grouped migration workflow and local acceptance are complete for this release.
The sidebar contains Database Connection, Common Tables, Master Tables, Billing Tables, and Report.
Each business group owns Table Mapping, Field Mapping, Import Preparation, Confirm Import, and Results tabs.
Existing saved records, migration ledger checksums, and legacy deep links remain compatible.

## Ownership

Group folders own business scope, fixed routes and clients, catalog policy, and workspace behavior.
Technical record owners handle connections, staged transfers, selected reviews, queue execution, and reports.
Platform composes Super Admin access and durable target-scoped jobs.
Data Migration owns external credentials and exposes only the public server resolver used here.
Do not duplicate business entity CRUD in Platform or in shared UI infrastructure.

## Operating sequence

1. Verify an approved connection pair and recovery material.
2. Discover live schemas, eligible business tables, and declared relationships.
3. Order common parents, masters, documents, children, and allocations by dependencies.
4. Map selected source tables and fields to inspected target contracts.
5. Resolve parents through business identity and show the prepared destination values.
6. Audit selected records and obtain explicit confirmation for live writes.
7. Process through Queue Manager with revisions, locks, target checks, and per-table transactions.
8. Verify actual saved business values, complete documents, references, preservation, and job outcomes.
9. Record approved warnings and sanitized evidence before handoff.

Read [SKILLS.md](SKILLS.md) for the detailed manual and automation protocol.

## Current acceptance

The local SUKRAA and ALTEX import checked 140 business tables and 354 relationships.
All 321 invoices and 1,211 item rows matched after foreign-identity translation.
SUKRAA retains two approved differences. ALTEX retains five deleted invoices as deleted history.
No source business record is missing. No foreign reference is broken.
Source data and pre-existing target business rows remain preserved.
Read [the full verification record](BILLING-IMPORT-VERIFICATION-2026-10-24.md) for exact table order and counts.

## Current limits

Preparation uses stable supported integer source keys and bounded selections.
Unsupported keys, cycles, relationships, required protected values, and incompatible types remain blocked.
Normal transfers retain selected source snapshots. Reprepare after mutable source or parent changes.
Corrections use a separate, explicitly confirmed fingerprinted before/after plan.
Current commits are per table. Selecting an invoice header does not automatically stage every child.
Complete aggregate verification follows the required child imports.
There is no unattended arbitrary SQL importer, fuzzy merge, or single cross-table invoice transaction.
Billing runtime queues and provider submissions are never replayed as business data.

## Future extensions

Add future CRM or ecommerce business groups through separate owner policies and workspaces.
Define their eligible data, parent contracts, deletion policy, comparison rules, and acceptance before live work.
A future whole-document preparation or atomic commit needs an explicit contract and rollback tests.
These extensions are not included in the current acceptance claim.

## Release gates

Run owner and Platform checks, module boundaries, focused disposable database tests, Docs sync, and dependency validation.
Run version alignment after an authorized lockstep bump.
Preserve historical release notes. Record current evidence and limits without rerunning live writes for release screenshots.
