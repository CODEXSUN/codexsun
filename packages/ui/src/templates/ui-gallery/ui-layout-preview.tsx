import {
  BlocksIcon,
  BoxIcon,
  ComponentIcon,
  FilePenLineIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  PanelsTopLeftIcon,
  Table2Icon,
} from 'lucide-react'

import { MdiMain, type MdiNavigationSection } from '../../layouts/mdi-main'
import { uiBlockDocs } from './ui-blocks'
import { uiComponentDocs } from './ui-components'
import type { UiLayoutId } from './ui-layouts'

const blockIcons = {
  form: FilePenLineIcon,
  table: Table2Icon,
} as const

const previewNavigation: MdiNavigationSection[] = [
  {
    defaultOpen: true,
    icon: LayoutTemplateIcon,
    label: 'Layouts',
    items: [{ icon: PanelsTopLeftIcon, label: 'MDI Main' }],
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
  if (layoutId !== 'mdi-main') return null

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
