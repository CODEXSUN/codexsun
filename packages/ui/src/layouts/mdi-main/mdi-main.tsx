import {
  BookOpenIcon,
  BotIcon,
  BoxesIcon,
  FilesIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
} from 'lucide-react'
import { useState, type CSSProperties } from 'react'

import { SidebarInset, SidebarProvider } from '@codexsun/ui/components/sidebar'
import { cn } from '@codexsun/ui/lib/utils'
import {
  TopologyInspectionControl,
  TopologyInspector,
  TopologyMarker,
  useInterfaceTopology,
} from '../../features/interface-topology'

import { MdiEmptyWorkspace } from './mdi-empty-workspace'
import { MdiFeatureSettings } from './mdi-feature-settings'
import { MdiSidebar } from './mdi-sidebar'
import { MdiStatusBar } from './mdi-status-bar'
import { MdiTopMenu } from './mdi-top-menu'
import { mdiTopologySections, MdiTopologyProvider } from './mdi-topology'
import { MdiTweakPanel, type MdiCanvas, type MdiDensity } from './mdi-tweak-panel'
import type { MdiAppItem, MdiMainProps, MdiNavigationSection, MdiUser } from './mdi-types'
import { useMdiFeatures } from './use-mdi-features'

const defaultNavigation: MdiNavigationSection[] = [
  {
    label: 'Workspace',
    items: [
      { active: true, icon: LayoutDashboardIcon, label: 'Overview' },
      { icon: FilesIcon, label: 'Documents' },
      { icon: MessageSquareIcon, label: 'Messages' },
    ],
  },
]

const defaultApps: MdiAppItem[] = [
  { icon: BoxesIcon, label: 'Platform' },
  { icon: BookOpenIcon, label: 'Docs' },
  { icon: BotIcon, label: 'Zetro' },
]

const defaultUser: MdiUser = {
  initials: 'C',
  name: 'Workspace user',
}

export function MdiMain({
  applicationIcon = BoxesIcon,
  applicationId = 'platform',
  applicationName = 'Workspace',
  apps,
  children,
  defaultFeatures,
  navigation = defaultNavigation,
  notificationCount = 1,
  organizationName = 'CODEXSUN',
  primaryAction = { label: 'New workspace' },
  searchPlaceholder = `Search ${applicationName}`,
  searchValue,
  showAppearancePanel = true,
  sidebarContentClassName,
  statusLabel = 'Ready',
  topologySections = [],
  user = defaultUser,
  workspaceTitle = 'MDI Workspace',
  onSearchChange,
}: MdiMainProps) {
  const [canvas, setCanvas] = useState<MdiCanvas>('plain')
  const [density, setDensity] = useState<MdiDensity>('compact')
  const [features, setFeature] = useMdiFeatures(applicationId, defaultFeatures)
  const [view, setView] = useState<'features' | 'workspace'>('workspace')
  const topology = useInterfaceTopology([...mdiTopologySections, ...topologySections])
  const applicationApps =
    apps ??
    defaultApps.map((app) => ({
      ...app,
      active: app.label.toLowerCase() === applicationName.toLowerCase(),
    }))

  return (
    <MdiTopologyProvider value={topology}>
      <SidebarProvider
        className="h-svh min-h-0 flex-col overflow-hidden bg-background text-foreground"
        style={
          {
            '--sidebar-width': density === 'comfortable' ? '18rem' : '16rem',
          } as CSSProperties
        }
      >
        {features.topMenu ? (
          <MdiTopMenu
            applicationIcon={applicationIcon}
            applicationName={applicationName}
            apps={applicationApps}
            features={features}
            notificationCount={notificationCount}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            user={user}
            onSearchChange={onSearchChange}
          />
        ) : null}

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <MdiSidebar
            applicationName={applicationName}
            navigation={navigation}
            onOpenFeatures={() => setView('features')}
            organizationName={organizationName}
            primaryAction={primaryAction}
            sidebarContentClassName={sidebarContentClassName}
          />
          <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
            <main
              className={cn(
                'relative min-h-0 min-w-0 flex-1 overflow-hidden bg-background data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]',
                canvas === 'grid' &&
                  'bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[20px_20px]',
              )}
              {...topology.regionProps('03')}
            >
              <TopologyMarker id="03" topology={topology} />
              {view === 'features' ? (
                <MdiFeatureSettings
                  features={features}
                  onBack={() => setView('workspace')}
                  onFeatureChange={setFeature}
                />
              ) : children ? (
                <div className="relative size-full min-h-0 min-w-0 overflow-hidden">{children}</div>
              ) : (
                <MdiEmptyWorkspace workspaceTitle={workspaceTitle} />
              )}
            </main>
            {features.statusBar ? (
              <MdiStatusBar statusLabel={statusLabel} workspaceTitle={workspaceTitle} />
            ) : null}
          </SidebarInset>
        </div>

        {showAppearancePanel ? (
          <MdiTweakPanel
            canvas={canvas}
            density={density}
            onCanvasChange={setCanvas}
            onDensityChange={setDensity}
            onOpenFeatures={() => setView('features')}
          />
        ) : null}
        <TopologyInspector topology={topology} />
        <TopologyInspectionControl topology={topology} />
      </SidebarProvider>
    </MdiTopologyProvider>
  )
}

export type { MdiMainProps }
