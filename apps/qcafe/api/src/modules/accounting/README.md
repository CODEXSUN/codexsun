# Q Cafe Accounting Module

The accounting module owns the chart of accounts, balanced journals, and journal export.

It depends on `qcafe.foundation` and reads posted records owned by `qcafe.billing`. It never writes billing tables.

QC-0805 implements the contracts approved in `assist/records/2026-09-24-qcafe-accounting-contracts.md`: a minimal per-business chart, journals for bills, payments, refunds, voucher issues, and voucher applications, draft-then-post flow, and CSV export of posted journals. Every journal balances in minor units and links its source document. Failed payments and unposted records never generate journals.
