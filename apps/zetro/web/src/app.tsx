import { Suspense, useEffect, useState } from 'react'
import { GlobalLoader } from '@codexsun/ui/blocks/loader'
import type { AgentWorkspaceRail } from '@codexsun/ui/layouts/agent-workspace'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Bot, FolderKanban, GitBranch, ListTodo, MessageSquare, Workflow } from 'lucide-react'
import { AgentChatProvider, useAgentChat } from './modules/agent-chat'
import { DeveloperToolsProvider, useDeveloperTools } from './modules/developer-tools'
import { GitDeliveryProvider } from './modules/git-delivery'
import { ProjectTasksProvider, useProjectTasks } from './modules/project-tasks'
import { ProjectProvider, useProjects } from './modules/projects'
import {
  ZetroDeskSidebar,
  ZetroDeskWorkspace,
  ZetroProjectSidebar,
  ZetroProjectWorkspace,
} from './modules/desk'
import {
  SettingsStartup,
  SettingsWorkspace,
  ZetroSettingsProvider,
  useZetroPreferences,
} from './modules/settings'
import { SystemTasksProvider, useSystemTasks } from './modules/system-tasks'
import { OperationsMonitor } from './modules/operations'
import { zetroTopologySections } from './zetro.topology'

export function App() {
  return (
    <ZetroSettingsProvider>
      <Suspense
        fallback={<GlobalLoader active label="Loading Zetro startup checks" delayMs={0} overlay />}
      >
        <SettingsStartup>
          <ZetroApplication />
        </SettingsStartup>
      </Suspense>
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
  return (
    <AgentChatProvider>
      <DeveloperToolsProvider projectId={activeProject?.id ?? null}>
        <SystemTasksProvider projectId={activeProject?.id ?? null}>
          <GitDeliveryProvider projectId={activeProject?.id ?? null}>
            <ProjectTasksProvider>
              <ZetroDeskApplication />
            </ProjectTasksProvider>
          </GitDeliveryProvider>
        </SystemTasksProvider>
      </DeveloperToolsProvider>
    </AgentChatProvider>
  )
}

function ZetroDeskApplication() {
  const chat = useAgentChat()
  const projects = useProjects()
  const tasks = useProjectTasks()
  const systemTasks = useSystemTasks()
  const tools = useDeveloperTools()
  const { preferences } = useZetroPreferences()
  const [repositoryToolsOpen, setRepositoryToolsOpen] = useState(false)
  const openTaskCount = tasks.tasks.filter(({ status }) => status !== 'done').length
  const activeRunCount = systemTasks.tasks.filter(({ status }) =>
    ['blocked', 'failed', 'pending', 'running'].includes(status),
  ).length

  function showChat() {
    projects.setView('chat')
    chat.showChat()
  }

  const primaryRail: AgentWorkspaceRail = {
    label: 'Zetro activities',
    items: [
      {
        active: projects.view === 'chat',
        badge: chat.summaries.length,
        icon: MessageSquare,
        id: 'chat',
        label: 'Chat',
        onSelect: showChat,
      },
      {
        active: projects.view === 'tasks',
        badge: openTaskCount,
        icon: ListTodo,
        id: 'tasks',
        label: 'Tasks',
        onSelect: () => projects.setView('tasks'),
      },
      {
        active: projects.view === 'automation',
        badge: activeRunCount,
        icon: Workflow,
        id: 'automation',
        label: 'Automation',
        onSelect: () => projects.setView('automation'),
      },
    ],
  }
  const secondaryRail: AgentWorkspaceRail = {
    label: 'Zetro utilities',
    items: [
      {
        active: chat.scopeOpen,
        disabled: !projects.activeProject || chat.isBusy,
        icon: FolderKanban,
        id: 'connected-folder',
        label: 'Connected folder',
        onSelect: () => {
          showChat()
          void chat.openScope()
        },
      },
      {
        active: repositoryToolsOpen,
        badge: tools.status?.files || undefined,
        disabled: !tools.project,
        icon: GitBranch,
        id: 'repository-tools',
        label: 'Repository tools',
        onSelect: () => setRepositoryToolsOpen((current) => !current),
      },
    ],
  }

  return (
    <MdiMain
      agentWorkspace={{ primaryRail, secondaryRail }}
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
      statusEnd={<span className="text-gray-600">v{import.meta.env.VITE_ZETRO_BUILD_VERSION}</span>}
      topologySections={zetroTopologySections}
      workspaceTitle="Zetro Desk"
    >
      <ZetroDeskWorkspace>
        <ZetroProjectWorkspace
          repositoryToolsOpen={repositoryToolsOpen}
          onRepositoryToolsOpenChange={setRepositoryToolsOpen}
        />
      </ZetroDeskWorkspace>
      <OperationsMonitor />
    </MdiMain>
  )
}
