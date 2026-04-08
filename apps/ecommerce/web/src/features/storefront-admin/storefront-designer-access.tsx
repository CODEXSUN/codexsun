import type { AuthUser } from "@cxapp/shared"
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import { AlertTriangle, Eye } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

const storefrontDesignerViewPermissionKeys = new Set([
  "ecommerce:storefront:view",
  "ecommerce:storefront:design",
  "ecommerce:storefront:manage",
])

const storefrontDesignerEditPermissionKeys = new Set([
  "ecommerce:storefront:design",
  "ecommerce:storefront:manage",
])

const storefrontDesignerApprovePermissionKeys = new Set([
  "ecommerce:storefront:approve",
  "ecommerce:storefront:manage",
])

function hasAnyPermission(user: AuthUser | null, permissionKeys: Set<string>) {
  if (!user) {
    return false
  }

  if (user.isSuperAdmin) {
    return true
  }

  return user.permissions.some((permission) => permissionKeys.has(permission.key))
}

export function canViewStorefrontDesigner(user: AuthUser | null) {
  return hasAnyPermission(user, storefrontDesignerViewPermissionKeys)
}

export function canEditStorefrontDesigner(user: AuthUser | null) {
  return hasAnyPermission(user, storefrontDesignerEditPermissionKeys)
}

export function canApproveStorefrontDesigner(user: AuthUser | null) {
  return hasAnyPermission(user, storefrontDesignerApprovePermissionKeys)
}

export function useStorefrontDesignerAccess() {
  const auth = useAuth()

  return {
    canViewStorefrontDesigner: canViewStorefrontDesigner(auth.user),
    canEditStorefrontDesigner: canEditStorefrontDesigner(auth.user),
    canApproveStorefrontDesigner: canApproveStorefrontDesigner(auth.user),
  }
}

export function StorefrontDesignerPermissionCard({
  canEdit,
  canApprove,
}: {
  canEdit: boolean
  canApprove?: boolean
}) {
  return (
    <Card
      className={
        canEdit
          ? "border-sky-200/80 bg-sky-50/70 py-0 shadow-sm"
          : "border-amber-300/70 bg-amber-50/70 py-0 shadow-sm"
      }
    >
      <CardContent className="flex items-start gap-3 p-4 text-sm">
        {canEdit ? (
          <Eye className="mt-0.5 size-4 shrink-0 text-sky-700" />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
        )}
        <div className="space-y-1">
          <p className={canEdit ? "font-medium text-sky-950" : "font-medium text-amber-950"}>
            {canEdit ? "Designer edit access is active." : "Read-only designer access."}
          </p>
          <p className={canEdit ? "text-sky-900/80" : "text-amber-900/80"}>
            {canEdit
              ? canApprove
                ? "This role can edit drafts and approve live storefront publishing changes."
                : "This role can edit storefront drafts, but publishing and rollback require approval access."
              : "This role can review storefront designer content, but saving changes is disabled."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
