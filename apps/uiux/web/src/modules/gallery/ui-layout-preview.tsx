import {
  BotIcon,
  BookOpenIcon,
  BlocksIcon,
  BoxIcon,
  ComponentIcon,
  FilePenLineIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MessageCircleIcon,
  PanelsTopLeftIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  Table2Icon,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Textarea } from '@codexsun/ui/components/textarea'
import type { AgentWorkspaceRail } from '@codexsun/ui/layouts/agent-workspace'
import { DocumentationWorkspace } from '@codexsun/ui/layouts/documentation-workspace'
import { MdiMain, type MdiNavigationSection } from '@codexsun/ui/layouts/mdi-main'
import { uiBlockDocs } from './ui-blocks'
import { uiComponentDocs } from './ui-components'
import type { UiLayoutId } from './ui-layouts'

const blockIcons = {
  'execution-status': BotIcon,
  form: FilePenLineIcon,
  table: Table2Icon,
} as const

const previewNavigation: MdiNavigationSection[] = [
  {
    defaultOpen: true,
    icon: LayoutTemplateIcon,
    label: 'Layouts',
    items: [
      { icon: PanelsTopLeftIcon, label: 'MDI Main' },
      { icon: BookOpenIcon, label: 'Documentation Workspace' },
      { icon: BotIcon, label: 'Agent Workspace' },
    ],
  },
  {
    defaultOpen: true,
    icon: BlocksIcon,
    label: 'Blocks',
    items: uiBlockDocs.map((block) => ({
      icon: blockIcons[block.id],
      label: block.name,
    })),
  },
  {
    icon: ComponentIcon,
    label: 'Components',
    items: uiComponentDocs.map((component) => ({
      icon: BoxIcon,
      label: component.name,
    })),
  },
]

const previewNotifications = [
  {
    description: 'The shared Table block passed its latest review.',
    id: 'table-review',
    time: '12 minutes ago',
    title: 'Component review complete',
  },
  {
    description: 'A new Form block example is ready to inspect.',
    id: 'form-example',
    time: 'Today',
    title: 'Documentation updated',
  },
]

export function UiLayoutPreview({ layoutId }: { layoutId: UiLayoutId }) {
  if (layoutId === 'agent-workspace') return <AgentWorkspaceLayoutPreview />
  if (layoutId === 'documentation-workspace') return <DocumentationWorkspaceLayoutPreview />

  return (
    <div className="h-[clamp(34rem,62vw,52rem)] min-w-0 overflow-hidden rounded-lg border bg-background shadow-xs">
      <MdiMain
        applicationId="ui-preview"
        applicationName="UI"
        embedded
        navigation={previewNavigation}
        notificationCount={previewNotifications.length}
        notifications={previewNotifications}
        primaryAction={{ icon: LayoutDashboardIcon, label: 'Overview' }}
        searchPlaceholder="Search UI documentation"
        showAppearancePanel={false}
        showTopologyTools={false}
        statusLabel="Ready"
        user={{ initials: 'U', name: 'UI workspace user' }}
        workspaceTitle="Overview"
      >
        <div aria-label="Empty workspace canvas" className="size-full bg-background" />
      </MdiMain>
    </div>
  )
}

const documentationNavigation: MdiNavigationSection[] = [
  {
    defaultOpen: true,
    icon: BookOpenIcon,
    label: 'Guides',
    items: [
      { active: true, icon: FilePenLineIcon, label: 'Getting started' },
      { icon: FilePenLineIcon, label: 'Application structure' },
      { icon: FilePenLineIcon, label: 'Shared UI ownership' },
    ],
  },
]

