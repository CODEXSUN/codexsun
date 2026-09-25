# Q Cafe Marketplace Module

The marketplace module owns partner connections, menu mappings, order intake, intake events, and settlements.

It depends on `qcafe.foundation`.

QC-0803 exposes partner registration against an official adapter contract (`<partner>.v<version>`), menu mapping from partner references to catalog items, idempotent order intake by partner order reference and idempotency key, intake accept/reject lifecycles with event trails, and settlement posting with fee reconciliation.

Official adapter contracts start with `zomato.v1`, `swiggy.v1`, `ubereats.v1`, and `generic-webhook.v1`. A partner request that names any other contract is rejected.

QC-0804 exposes delivery fulfillment and reconciliation. An accepted intake links one POS order, then records one fulfillment with rider, collected, and fee amounts through assigned, picked, delivered, or cancelled states. Reconciliation compares partner collection against the bill payable, totals posted payments, and reports collection variance with a balanced flag.
