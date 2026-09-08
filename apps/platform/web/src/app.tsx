import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import {
  uiBlockDocs,
  uiComponentDocs,
  uiGalleryTopologySections,
  uiLayoutDocs,
} from '@codexsun/ui/templates/ui-gallery'
import { RouterProvider } from '@tanstack/react-router'
import {
  BookOpenIcon,
  BoxIcon,
  FilePenLineIcon,
  LayoutDashboardIcon,
  PanelsTopLeftIcon,
  SidebarIcon,
  Table2Icon,
} from 'lucide-react'
import { platformRouter } from './app-router'
import { systemTopologySections } from './modules/system/system.topology'

const layoutIcons = {
  'dashboard-01': LayoutDashboardIcon,
  'documentation-sidebar': BookOpenIcon,
  'mdi-main': PanelsTopLeftIcon,
  'sidebar-07': SidebarIcon,
} as const

const blockIcons = {
  form: FilePenLineIcon,
  table: Table2Icon,
} as const

export function App() {
  const isUiWorkspace = window.location.pathname === '/ui'
  const search = new URLSearchParams(window.location.search)
  const selectedLayout = search.get('layout')
  const selectedComponent = search.get('component')
  const selectedBlock = search.get('block') ?? (selectedComponent === 'table' ? 'table' : null)
  const navigation = isUiWorkspace
    ? [
        {
          defaultOpen: true,
          label: 'Layouts',
          items: uiLayoutDocs.map((layout) => ({
            active: selectedLayout === layout.id,
            href: `/ui?layout=${layout.id}`,
            icon: layoutIcons[layout.id],
            label: layout.name,
          })),
        },
        {
          defaultOpen: true,
          label: 'Blocks',
          items: uiBlockDocs.map((block) => ({
            active: selectedBlock === block.id,
            href: `/ui?block=${block.id}`,
            icon: blockIcons[block.id],
            label: block.name,
          })),
        },
        {
          defaultOpen: true,
          label: 'Components',
          items: uiComponentDocs.map((component) => ({
            active: selectedComponent === component.id,
            href: `/ui?component=${component.id}`,
            icon: BoxIcon,
            label: component.name,
          })),
        },
      ]
    : []

  return (
    <MdiMain
      applicationId="platform"
      applicationName="Platform"
      navigation={navigation}
      primaryAction={{
        icon: LayoutDashboardIcon,
        label: 'Overview',
        onSelect: () => window.location.assign('/ui'),
      }}
      searchPlaceholder="Search workspace"
      showMdiOverview={window.location.pathname === '/overview'}
      topologySections={isUiWorkspace ? uiGalleryTopologySections : systemTopologySections}
      workspaceTitle={isUiWorkspace ? 'Overview' : 'System'}
    >
      <RouterProvider router={platformRouter} />
    </MdiMain>
  )
}
