import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Button } from '@codexsun/ui/components/button'
import { Activity, FolderGit2, Network, Settings2 } from 'lucide-react'
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

export function App() {
  const [workspace, setWorkspace] = useState<'cloud-settings' | 'repositories' | 'services'>(
    'services',
  )

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
        ) : (
          <CloudSettingsWorkspace onBack={() => setWorkspace('services')} />
        )}
      </Suspense>
    </MdiMain>
  )
}
