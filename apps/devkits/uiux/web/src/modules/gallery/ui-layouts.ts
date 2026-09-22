export type UiLayoutId = "agent-workspace" | "documentation-workspace" | "mdi" | "main-workspace";

export type UiLayoutDoc = {
  code: string;
  description: string;
  id: UiLayoutId;
  name: string;
  packageName: string;
  summary: string;
};

export const uiLayoutDocs: readonly UiLayoutDoc[] = [
  {
    id: "mdi",
    name: "MDI",
    packageName: "@codexsun/ui/layouts/mdi",
    summary: "Plain workspace surface with a centered label.",
    description: "Use MDI for a minimal workspace surface without application shell chrome.",
    code: `import { Mdi } from '@codexsun/ui/layouts/mdi'

export function EmptySurface() {
  return <Mdi label="MDI" />
}`,
  },
  {
    id: "main-workspace",
    name: "Main Workspace",
    packageName: "@codexsun/ui/layouts/main-workspace",
    summary: "Application shell with a command bar, navigation rail, canvas, and status surface.",
    description:
      "Use Main Workspace as the shared application base. Applications provide identity, navigation, workspace content, and feature data through public properties.",
    code: `import { LayoutDashboardIcon, ReceiptTextIcon } from 'lucide-react'
import { MainWorkspace } from '@codexsun/ui/layouts/main-workspace'

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
    <MainWorkspace
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
    </MainWorkspace>
  )
}`,
  },
  {
    id: "documentation-workspace",
    name: "Documentation Workspace",
    packageName: "@codexsun/ui/layouts/documentation-workspace",
    summary: "Documentation shell with searchable navigation and a focused reading canvas.",
    description:
      "Use Documentation Workspace for repository guides, knowledge bases, and manuals. Applications provide document navigation, content, editing, and persistence.",
    code: `import { FileTextIcon, FolderTreeIcon } from 'lucide-react'
import { DocumentationWorkspace } from '@codexsun/ui/layouts/documentation-workspace'

const navigation = [
  {
    defaultOpen: true,
    icon: FolderTreeIcon,
    label: 'Guides',
    items: [
      { active: true, icon: FileTextIcon, label: 'Getting started' },
      { icon: FileTextIcon, label: 'Architecture' },
    ],
  },
]

export function ProductDocs() {
  return (
    <DocumentationWorkspace navigation={navigation}>
      <DocumentationArticle />
    </DocumentationWorkspace>
  )
}`,
  },
  {
    id: "agent-workspace",
    name: "Agent Workspace",
    packageName: "@codexsun/ui/layouts/agent-workspace",
    summary: "Agent canvas with fixed primary and secondary icon activity rails.",
    description:
      "Use Agent Workspace inside Main Workspace when an agent needs persistent tools on both sides of a focused center canvas.",
    code: `import {
  BotIcon,
  BookOpenIcon,
  FolderOpenIcon,
  MessageCircleIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import type { AgentWorkspaceRail } from '@codexsun/ui/layouts/agent-workspace'
import { MainWorkspace } from '@codexsun/ui/layouts/main-workspace'

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
    <MainWorkspace
      agentWorkspace={agentWorkspace}
      applicationId="agent-console"
      applicationName="Agent Console"
      workspaceTitle="Agent workspace"
    >
      <AgentConversation />
    </MainWorkspace>
  )
}`,
  },
];

export function findUiLayout(layoutId: string | null): UiLayoutDoc | undefined {
  return uiLayoutDocs.find(({ id }) => id === layoutId);
}
