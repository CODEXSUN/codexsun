import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Button } from '@codexsun/ui/components/button'
import { ClientLoginPage } from '@codexsun/ui/blocks/auth'
import { Activity, Download, FolderGit2, Network, Settings2 } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'

const CloudSettingsWorkspace = lazy(async () => {
  const module = await import('./modules/orchestration/cloud-settings.workspace')
  return { default: module.CloudSettingsWorkspace }
})

const OrchestrationWorkspace = lazy(async () => {
  const module = await import('./modules/orchestration/orchestration.workspace')
  return { default: module.OrchestrationWorkspace }
})
const RepositoryWorkspace = lazy(async () => {
  const module = await import('./modules/orchestration/repository.workspace')
  return { default: module.RepositoryWorkspace }
})
const AppDeployerWorkspace = lazy(async () => {
  const module = await import('./modules/orchestration/app-deployer.workspace')
  return { default: module.AppDeployerWorkspace }
})

export function App() {
  const [workspace, setWorkspace] = useState<'cloud-settings' | 'deployer' | 'repositories' | 'services'>(
    'services',
  )
  const [authenticated, setAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState<string>()
  const [loginBusy, setLoginBusy] = useState(false)
  if (!authenticated) {
    return <ClientLoginPage brandName="Orship" busy={loginBusy} embedded error={loginError} onSubmit={async (identifier, password) => {
      setLoginBusy(true); setLoginError(undefined)
      try {
        const base = import.meta.env.VITE_PLATFORM_API_URL || 'http://127.0.0.1:6010'
        const response = await fetch(`${base}/api/identity/login`, { body: JSON.stringify({ identifier, password, device: { clientType: 'web', deviceId: crypto.randomUUID(), deviceName: 'Orship' } }), credentials: 'include', headers: { 'content-type': 'application/json' }, method: 'POST' })
        if (!response.ok) throw new Error('Platform Identity rejected this sign in.')
        setAuthenticated(true)
      } catch (error) { setLoginError(error instanceof Error ? error.message : 'Could not sign in.') } finally { setLoginBusy(false) }
    }} registrationEnabled={false} />
  }

  return (
    <MdiMain
      applicationIcon={Network}
      applicationLogoUrl="/orship-logo.png"
      applicationId="orship"
      applicationName="Orship"
      navigation={[
        {
          defaultOpen: true,
          label: 'Operations',
          items: [
            {
              active: workspace === 'services',
              icon: Activity,
              label: 'Live services',
              onSelect: () => setWorkspace('services'),
            },
            {
              active: workspace === 'repositories',
              icon: FolderGit2,
              label: 'Repository manager',
              onSelect: () => setWorkspace('repositories'),
            },
            { active: workspace === 'deployer', icon: Download, label: 'App deployer', onSelect: () => setWorkspace('deployer') },
          ],
        },
      ]}
      notificationCount={0}
      primaryAction={null}
      searchPlaceholder="Search services"
      sidebarFooter={
        <Button
          className="w-full justify-start"
          onClick={() => setWorkspace('cloud-settings')}
          variant="ghost"
        >
          <Settings2 />
          Deployment targets
        </Button>
      }
      statusLabel="Live orchestration"
      workspaceTitle="Orship"
    >
      <Suspense
        fallback={<div className="p-6 text-sm text-muted-foreground">Loading workspace…</div>}
      >
        {workspace === 'services' ? (
          <OrchestrationWorkspace onOpenDeploymentSettings={() => setWorkspace('cloud-settings')} />
        ) : workspace === 'repositories' ? (
          <RepositoryWorkspace />
        ) : workspace === 'deployer' ? (
          <AppDeployerWorkspace />
        ) : (
          <CloudSettingsWorkspace onBack={() => setWorkspace('services')} />
        )}
      </Suspense>
    </MdiMain>
  )
}
