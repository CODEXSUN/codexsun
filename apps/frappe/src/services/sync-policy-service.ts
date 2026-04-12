import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { frappeSyncPolicyResponseSchema } from "../../shared/index.js"
import type { FrappeEnvConfig } from "../config/frappe.js"
import { assertFrappeViewer } from "./access.js"
import { readStoredFrappeSettings } from "./settings-service.js"

export async function readFrappeSyncPolicy(
  database: Kysely<unknown>,
  user: AuthUser,
  options?: { config?: FrappeEnvConfig; cwd?: string }
) {
  assertFrappeViewer(user)

  const settings = await readStoredFrappeSettings(database, options)
  const timeoutSeconds = settings.timeoutSeconds

  return frappeSyncPolicyResponseSchema.parse({
    policy: {
      generatedAt: new Date().toISOString(),
      connectorEnabled: Boolean(settings.enabled),
      verificationStatus: settings.lastVerificationStatus,
      policies: [
        {
          operationKey: "erp-read",
          label: "ERPNext read calls",
          retryable: true,
          maxAttempts: 3,
          backoffSeconds: [5, 30],
          timeoutSeconds,
          retryOn: ["network_error", "timeout", "http_429", "http_5xx"],
          failureDisposition:
            "Stop the current sync run after the final failed attempt and record the connector failure for operator review.",
        },
        {
          operationKey: "snapshot-refresh",
          label: "Local snapshot refresh",
          retryable: true,
          maxAttempts: 2,
          backoffSeconds: [10],
          timeoutSeconds,
          retryOn: ["database_busy", "transient_write_conflict"],
          failureDisposition:
            "Abort the current refresh batch on the final failed write so partial snapshot replacement is not treated as success.",
        },
        {
          operationKey: "projection-write",
          label: "Downstream projection writes",
          retryable: false,
          maxAttempts: 1,
          backoffSeconds: [],
          timeoutSeconds,
          retryOn: [],
          failureDisposition:
            "Do not auto-retry downstream writes that could duplicate or reorder side effects; surface them to the replay queue instead.",
        },
        {
          operationKey: "manual-replay",
          label: "Operator replay",
          retryable: false,
          maxAttempts: 1,
          backoffSeconds: [],
          timeoutSeconds,
          retryOn: [],
          failureDisposition:
            "Manual replay must start from the last failed unit with operator visibility into the prior failure reason and attempt history.",
        },
      ],
      operatorRules: [
        "Connector syncs must fail closed: a timed-out or exhausted ERP read is not allowed to silently reuse stale remote success state.",
        "Only idempotent ERP reads and local snapshot refresh writes are eligible for automatic retry; downstream projection and transactional writes stay manual-replay only.",
        "A saved verification status of passed is a release prerequisite for future live ERP sync runs, but it is not itself a guarantee that the next sync will succeed.",
      ],
    },
  })
}
