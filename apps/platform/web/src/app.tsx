import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { RouterProvider } from '@tanstack/react-router'
import { LayoutDashboardIcon } from 'lucide-react'
import { platformRouter } from './app-router'
import { useIdentityProfile } from './modules/identity'
import { systemTopologySections } from './modules/system/system.topology'

export function App() {
  const isAuthPage = /\/(?:login|register|password\/forgot)$/u.test(window.location.pathname)
  const identityProfile = useIdentityProfile(window.location.pathname, !isAuthPage)
  if (isAuthPage) return <RouterProvider router={platformRouter} />

  const portalIdentity = resolvePortalIdentity(window.location.pathname)

  return (
    <MdiMain
      applicationId={portalIdentity.id}
      applicationName={portalIdentity.name}
      navigation={[]}
      primaryAction={{
        icon: LayoutDashboardIcon,
        label: 'Overview',
        onSelect: () => window.location.assign('/overview'),
      }}
      searchPlaceholder="Search workspace"
      showMdiOverview={window.location.pathname === '/overview'}
      topologySections={systemTopologySections}
      workspaceTitle="System"
      statusLabel={identityProfile.status}
      user={identityProfile.user}
    >
      <RouterProvider router={platformRouter} />
    </MdiMain>
  )
}

function resolvePortalIdentity(path: string) {
  if (path === '/sa' || path.startsWith('/sa/')) return { id: 'platform-sa', name: 'Super Admin' }
  if (path === '/admin' || path.startsWith('/admin/'))
    return { id: 'platform-admin', name: 'Admin' }
  return { id: 'platform', name: 'Platform' }
}
