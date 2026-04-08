import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

function isBillingBackofficeUser(user: AuthUser) {
  return ["admin", "staff"].includes(user.actorType)
}

export function hasBillingPermission(user: AuthUser, permissionKey: string) {
  return (
    user.isSuperAdmin ||
    user.permissions.some((permission) => permission.key === permissionKey)
  )
}

export function assertBillingViewer(user: AuthUser) {
  if (!isBillingBackofficeUser(user)) {
    throw new ApplicationError(
      "Billing routes are available only to backoffice users.",
      {
        actorType: user.actorType,
      },
      403
    )
  }
}

export function assertBillingVoucherApprover(user: AuthUser) {
  assertBillingViewer(user)

  if (!hasBillingPermission(user, "billing:vouchers:approve")) {
    throw new ApplicationError(
      "You do not have permission to approve or reject billing vouchers.",
      {
        missingPermissionKeys: ["billing:vouchers:approve"],
      },
      403
    )
  }
}

export function assertBillingAuditViewer(user: AuthUser) {
  assertBillingViewer(user)

  if (!hasBillingPermission(user, "billing:audit:view")) {
    throw new ApplicationError(
      "You do not have permission to review billing audit records.",
      {
        missingPermissionKeys: ["billing:audit:view"],
      },
      403
    )
  }
}
