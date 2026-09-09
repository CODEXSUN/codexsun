import {
  ChevronRight,
  EllipsisVertical,
  FolderKanban,
  ListTodo,
  LoaderCircle,
  MessageSquare,
  Workflow,
} from 'lucide-react'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codexsun/ui/components/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import { Button } from '@codexsun/ui/components/button'
import {
  AgentChatHistory,
  AgentChatWorkspace,
  CodexModelSelector,
  useAgentChat,
} from '../agent-chat'
import { ProjectTaskList, ProjectTasksWorkspace, useProjectTasks } from '../project-tasks'
import { ProjectLogo, ProjectSwitcher, useProjects, type ZetroProject } from '../projects'
import { useCodexConnection } from '../settings'
import { DeveloperToolsPanel } from '../developer-tools'
import { GitDeliveryFlowBuilder } from '../git-delivery'
import { SystemTasksPanel, useSystemTasks } from '../system-tasks'
import { AutomationSidebar, AutomationWorkspace } from '../automation'

export function ZetroProjectSidebar() {
  const chat = useAgentChat()
  const projects = useProjects()
  const tasks = useProjectTasks()
  const automation = useSystemTasks()
  const topology = useMdiTopology()
  const openTaskCount = tasks.tasks.filter(({ status }) => status !== 'done').length

  function showChat() {
    projects.setView('chat')
    chat.showChat()
  }

  return (
    <div className="flex size-full min-h-0 flex-col">
      <TopologyRegion as="div" className="border-b p-2" id="15.2.4" topology={topology}>
        {projects.isLoading ? (
          <div className="flex h-12 items-center gap-2 px-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading projects
          </div>
        ) : (
          <ProjectSwitcher disabled={chat.isBusy} />
        )}
      </TopologyRegion>
      <TopologyRegion as="div" id="15.2.5" topology={topology}>
        <SidebarGroup className="border-b p-1.5">
          <SidebarGroupContent>
            <SidebarMenu aria-label="Project features" className="grid grid-cols-3 gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-label="Chat"
                  className="h-9 cursor-pointer justify-center pr-7"
                  isActive={projects.view === 'chat'}
                  onClick={showChat}
                  title="Chat"
                >
                  <MessageSquare />
                  <span className="sr-only">Chat</span>
                  <SidebarMenuBadge>{chat.summaries.length}</SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-label="Tasks"
                  className="h-9 cursor-pointer justify-center pr-7"
                  isActive={projects.view === 'tasks'}
                  onClick={() => projects.setView('tasks')}
                  title="Tasks"
                >
                  <ListTodo />
                  <span className="sr-only">Tasks</span>
                  <SidebarMenuBadge>{openTaskCount}</SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-label="Automation"
                  className="h-9 cursor-pointer justify-center pr-7"
                  isActive={projects.view === 'automation'}
                  onClick={() => projects.setView('automation')}
                  title="Automation"
                >
                  <Workflow />
                  <span className="sr-only">Automation</span>
                  <SidebarMenuBadge>
                    {
                      automation.tasks.filter(({ status }) =>
                        ['blocked', 'failed', 'pending', 'running'].includes(status),
                      ).length
                    }
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </TopologyRegion>
      <div className="min-h-0 flex-1">
        {projects.view === 'chat' ? (
          <AgentChatHistory />
        ) : projects.view === 'tasks' ? (
          <ProjectTaskList />
        ) : (
          <AutomationSidebar />
        )}
      </div>
    </div>
  )
}

export function ZetroProjectWorkspace() {
  const { activeProject, error, isLoading, view } = useProjects()
  const chat = useAgentChat()
  const tasks = useProjectTasks()
  const { connection, isLoading: isLoadingConnection } = useCodexConnection()
  if (isLoading) {
    return (
      <div className="grid size-full place-items-center">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!activeProject) {
    return (
      <div className="grid size-full place-items-center px-6 text-sm text-destructive">
        {error ?? 'Connect a Git repository from the project switcher.'}
      </div>
    )
  }
  return (
    <div className="flex size-full min-h-0 flex-col">
      <WorkspaceContextBar
        connectionState={isLoadingConnection ? 'checking' : (connection?.state ?? 'disconnected')}
        modelSelectionDisabled={chat.isBusy}
        project={activeProject}
        title={
          view === 'automation'
            ? 'Automation'
            : view === 'tasks' && tasks.view === 'archive'
              ? 'Archived tasks'
              : view === 'tasks'
                ? 'Tasks'
                : 'Chat'
        }
        onOpenScope={view === 'chat' ? () => void chat.openScope() : undefined}
      />
      <div className="min-h-0 flex-1">
        {view === 'automation' ? (
          <AutomationWorkspace />
        ) : view === 'tasks' ? (
          <ProjectTasksWorkspace />
        ) : (
          <AgentChatWorkspace />
        )}
      </div>
      <DeveloperToolsPanel
        topContent={
          <>
            <GitDeliveryFlowBuilder />
            <SystemTasksPanel />
          </>
        }
      />
    </div>
  )
}

function WorkspaceContextBar({
  connectionState,
  modelSelectionDisabled,
  project,
  title,
  onOpenScope,
}: {
  connectionState: 'checking' | 'connected' | 'disconnected' | 'error' | 'pending'
  modelSelectionDisabled: boolean
  project: ZetroProject
  title: string
  onOpenScope?: () => void
}) {
  const connected = connectionState === 'connected'

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b px-4 text-sm">
      <ProjectLogo className="size-5 rounded text-[9px]" project={project} />
      <span className="max-w-48 truncate text-muted-foreground">{project.name}</span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="font-medium">{title}</span>
      <div className="ml-auto flex min-w-0 items-center gap-1 text-xs">
        <span
          aria-label={connected ? 'Connected' : connectionState}
          className={
            connected ? 'size-2 rounded-full bg-emerald-500' : 'size-2 rounded-full bg-amber-500'
          }
        />
        <CodexModelSelector disabled={modelSelectionDisabled} />
        {onOpenScope ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="Chat actions"
                  className="cursor-pointer"
                  size="icon-xs"
                  variant="ghost"
                />
              }
            >
              <EllipsisVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenScope}>
                <FolderKanban /> Connected folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}
