export type UiLayoutId = 'agent-workspace' | 'mdi-main'

export type UiLayoutDoc = {
  code: string
  description: string
  id: UiLayoutId
  name: string
  packageName: string
  summary: string
}

export const uiLayoutDocs: readonly UiLayoutDoc[] = [
  {
    id: 'mdi-main',
    name: 'MDI Main',
    packageName: '@codexsun/ui/layouts/mdi-main',
    summary: 'Application shell with a command bar, navigation rail, canvas, and status surface.',
    description:
      'Use MDI Main as the shared application base. Applications provide identity, navigation, workspace content, and feature data through public properties.',
    code: `import { LayoutDashboardIcon, ReceiptTextIcon } from 'lucide-react'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'

const navigation = [
  {
    defaultOpen: true,
    label: 'Billing',
    items: [
      { active: true, icon: ReceiptTextIcon, label: 'Invoices' },
      { icon: ReceiptTextIcon, label: 'Payments' },
    ],
  },
]

export function ApplicationShell() {
  return (
    <MdiMain
      applicationId="accounts"
      applicationName="Accounts"
      navigation={navigation}
      notificationCount={2}
      primaryAction={{ icon: LayoutDashboardIcon, label: 'Overview' }}
      searchPlaceholder="Search accounts"
      statusLabel="Ready"
      workspaceTitle="Overview"
    >
      <AccountsOverview />
    </MdiMain>
  )
}`,
  },
  {
    id: 'agent-workspace',
    name: 'Agent Workspace',
    packageName: '@codexsun/ui/layouts/agent-workspace',
    summary: 'Agent canvas with fixed primary and secondary icon activity rails.',
    description:
      'Use Agent Workspace inside MDI Main when an agent needs persistent tools on both sides of a focused center canvas.',
    code: `import {
  BotIcon,
  BookOpenIcon,
  FolderOpenIcon,
  MessageCircleIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import type { AgentWorkspaceRail } from '@codexsun/ui/layouts/agent-workspace'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'

const primaryRail: AgentWorkspaceRail = {
  label: 'Agent activities',
  items: [
    { active: true, icon: MessageCircleIcon, id: 'conversation', label: 'Conversation' },
    { icon: BotIcon, id: 'agents', label: 'Agents' },
    { icon: FolderOpenIcon, id: 'files', label: 'Files' },
  ],
  footerItems: [{ icon: SettingsIcon, id: 'settings', label: 'Agent settings' }],
}

const secondaryRail: AgentWorkspaceRail = {
  label: 'Workspace utilities',
  items: [
    { icon: BookOpenIcon, id: 'context', label: 'Context' },
    { icon: SlidersHorizontalIcon, id: 'controls', label: 'Run controls' },
  ],
}

const agentWorkspace = { primaryRail, secondaryRail }

export function AgentApplication() {
  return (
    <MdiMain
      agentWorkspace={agentWorkspace}
      applicationId="agent-console"
      applicationName="Agent Console"
      workspaceTitle="Agent workspace"
    >
      <AgentConversation />
    </MdiMain>
  )
}`,
  },
]

export function findUiLayout(layoutId: string | null): UiLayoutDoc | undefined {
  return uiLayoutDocs.find(({ id }) => id === layoutId)
}
