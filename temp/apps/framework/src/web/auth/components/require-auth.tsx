import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ActorType } from '@shared/index'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { rememberRequestedPath } from '@framework-core/web/auth/lib/navigation-state'
import { getDefaultPortalPath } from '@framework-core/web/auth/lib/portal-routing'

interface RequireAuthProps {
  allow?: ActorType[]
}

export function RequireAuth({ allow }: RequireAuthProps = {}) {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    rememberRequestedPath(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allow && session && !allow.includes(session.user.actorType)) {
    return <Navigate to={getDefaultPortalPath(session.user.actorType)} replace />
  }

  return <Outlet />
}
