import { Navigate, Outlet } from 'react-router-dom'
import { buildAdminPortalPath } from '@framework-core/web/auth/lib/portal-routing'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

export function RequireSuperAdmin() {
  const { session } = useAuth()

  if (!session?.user.isSuperAdmin) {
    return <Navigate to={buildAdminPortalPath()} replace />
  }

  return <Outlet />
}
