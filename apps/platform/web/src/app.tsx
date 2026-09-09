import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import {
  uiBlockDocs,
  uiComponentDocs,
  uiGalleryTopologySections,
  uiLayoutDocs,
  uiPageDocs,
} from '@codexsun/ui/templates/ui-gallery/catalog'
import { RouterProvider } from '@tanstack/react-router'
import {
  BoxIcon,
  BotIcon,
  BellIcon,
  BlocksIcon,
  ComponentIcon,
  FilePenLineIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  PanelsTopLeftIcon,
  Table2Icon,
} from 'lucide-react'
import { platformRouter } from './app-router'
import { systemTopologySections } from './modules/system/system.topology'

const layoutIcons = {
  'agent-workspace': BotIcon,
  'mdi-main': PanelsTopLeftIcon,
} as const

const blockIcons = {
  form: FilePenLineIcon,
  table: Table2Icon,
} as const

export function App() {
  const isAuthPage = /\/(?:login|register|password\/forgot)$/u.test(window.location.pathname)
  if (isAuthPage) return <RouterProvider router={platformRouter} />

  const isUiWorkspace = window.location.pathname === '/ui'
  const portalIdentity = resolvePortalIdentity(window.location.pathname)
  const search = new URLSearchParams(window.location.search)
  const selectedLayout = search.get('layout')
  const selectedPage = search.get('page')
  const selectedComponent = search.get('component')
  const selectedBlock = search.get('block') ?? (selectedComponent === 'table' ? 'table' : null)
  const navigation = isUiWorkspace
    ? [
        {
          icon: LayoutTemplateIcon,
          label: 'Layouts',
          items: uiLayoutDocs.map((layout) => ({
            active: selectedLayout === layout.id,
            href: `/ui?layout=${layout.id}`,
            icon: layoutIcons[layout.id],
            label: layout.name,
          })),
        },
        {
          items: [
            {
              active: selectedPage !== null && selectedPage !== 'notifications',
              children: uiPageDocs
                .filter(({ id }) => id !== 'notifications')
                .map((page) => ({
                  active: selectedPage === page.id,
                  href: `/ui?page=${page.id}`,
                  label: page.name,
                })),
              defaultOpen: selectedPage !== null && selectedPage !== 'notifications',
              icon: FingerprintIcon,
              label: 'Authentication',
            },
            {
              active: selectedPage === 'notifications',
              href: '/ui?page=notifications',
              icon: BellIcon,
              label: 'Notifications Page',
            },
          ],
        },
        {
          icon: BlocksIcon,
          label: 'Blocks',
          items: uiBlockDocs.map((block) => ({
            active: selectedBlock === block.id,
            href: `/ui?block=${block.id}`,
            icon: blockIcons[block.id],
            label: block.name,
          })),
        },
        {
          icon: ComponentIcon,
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
      applicationId={portalIdentity.id}
      applicationName={isUiWorkspace ? 'UI' : portalIdentity.name}
      navigation={navigation}
      primaryAction={{
        icon: LayoutDashboardIcon,
        label: 'Overview',
        onSelect: () => window.location.assign('/ui'),
      }}
      searchPlaceholder="Search workspace"
      sidebarStateKey={isUiWorkspace ? 'codexsun.platform.ui.sidebar' : undefined}
      showMdiOverview={window.location.pathname === '/overview'}
      topologySections={isUiWorkspace ? uiGalleryTopologySections : systemTopologySections}
      workspaceTitle={isUiWorkspace ? 'Overview' : 'System'}
    >
      <RouterProvider router={platformRouter} />
    </MdiMain>
  )
}

function resolvePortalIdentity(path: string) {
  if (path === '/sa' || path.startsWith('/sa/')) return { id: 'platform-sa', name: 'Super Admin' }
  if (path === '/admin' || path.startsWith('/admin/'))
    return { id: 'platform-admin', name: 'Admin' }
  return { id: 'platform', name: 'Platform' }
}
