import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Button } from '@codexsun/ui/components/button'
import { Activity, Network, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { CloudSettingsWorkspace, OrchestrationWorkspace } from './modules/orchestration'

export function App() {
  const [workspace, setWorkspace] = useState<'cloud-settings' | 'services'>('services')

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
      {workspace === 'services' ? (
        <OrchestrationWorkspace onOpenDeploymentSettings={() => setWorkspace('cloud-settings')} />
      ) : (
        <CloudSettingsWorkspace onBack={() => setWorkspace('services')} />
      )}
    </MdiMain>
  )
}
