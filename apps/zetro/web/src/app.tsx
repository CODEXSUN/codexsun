import { useEffect, useState } from 'react'
import { GlobalLoader } from '@codexsun/ui/blocks/loader'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Bot } from 'lucide-react'
import { AgentChatProvider } from './modules/agent-chat'
import { ProjectTasksProvider } from './modules/project-tasks'
import { ProjectProvider } from './modules/projects'
import {
  ZetroDeskSidebar,
  ZetroDeskWorkspace,
  ZetroProjectSidebar,
  ZetroProjectWorkspace,
} from './modules/desk'
import { zetroTopologySections } from './zetro.topology'

export function App() {
  const isStarting = useInitialLoad()

  useEffect(() => {
    if (window.location.pathname !== '/zetro' || window.location.hash) {
      window.history.replaceState(null, '', '/zetro')
    }
  }, [])

  return (
    <ProjectProvider>
      <AgentChatProvider>
        <ProjectTasksProvider>
          <MdiMain
            applicationIcon={Bot}
            applicationId="zetro"
            applicationName="Zetro"
            deskRegionId="15"
            navigation={[]}
            primaryAction={null}
            searchPlaceholder="Search Zetro"
            showAppearancePanel={false}
            sidebarContent={
              <ZetroDeskSidebar>
                <ZetroProjectSidebar />
              </ZetroDeskSidebar>
            }
            sidebarFooter={null}
            statusLabel="Zetro Desk ready"
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
          </MdiMain>
        </ProjectTasksProvider>
      </AgentChatProvider>
    </ProjectProvider>
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
