import { AdminPortalPage, ClientPortalPage, SuperAdminPortalPage } from '@codexsun/ui/blocks/auth'
import { usePortalSession } from './identity.hooks'

export function ClientIdentityPortal() {
  const session = usePortalSession('regular', '/login')
  return session.data ? <ClientPortalPage /> : null
}

export function AdminIdentityPortal() {
  const session = usePortalSession('administrator', '/admin/login')
  return session.data ? <AdminPortalPage /> : null
}

export function SuperAdminIdentityPortal() {
  const session = usePortalSession('super-admin', '/sa/login')
  return session.data ? <SuperAdminPortalPage /> : null
}
