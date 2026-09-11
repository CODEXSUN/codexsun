export type UiLayoutId =
  | 'agent-workspace'
  | 'documentation-workspace'
  | 'mdi-main'
  | 'site-header'
  | 'ecommerce-header'
  | 'blog-header'

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
    id: 'documentation-workspace',
    name: 'Documentation Workspace',
    packageName: '@codexsun/ui/layouts/documentation-workspace',
    summary: 'Documentation shell with searchable navigation and a focused reading canvas.',
    description:
      'Use Documentation Workspace for repository guides, knowledge bases, and manuals. Applications provide document navigation, content, editing, and persistence.',
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
  {
    id: 'site-header',
    name: 'Site Header',
    packageName: '@codexsun/ui/layouts/site-header',
    summary:
      'Separated public website header with announcement bar, navbar, categories, and mobile drawer.',
    description:
      'Use Site Header for public websites, e-commerce storefronts, and static portfolios. It provides decoupled horizontal bands for promos, brand navigation, actions, and categories.',
    code: `import { SiteHeader } from '@codexsun/ui/layouts/site-header'

export function PublicStorefront() {
  return (
    <SiteHeader
      announcement={{
        actionLabel: 'Shop Now',
        actionUrl: '/deals',
        message: 'Mid-Season Flash Sale: Up to 40% off with code CODEX40',
      }}
      brand={{
        badge: 'Store',
        tagline: 'Modern Lifestyle Essentials',
        title: 'CodexShop',
      }}
      links={[
        { href: '#products', label: 'Products', badge: 'New' },
        { href: '#deals', label: 'Deals', badge: 'Sale' },
        { href: '#about', label: 'About Us' },
      ]}
      categories={[
        { active: true, href: '#all', id: 'all', label: 'All Products' },
        { href: '#electronics', id: 'electronics', label: 'Electronics' },
        { href: '#apparel', id: 'apparel', label: 'Apparel' },
      ]}
      actions={{
        cartCount: 3,
        ctaLabel: 'Checkout',
      }}
    />
  )
}`,
  },
  {
    id: 'ecommerce-header',
    name: 'E-Commerce Storefront Header',
    packageName: '@codexsun/ui/layouts/ecommerce-header',
    summary: 'Dedicated multi-tier e-commerce header with search autocomplete, category megamenu, wishlist, and cart drawer triggers.',
    description:
      'Provides top-tier promotion notices, free shipping meters, autocomplete live search with popular searches, category megamenu flyouts, wishlist counters, and live cart drawer badges.',
    code: `import { EcommerceHeader } from '@codexsun/ui/layouts/ecommerce-header'

export function Storefront() {
  return (
    <EcommerceHeader
      brand={{ title: 'CodexMart' }}
      categories={[
        { href: '#tech', id: 'tech', label: 'Audio & Tech', isHot: true },
        { href: '#home', id: 'home', label: 'Home Studio' },
      ]}
      actions={{
        cartCount: 4,
        cartSubtotal: '$149.00',
        wishlistCount: 2,
      }}
    />
  )
}`,
  },
  {
    id: 'blog-header',
    name: 'Editorial Blog Header',
    packageName: '@codexsun/ui/layouts/blog-header',
    summary: 'Publication header with scroll reading progress indicator, topic navigation chips, search, and store return bridge.',
    description:
      'Features a dynamic top reading progress bar, topic tag chips with post counters, search overlay, and a bridge to return to the parent storefront.',
    code: `import { BlogHeader } from '@codexsun/ui/layouts/blog-header'

export function EditorialJournal() {
  return (
    <BlogHeader
      brand={{ title: 'Codex Insights', badge: 'Journal' }}
      topics={[
        { active: true, href: '#tech', id: 'tech', label: 'Engineering', postCount: 12 },
        { href: '#design', id: 'design', label: 'Product Design', postCount: 6 },
      ]}
    />
  )
}`,
  },
]

export function findUiLayout(layoutId: string | null): UiLayoutDoc | undefined {
  return uiLayoutDocs.find(({ id }) => id === layoutId)
}
