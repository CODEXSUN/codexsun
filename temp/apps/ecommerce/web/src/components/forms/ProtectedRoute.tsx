import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/state/authStore"
import type { AuthRole } from "@/types/auth"
import { rememberRequestedPath } from "@framework-core/web/auth/lib/navigation-state"

interface ProtectedRouteProps {
  allowedRoles?: AuthRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Restoring session...
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    rememberRequestedPath(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length) {
    const activeRole = auth.user?.role ?? auth.claims?.role
    if (!activeRole || !allowedRoles.includes(activeRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
