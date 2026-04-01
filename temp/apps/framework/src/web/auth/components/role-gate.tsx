import type { ActorType } from '@shared/index'
import type { PropsWithChildren, ReactNode } from 'react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

interface RoleGateProps extends PropsWithChildren {
  allow: ActorType[]
  fallback?: ReactNode
}

export function RoleGate({ allow, fallback = null, children }: RoleGateProps) {
  const { session } = useAuth()

  if (!session || !allow.includes(session.user.actorType)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
