import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

export function assertBillingViewer(user: AuthUser) {
  if (!["admin", "staff"].includes(user.actorType)) {
    throw new ApplicationError(
      "Billing routes are available only to backoffice users.",
      {
        actorType: user.actorType,
      },
      403
    )
  }
}
