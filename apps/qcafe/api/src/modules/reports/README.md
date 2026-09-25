# Q Cafe Reports Module

The reports module owns read-only operational reports over posted records. It writes no business tables.

It depends on `qcafe.foundation` and reads posted rows owned by other Q Cafe modules.

QC-0901 exposes sales, tax, payment, item, table, kitchen, shift, stock, and event reports. Every report states its location and business-day scope and reads posted records only: voided bills, failed payments, draft plans, and superseded revisions are excluded. Scoping accepts a business day identifier or an explicit date range.

QC-0903 exposes dashboard alerts over the same posted and live records. Every alert links its recorded subject through `subjectType` and `subjectId`.
