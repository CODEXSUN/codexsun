import { LayoutDashboardIcon, ShieldCheckIcon, WrenchIcon } from 'lucide-react'
import { MainWorkspace } from '../../layouts/mdi-main/mdi-main'
import type { MdiNavigationSection } from '../../layouts/mdi-main/mdi-types'

export function PrivilegedDesk({
  applicationId,
  applicationName,
  logout,
  portal,
}: {
  applicationId: string
  applicationName: string
  logout(): void
  portal: 'admin' | 'super-admin'
}) {
  const superAdmin = portal === 'super-admin'
  const title = `${applicationName} ${superAdmin ? 'Super Admin' : 'Admin'} Desk`
  return (
    <MainWorkspace
      applicationId={applicationId}
      applicationName={applicationName}
      navigation={superAdmin ? superAdminNavigation() : adminNavigation()}
      primaryAction={null}
      user={{
        initials: superAdmin ? 'SA' : 'A',
        name: superAdmin ? 'Super administrator' : 'Administrator',
        onSignOut: logout,
      }}
      workspaceTitle={title}
    >
      <main className="p-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {superAdmin
            ? 'Maintenance, access controls, and higher-end reports.'
            : 'Manager approvals, administration controls, and reports.'}
        </p>
      </main>
    </MainWorkspace>
  )
}

function adminNavigation(): MdiNavigationSection[] {
  return [
    { items: [{ active: true, icon: LayoutDashboardIcon, label: 'Overview' }], label: 'Desk' },
    { items: [{ icon: ShieldCheckIcon, label: 'Approvals' }, { icon: LayoutDashboardIcon, label: 'Reports' }], label: 'Administration' },
  ]
}

function superAdminNavigation(): MdiNavigationSection[] {
  return [
    { items: [{ active: true, icon: LayoutDashboardIcon, label: 'Overview' }], label: 'Maintenance' },
    { items: [{ icon: WrenchIcon, label: 'System maintenance' }, { icon: ShieldCheckIcon, label: 'Access audit' }, { icon: LayoutDashboardIcon, label: 'Higher-end reports' }], label: 'Platform' },
  ]
}
