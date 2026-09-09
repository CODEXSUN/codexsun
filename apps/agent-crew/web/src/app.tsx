import { Bot } from 'lucide-react'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { CrewDashboard } from './modules/crew-dashboard'

export function App() {
  return (
    <MdiMain
      applicationIcon={Bot}
      applicationId="agent-crew"
      applicationName="Agent Crew"
      deskRegionId="16"
      navigation={[]}
      primaryAction={null}
      searchPlaceholder="Search Agent Crew"
      showAppearancePanel={false}
      statusLabel="Isolated workers"
      workspaceTitle="Agent Crew"
    >
      <CrewDashboard />
    </MdiMain>
  )
}
