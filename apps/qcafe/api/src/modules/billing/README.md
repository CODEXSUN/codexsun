# Q Cafe Billing Module

The billing module owns bills, payments, receipts, vouchers, refunds, cash shifts, and settlement records.

It depends on `qcafe.foundation` and `qcafe.pos`.

It exposes scoped billing operations for posted bills, safe tenders, receipts, advance vouchers, cash custody,
shift settlement, and business-day close. Posted financial records are append-only. Refunds and reversals are new
linked money records; they do not rewrite the original payment.
