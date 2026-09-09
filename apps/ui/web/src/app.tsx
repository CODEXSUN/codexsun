import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import {
  BellIcon,
  BlocksIcon,
  BotIcon,
  BookOpenIcon,
  BoxIcon,
  ComponentIcon,
  FilePenLineIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  PanelsTopLeftIcon,
  Table2Icon,
} from 'lucide-react'
import {
  uiBlockDocs,
  uiComponentDocs,
  uiGalleryTopologySections,
  uiLayoutDocs,
  uiPageDocs,
  UiGalleryContainer,
} from './modules/gallery'

const layoutIcons = {
  'agent-workspace': BotIcon,
  'documentation-workspace': BookOpenIcon,
  'mdi-main': PanelsTopLeftIcon,
} as const
const blockIcons = { form: FilePenLineIcon, table: Table2Icon } as const

export function App() {
  const search = new URLSearchParams(window.location.search)
  const selectedLayout = search.get('layout')
  const selectedPage = search.get('page')
  const selectedComponent = search.get('component')
  const selectedBlock = search.get('block') ?? (selectedComponent === 'table' ? 'table' : null)

  const navigation = [
    {
      icon: LayoutTemplateIcon,
      label: 'Layouts',
      items: uiLayoutDocs.map((layout) => ({
        active: selectedLayout === layout.id,
        href: `/?layout=${layout.id}`,
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
              href: `/?page=${page.id}`,
              label: page.name,
            })),
          defaultOpen: selectedPage !== null && selectedPage !== 'notifications',
          icon: FingerprintIcon,
          label: 'Authentication',
        },
        {
          active: selectedPage === 'notifications',
          href: '/?page=notifications',
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
        href: `/?block=${block.id}`,
        icon: blockIcons[block.id],
        label: block.name,
      })),
    },
    {
      icon: ComponentIcon,
      label: 'Components',
      items: uiComponentDocs.map((component) => ({
        active: selectedComponent === component.id,
        href: `/?component=${component.id}`,
        icon: BoxIcon,
        label: component.name,
      })),
    },
  ]

  return (
    <MdiMain
      applicationId="ui"
      applicationName="UI"
      navigation={navigation}
      primaryAction={{
        icon: LayoutDashboardIcon,
        label: 'Overview',
        onSelect: () => window.location.assign('/'),
      }}
      searchPlaceholder="Search UI"
      sidebarStateKey="codexsun.ui.sidebar"
      topologySections={uiGalleryTopologySections}
      workspaceTitle="Overview"
    >
      <UiGalleryContainer />
    </MdiMain>
  )
}