function DocumentationWorkspaceLayoutPreview() {
  return (
    <div className="h-[clamp(34rem,62vw,52rem)] min-w-0 overflow-hidden rounded-lg border bg-background shadow-xs">
      <DocumentationWorkspace
        embedded
        applicationId="docs-preview"
        navigation={documentationNavigation}
        searchPlaceholder="Search guides and architecture"
        showAppearancePanel={false}
        showTopologyTools={false}
        user={{ initials: 'D', name: 'Documentation editor' }}
      >
        <article className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 overflow-y-auto px-8 py-12">
          <div className="flex flex-col gap-2 border-b pb-6">
            <Badge className="w-fit" variant="outline">
              Getting started
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Build from shared foundations</h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Keep reusable UI in the shared package and keep documentation content, routes, and
              persistence in the application that owns them.
            </p>
          </div>
          <div className="grid gap-6 text-sm leading-7">
            <section className="grid gap-2">
              <h3 className="text-lg font-semibold">Choose the public contract</h3>
              <p className="text-muted-foreground">
                Import components, blocks, and layouts from documented package entry points.
              </p>
            </section>
            <section className="grid gap-2">
              <h3 className="text-lg font-semibold">Keep product behavior local</h3>
              <p className="text-muted-foreground">
                The Docs application continues to own discovery, editing, navigation state, and
                repository-backed content.
              </p>
            </section>
          </div>
        </article>
      </DocumentationWorkspace>
    </div>
  )
}

const primaryAgentItems = [
  { icon: MessageCircleIcon, id: 'conversation', label: 'Conversation' },
  { icon: BotIcon, id: 'agents', label: 'Agents' },
  { icon: FolderOpenIcon, id: 'files', label: 'Files' },
] as const

const secondaryAgentItems = [
  { icon: BookOpenIcon, id: 'context', label: 'Context' },
  { icon: SlidersHorizontalIcon, id: 'controls', label: 'Run controls' },
] as const

function AgentWorkspaceLayoutPreview() {
  const [activeTool, setActiveTool] = useState('conversation')
  const primaryRail: AgentWorkspaceRail = {
    label: 'Agent activities',
    items: primaryAgentItems.map((item) => ({
      ...item,
      active: activeTool === item.id,
      onSelect: () => setActiveTool(item.id),
    })),
    footerItems: [
      {
        active: activeTool === 'settings',
        icon: Settings2Icon,
        id: 'settings',
        label: 'Agent settings',
        onSelect: () => setActiveTool('settings'),
      },
    ],
  }
  const secondaryRail: AgentWorkspaceRail = {
    label: 'Workspace utilities',
    items: secondaryAgentItems.map((item) => ({
      ...item,
      active: activeTool === item.id,
      onSelect: () => setActiveTool(item.id),
    })),
  }

  return (
    <div className="h-[clamp(34rem,62vw,52rem)] min-w-0 overflow-hidden rounded-lg border bg-background shadow-xs">
      <MdiMain
        agentWorkspace={{ primaryRail, secondaryRail }}
        applicationId="agent-workspace-preview"
        applicationName="Agent Workspace"
        embedded
        navigation={previewNavigation}
        notificationCount={previewNotifications.length}
        notifications={previewNotifications}
        primaryAction={{ icon: LayoutDashboardIcon, label: 'Overview' }}
        searchPlaceholder="Search agent workspace"
        showAppearancePanel={false}
        showTopologyTools={false}
        statusLabel="Connected"
        user={{ initials: 'A', name: 'Agent workspace user' }}
        workspaceTitle="Agent workspace"
      >
        <AgentCanvas activeTool={activeTool} />
      </MdiMain>
    </div>
  )
}

function AgentCanvas({ activeTool }: { activeTool: string }) {
  const activeLabel = [...primaryAgentItems, ...secondaryAgentItems].find(
    (item) => item.id === activeTool,
  )?.label

  return (
    <div className="flex size-full min-h-0 flex-col bg-background">
      <header className="flex min-h-14 items-center justify-between gap-4 border-b px-5">
        <div className="min-w-0">
          <p className="truncate font-semibold">Build assistant</p>
          <p className="truncate text-sm text-muted-foreground">
            {activeLabel ?? 'Agent settings'}
          </p>
        </div>
        <Badge variant="outline">Ready</Badge>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-8">
        <div className="grid max-w-lg gap-3 text-center">
          <BotIcon className="mx-auto size-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">What should the agent work on?</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Select an activity from either fixed rail. The application supplies each icon, label,
            state, and action.
          </p>
        </div>
      </div>
      <footer className="border-t p-4">
        <div className="grid gap-3 rounded-xl border bg-card p-3">
          <Textarea
            aria-label="Agent request"
            className="min-h-20 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            placeholder="Describe the work for this agent"
          />
          <div className="flex justify-end">
            <Button>Send request</Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
