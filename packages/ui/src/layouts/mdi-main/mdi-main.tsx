import { BoxesIcon, FilesIcon, LayoutDashboardIcon, MessageSquareIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'

import { SidebarInset, SidebarProvider } from '@codexsun/ui/components/sidebar'
import { cn } from '@codexsun/ui/lib/utils'
import {
  TopologyInspectionControl,
  TopologyInspector,
  TopologyMarker,
  useInterfaceTopology,
} from '../../features/interface-topology'
import { ThemeProvider } from '../../theme'

import { MdiEmptyWorkspace } from './mdi-empty-workspace'
import { createDefaultMdiApps } from './mdi-app-catalog'
import { MdiFeatureSettings } from './mdi-feature-settings'
import { MdiSidebar } from './mdi-sidebar'
import { MdiStatusBar } from './mdi-status-bar'
import { MdiTopMenu } from './mdi-top-menu'
import { mdiTopologySections, MdiTopologyProvider } from './mdi-topology'
import { MdiTweakPanel, type MdiCanvas, type MdiDensity } from './mdi-tweak-panel'
import type { MdiMainProps, MdiNavigationSection, MdiUser } from './mdi-types'
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

const defaultUser: MdiUser = {
  initials: 'C',
  name: 'Workspace user',
}

export function MdiMain({
  applicationIcon = BoxesIcon,
  applicationLogoUrl,
  applicationId = 'platform',
  applicationName = 'Workspace',
  apps,
  children,
  defaultFeatures,
  deskRegionId,
  embedded = false,
  navigation = defaultNavigation,
  notificationCount = 1,
  notifications = [],
  primaryAction = { label: 'New workspace' },
  searchPlaceholder = `Search ${applicationName}`,
  searchValue,
  settingsContent,
  showAppearancePanel = true,
  showMdiOverview = false,
  showTopologyTools = true,
  sidebarContent,
  sidebarContentClassName,
  sidebarFooter,
  sidebarFooterClassName,
  sidebarStateKey,
  statusLabel = 'Ready',
  statusEnd,
  topologySections = [],
  user = defaultUser,
  workspaceTitle = 'MDI Workspace',
  onSearchChange,
}: MdiMainProps) {
  useEffect(() => {
    if (!embedded) document.title = applicationName
  }, [applicationName, embedded])

  const [canvas, setCanvas] = useState<MdiCanvas>('plain')
  const [density, setDensity] = useState<MdiDensity>('compact')
  const [features, setFeature] = useMdiFeatures(applicationId, defaultFeatures)
  const [view, setView] = useState<'settings' | 'workspace'>('workspace')
  const topologyDesks = useMemo(
    () => [
      ...(showMdiOverview
        ? [{ id: 'mdi-overview', name: 'MDI Overview', sections: mdiTopologySections }]
        : []),
      ...(topologySections.length
        ? [{ id: `${applicationId}-desk`, name: workspaceTitle, sections: topologySections }]
        : []),
    ],
    [applicationId, showMdiOverview, topologySections, workspaceTitle],
  )
  const topology = useInterfaceTopology(topologyDesks)
  const applicationApps = apps ?? createDefaultMdiApps(applicationId)

  return (
    <ThemeProvider>
      <MdiTopologyProvider value={topology}>
        <SidebarProvider
          className={cn(
            'min-h-0 flex-col gap-px overflow-hidden bg-background text-foreground',
            embedded ? 'h-full' : 'h-svh',
          )}
          style={
            {
              '--sidebar-width': density === 'comfortable' ? '18rem' : '16rem',
            } as CSSProperties
          }
        >
          {features.topMenu ? (
            <MdiTopMenu
              applicationIcon={applicationIcon}
              applicationLogoUrl={applicationLogoUrl}
              applicationName={applicationName}
              apps={applicationApps}
              features={features}
              notificationCount={notificationCount}
              notifications={notifications}
              navigation={navigation}
              searchPlaceholder={searchPlaceholder}
              searchValue={searchValue}
              user={user}
              onSearchChange={onSearchChange}
            />
          ) : null}

          <div
            className={cn(
              'relative flex min-h-0 flex-1 overflow-hidden border-t border-border',
              deskRegionId && topology.highlightClassName(deskRegionId),
            )}
            {...(deskRegionId ? topology.regionProps(deskRegionId) : {})}
          >
            {deskRegionId ? <TopologyMarker id={deskRegionId} topology={topology} /> : null}
            {view === 'workspace' ? (
              <MdiSidebar
                navigation={navigation}
                onOpenFeatures={() => setView('settings')}
                primaryAction={primaryAction}
                sidebarContent={sidebarContent}
                sidebarContentClassName={sidebarContentClassName}
                sidebarFooter={sidebarFooter}
                sidebarFooterClassName={sidebarFooterClassName}
                stateKey={sidebarStateKey}
              />
            ) : null}
            <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
              <main
                className={cn(
                  'relative min-h-0 min-w-0 flex-1 overflow-hidden bg-background data-[ito-highlighted=true]:ring-2 data-[ito-highlighted=true]:ring-inset data-[ito-highlighted=true]:ring-violet-700',
                  canvas === 'grid' &&
                    'bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[20px_20px]',
                )}
                {...topology.regionProps('03')}
              >
                <TopologyMarker id="03" topology={topology} />
                {view === 'settings' ? (
                  (settingsContent?.({
                    features,
                    onBack: () => setView('workspace'),
                    onFeatureChange: setFeature,
                  }) ?? (
                    <MdiFeatureSettings
                      features={features}
                      onBack={() => setView('workspace')}
                      onFeatureChange={setFeature}
                    />
                  ))
                ) : children ? (
                  <div className="relative size-full min-h-0 min-w-0 overflow-hidden">
                    {children}
                  </div>
                ) : (
                  <MdiEmptyWorkspace workspaceTitle={workspaceTitle} />
                )}
              </main>
              {features.statusBar ? (
                <MdiStatusBar
                  statusEnd={statusEnd}
                  statusLabel={statusLabel}
                  workspaceTitle={workspaceTitle}
                />
              ) : null}
            </SidebarInset>
          </div>

          {showAppearancePanel ? (
            <MdiTweakPanel
              canvas={canvas}
              density={density}
              onCanvasChange={setCanvas}
              onDensityChange={setDensity}
              onOpenFeatures={() => setView('settings')}
            />
          ) : null}
          {showTopologyTools ? (
            <>
              <TopologyInspector topology={topology} />
              <TopologyInspectionControl topology={topology} />
            </>
          ) : null}
        </SidebarProvider>
      </MdiTopologyProvider>
    </ThemeProvider>
  )
}

export type { MdiMainProps }
