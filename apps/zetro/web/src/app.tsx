import { useEffect, useState } from 'react'
import { GlobalLoader } from '@codexsun/ui/blocks/loader'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Bot } from 'lucide-react'
import { AgentChatProvider } from './modules/agent-chat'
import { DeveloperToolsProvider } from './modules/developer-tools'
import { GitDeliveryProvider } from './modules/git-delivery'
import { ProjectTasksProvider } from './modules/project-tasks'
import { ProjectProvider, useProjects } from './modules/projects'
import {
  ZetroDeskSidebar,
  ZetroDeskWorkspace,
  ZetroProjectSidebar,
  ZetroProjectWorkspace,
} from './modules/desk'
import { SettingsWorkspace, ZetroSettingsProvider, useZetroPreferences } from './modules/settings'
import { SystemTasksProvider } from './modules/system-tasks'
import { OperationsMonitor } from './modules/operations'
import { zetroTopologySections } from './zetro.topology'

export function App() {
  return (
    <ZetroSettingsProvider>
      <ZetroApplication />
    </ZetroSettingsProvider>
  )
}

function ZetroApplication() {
  useEffect(() => {
    if (window.location.pathname !== '/zetro' || window.location.hash) {
      window.history.replaceState(null, '', '/zetro')
    }
  }, [])

  return (
    <ProjectProvider>
      <ZetroProjectApplication />
    </ProjectProvider>
  )
}

function ZetroProjectApplication() {
  const { activeProject } = useProjects()
  const isStarting = useInitialLoad()
  const { preferences } = useZetroPreferences()
  return (
    <AgentChatProvider>
      <DeveloperToolsProvider projectId={activeProject?.id ?? null}>
        <SystemTasksProvider projectId={activeProject?.id ?? null}>
          <GitDeliveryProvider projectId={activeProject?.id ?? null}>
            <ProjectTasksProvider>
              <MdiMain
                applicationIcon={Bot}
                applicationId="zetro"
                applicationName="Zetro"
                deskRegionId="15"
                navigation={[]}
                primaryAction={null}
                searchPlaceholder="Search Zetro"
                settingsContent={(props) => <SettingsWorkspace {...props} />}
                showAppearancePanel={false}
                showTopologyTools={preferences.interfaceTopology}
                sidebarContent={
                  <ZetroDeskSidebar>
                    <ZetroProjectSidebar />
                  </ZetroDeskSidebar>
                }
                sidebarFooterClassName="border-t-0 p-3 pt-2"
                statusLabel="Zetro Desk ready"
                statusEnd={
                  <span className="text-gray-600">v{import.meta.env.VITE_ZETRO_BUILD_VERSION}</span>
                }
                topologySections={zetroTopologySections}
                workspaceTitle="Zetro Desk"
              >
                <ZetroDeskWorkspace>
                  <ZetroProjectWorkspace />
                </ZetroDeskWorkspace>
                <GlobalLoader
                  active={isStarting}
                  className="fixed inset-0 z-50 gap-0 [&>span]:sr-only"
                  delayMs={0}
                  label="Loading Zetro"
                  minimumDurationMs={280}
                  overlay
                />
                <OperationsMonitor />
              </MdiMain>
            </ProjectTasksProvider>
          </GitDeliveryProvider>
        </SystemTasksProvider>
      </DeveloperToolsProvider>
    </AgentChatProvider>
  )
}

function useInitialLoad() {
  const [isStarting, setIsStarting] = useState(true)

  useEffect(() => {
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setIsStarting(false))
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [])

  return isStarting
}
