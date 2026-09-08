export type UiLayoutId = 'dashboard-01' | 'documentation-sidebar' | 'mdi-main' | 'sidebar-07'

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
    code: `import { MdiMain } from '@codexsun/ui/layouts/mdi-main'

export function ApplicationShell() {
  return (
    <MdiMain
      applicationId="accounts"
      applicationName="Accounts"
      navigation={navigation}
      workspaceTitle="Overview"
    >
      <AccountsOverview />
    </MdiMain>
  )
}`,
  },
  {
    id: 'dashboard-01',
    name: 'Dashboard 01',
    packageName: '@codexsun/ui/templates/dashboard-01',
    summary: 'Responsive dashboard composition with metrics, a chart, and a data table.',
    description:
      'Use Dashboard 01 when a workspace needs a compact operational summary. Replace its sample records with application-owned data.',
    code: `import {
  ChartAreaInteractive,
  DataTable,
  SectionCards,
  dashboardData,
} from '@codexsun/ui/templates/dashboard-01'

export function OperationsDashboard() {
  return (
    <div className="grid gap-6 p-6">
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={dashboardData} />
    </div>
  )
}`,
  },
  {
    id: 'sidebar-07',
    name: 'Sidebar 07',
    packageName: '@codexsun/ui/templates/sidebar-07',
    summary: 'Workspace navigation with nested teams, projects, and utility actions.',
    description:
      'Use Sidebar 07 for an application with deep navigation. Keep business routes and labels in the consuming application.',
    code: `import { SidebarProvider } from '@codexsun/ui/components/sidebar'
import { AppSidebar } from '@codexsun/ui/templates/sidebar-07'

export function ProjectWorkspace() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="min-w-0 flex-1">Project content</main>
    </SidebarProvider>
  )
}`,
  },
  {
    id: 'documentation-sidebar',
    name: 'Documentation sidebar',
    packageName: '@codexsun/ui/templates/documentation-sidebar',
    summary: 'Documentation navigation for grouped guides and active-page context.',
    description:
      'Use the documentation sidebar for a reader workspace. Supply grouped navigation from the documentation owner.',
    code: `import { SidebarProvider } from '@codexsun/ui/components/sidebar'
import { AppSidebar } from '@codexsun/ui/templates/documentation-sidebar'

export function DocumentationWorkspace() {
  return (
    <SidebarProvider>
      <AppSidebar navigation={navigation} />
      <article className="min-w-0 flex-1">Documentation content</article>
    </SidebarProvider>
  )
}`,
  },
]

export function findUiLayout(layoutId: string | null): UiLayoutDoc | undefined {
  return uiLayoutDocs.find(({ id }) => id === layoutId)
}
