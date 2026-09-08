import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Activity, Network } from 'lucide-react'
import { OrchestrationWorkspace } from './modules/orchestration'

export function App() {
  return (
    <MdiMain
      applicationIcon={Network}
      applicationId="orship"
      applicationName="Orship"
      navigation={[
        {
          defaultOpen: true,
          label: 'Operations',
          items: [{ active: true, icon: Activity, label: 'Live services' }],
        },
      ]}
      notificationCount={0}
      primaryAction={null}
      searchPlaceholder="Search services"
      statusLabel="Live orchestration"
      workspaceTitle="Orship"
    >
      <OrchestrationWorkspace />
    </MdiMain>
  )
}
