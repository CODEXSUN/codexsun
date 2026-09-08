import { createContext, useContext, type ReactNode } from 'react'
import type {
  InterfaceTopologyController,
  InterfaceTopologySection,
} from '../../features/interface-topology'

const MdiTopologyContext = createContext<InterfaceTopologyController | null>(null)

export const mdiTopologySections: readonly InterfaceTopologySection[] = [
  {
    id: '01',
    technicalName: 'mdi.commandBar.container',
    name: 'Command bar',
    scope: 'Application chrome',
    description:
      'Holds navigation, identity, search, notifications, applications, and profile controls.',
  },
  {
    id: '01.1',
    technicalName: 'mdi.commandBar.navigationToggle',
    name: 'Navigation toggle',
    scope: 'Command bar',
    description: 'Shows or hides the application navigation rail.',
  },
  {
    id: '01.2',
    technicalName: 'mdi.commandBar.applicationIdentity',
    name: 'Application identity',
    scope: 'Command bar',
    description: 'Identifies the active CODEXSUN application.',
  },
  {
    id: '01.3',
    technicalName: 'mdi.commandBar.globalSearch',
    name: 'Global search',
    scope: 'Command bar',
    description: 'Filters or searches the active application workspace.',
  },
  {
    id: '01.4',
    technicalName: 'mdi.commandBar.notifications',
    name: 'Notifications',
    scope: 'Command bar',
    description: 'Opens application notifications.',
  },
  {
    id: '01.5',
    technicalName: 'mdi.commandBar.applicationSwitcher',
    name: 'Application switcher',
    scope: 'Command bar',
    description: 'Opens other registered applications.',
  },
  {
    id: '01.6',
    technicalName: 'mdi.commandBar.profileMenu',
    name: 'Profile menu',
    scope: 'Command bar',
    description: 'Opens profile and session actions.',
  },
  {
    id: '02',
    technicalName: 'mdi.navigation.sidebar',
    name: 'Application sidebar',
    scope: 'Application chrome',
    description: 'Contains identity, primary action, navigation, and feature settings.',
  },
  {
    id: '02.1',
    technicalName: 'mdi.navigation.identityBanner',
    name: 'Identity banner',
    scope: 'Application sidebar',
    description: 'Shows the organization and current application.',
  },
  {
    id: '02.2',
    technicalName: 'mdi.navigation.primaryAction',
    name: 'Primary action',
    scope: 'Application sidebar',
    description: 'Starts the primary workspace action.',
  },
  {
    id: '02.3',
    technicalName: 'mdi.navigation.sectionList',
    name: 'Navigation sections',
    scope: 'Application sidebar',
    description: 'Lists application-owned destinations and actions.',
  },
  {
    id: '02.4',
    technicalName: 'mdi.navigation.featureSettings',
    name: 'Feature settings',
    scope: 'Application sidebar',
    description: 'Opens shared MDI feature controls.',
  },
  {
    id: '02.5',
    technicalName: 'mdi.navigation.railToggle',
    name: 'Sidebar rail toggle',
    scope: 'Application sidebar',
    description: 'Collapses or expands the sidebar.',
  },
  {
    id: '03',
    technicalName: 'mdi.workspace.canvas',
    name: 'Workspace canvas',
    scope: 'Application workspace',
    description: 'Hosts the active application-owned page.',
  },
  {
    id: '04',
    technicalName: 'mdi.statusBar.container',
    name: 'Status bar',
    scope: 'Application chrome',
    description: 'Shows runtime state and the active workspace name.',
  },
  {
    id: '05',
    technicalName: 'mdi.appearance.control',
    name: 'Appearance control',
    scope: 'Application chrome',
    description: 'Opens density, canvas, and feature controls.',
  },
  {
    id: '06',
    technicalName: 'mdi.features.workspace',
    name: 'Feature settings workspace',
    scope: 'Application settings',
    description: 'Controls the visibility of shared MDI features.',
  },
  {
    id: '06.1',
    technicalName: 'mdi.features.backButton',
    name: 'Back to workspace',
    scope: 'Feature settings',
    description: 'Returns to the active application workspace.',
  },
  {
    id: '06.2',
    technicalName: 'mdi.features.optionList',
    name: 'Feature option list',
    scope: 'Feature settings',
    description: 'Lists all configurable MDI features.',
  },
  {
    id: '06.2.1',
    technicalName: 'mdi.features.topMenuSwitch',
    name: 'Top menu switch',
    scope: 'Feature option list',
    description: 'Shows or hides the shared top menu.',
  },
  {
    id: '06.2.2',
    technicalName: 'mdi.features.notificationsSwitch',
    name: 'Notifications switch',
    scope: 'Feature option list',
    description: 'Shows or hides notifications.',
  },
  {
    id: '06.2.3',
    technicalName: 'mdi.features.applicationSwitcher',
    name: 'Application switcher control',
    scope: 'Feature option list',
    description: 'Shows or hides the application switcher.',
  },
  {
    id: '06.2.4',
    technicalName: 'mdi.features.profileMenuSwitch',
    name: 'Profile menu switch',
    scope: 'Feature option list',
    description: 'Shows or hides the profile menu.',
  },
  {
    id: '06.2.5',
    technicalName: 'mdi.features.statusBarSwitch',
    name: 'Status bar switch',
    scope: 'Feature option list',
    description: 'Shows or hides the status bar.',
  },
]

export function MdiTopologyProvider({
  children,
  value,
}: {
  children: ReactNode
  value: InterfaceTopologyController
}) {
  return <MdiTopologyContext.Provider value={value}>{children}</MdiTopologyContext.Provider>
}

export function useMdiTopology() {
  const topology = useContext(MdiTopologyContext)
  if (!topology) throw new Error('useMdiTopology must be used inside MdiMain.')
  return topology
}
