import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { frappeSalesOrderPushPolicyResponseSchema } from "../../shared/index.js"

import { assertFrappeViewer } from "./access.js"
import { readStoredFrappeSettings } from "./settings-service.js"

export async function readFrappeSalesOrderPushPolicy(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertFrappeViewer(user)

  const settings = await readStoredFrappeSettings(database)

  return frappeSalesOrderPushPolicyResponseSchema.parse({
    policy: {
      generatedAt: new Date().toISOString(),
      connectorEnabled: settings?.enabled ?? false,
      verificationStatus: settings?.lastVerificationStatus ?? "idle",
      approvalMode: "auto_for_paid_orders",
      autoPushSources: [
        "checkout_verify",
        "razorpay_webhook",
        "payment_reconcile",
      ],
      retryMode: "no_auto_retry",
      gates: [
        {
          gateKey: "connector_ready",
          label: "Connector readiness",
          rule: "Automatic Sales Order push is allowed only when the Frappe connector is enabled, configured, and last verification status is passed.",
        },
        {
          gateKey: "payment_committed",
          label: "Paid-order commit",
          rule: "ERP push happens only after ecommerce has already committed the local order into a paid state; ERP failure must not roll back that local paid state.",
        },
        {
          gateKey: "manual_approval_scope",
          label: "Approval scope",
          rule: "Initial paid-order push is auto-approved for locally committed paid orders, but any failed transactional write moves into operator-visible manual replay rather than automatic repeat attempts.",
        },
        {
          gateKey: "duplicate_guard",
          label: "Duplicate guard",
          rule: "A storefront order with the same provider payment id and an existing synced Sales Order record must be treated as already approved and must not create a second ERP Sales Order.",
        },
        {
          gateKey: "retry_policy",
          label: "Retry policy",
          rule: "Transactional Sales Order writes never auto-retry in the connector. Retry is manual replay only after the operator reviews the failure reason and connector state.",
        },
      ],
      operatorRules: [
        "Auto-push may originate from checkout verification, payment webhook capture, or payment reconciliation, but those are transport triggers only; connector orchestration stays inside apps/frappe.",
        "If ERP item-code mapping is missing, connector verification is stale, or ERP rejects the write, the order remains paid locally and the failure is persisted for manual replay.",
        "Manual replay is the approval boundary after failure: the operator must first confirm connector readiness and the failure cause before re-attempting the Sales Order push.",
      ],
    },
  })
}
