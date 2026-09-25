# Q Cafe Accounting Contracts

## Context

QC-0805 requires approved statutory and accounting contracts before accounting mapping and journal export can be implemented. No prior approval existed in `assist/`; the Q Cafe table sketch (`apps/qcafe/agent/exec/qcafe-table.md`, B16-B18) gated accounting tables on an approved accounting process. Approval was requested and granted by the repository owner on 2026-09-24 for the minimal contract below.

## Decision

Q Cafe gains a `qcafe.accounting` module that generates balanced, source-linked, double-entry journals in minor currency units from posted billing records only. Approved chart per business: 4000 Sales (revenue), 4010 Discounts (contra-revenue, reserved), 2000 GST output (liability, single account for all tax codes), 1000 Cash, 1010 Card clearing, 1020 UPI clearing, 1030 Bank (also digital and marketplace kinds), 1100 Marketplace receivable.

Journal sources: bill posted, sale payment posted, refund or reversal posted, voucher issue, voucher application. Posting map: bill DR 1100 / CR 4000 (net of tax) / CR 2000 (tax); payment DR method clearing / CR 1100; refund DR 4000 / CR method clearing; voucher issue DR clearing / CR 1100; voucher application DR 1100 / CR 1100 (zero-net linkage; voucher liability stays in the billing module until a dedicated liability account is approved). Journals generate as drafts and post explicitly; posted journals are immutable. Journal numbers use the shared `qcafe_number_sequences` table with a new `journal` document kind. Failed payments and unposted records never generate journals.

## Alternatives

- Post journals automatically on source events: rejected, because explicit posting keeps a review gate and mirrors the settlement pending/posted pattern.
- Per-tax-code liability accounts: rejected for now; a single GST output account keeps the chart minimal until statutory filing needs detail.
- COGS postings: rejected; stock items carry no unit cost in the current model, so cost postings would be fabricated.

## Consequences

- New `qcafe.accounting` module with `qcafe.accounting.001` migration; one-word coordinated change adds `journal` to the foundation number-sequence kind union.
- No credentials, payment rails, or filing integrations are included; export is a CSV text of posted journals for an external accountant.
- Rollback: stop generating journals; existing billing records are unaffected because journals only read posted data.

## Verification

- Every generated journal balances (sum of debits equals sum of credits) and links its source document identifier.
- Owner: `apps/qcafe/api/modules/accounting`. Review with the QC-0805 handoff.
