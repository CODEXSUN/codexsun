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
    description: 'Opens global search for the active workspace and application destinations.',
  },
  {
    id: '01.3.1',
    technicalName: 'mdi.globalSearch.triggerButton',
    name: 'Global search button',
    scope: 'Global search',
    description: 'Opens global search by pointer or Control K.',
  },
  {
    id: '01.3.2',
    technicalName: 'mdi.globalSearch.dialogPanel',
    name: 'Global search dialog',
    scope: 'Global search',
    description: 'Hosts the search input and matching destinations.',
  },
  {
    id: '01.3.3',
    technicalName: 'mdi.globalSearch.queryInput',
    name: 'Search query input',
    scope: 'Global search dialog',
    description: 'Sends the current query to the application search contract.',
  },
  {
    id: '01.3.4',
    technicalName: 'mdi.globalSearch.destinationList',
    name: 'Search destination list',
    scope: 'Global search dialog',
    description: 'Filters workspace navigation and application destinations.',
  },
  {
    id: '01.4',
    technicalName: 'mdi.commandBar.notifications',
    name: 'Notifications',
    scope: 'Command bar',
    description: 'Opens application notifications.',
  },
  {
    id: '01.4.1',
    technicalName: 'mdi.notifications.triggerButton',
    name: 'Notification button',
    scope: 'Notifications',
    description: 'Opens the notification panel and shows unread activity.',
  },
  {
    id: '01.4.2',
    technicalName: 'mdi.notifications.dropdownPanel',
    name: 'Notification dropdown',
    scope: 'Notifications',
    description: 'Shows unread status and application notification content.',
  },
  {
    id: '01.4.3',
    technicalName: 'mdi.notifications.notificationList',
    name: 'Notification list',
    scope: 'Notification dropdown',
    description: 'Lists application-owned notification records or the current empty state.',
  },
  {
    id: '01.5',
    technicalName: 'mdi.commandBar.applicationSwitcher',
    name: 'Application switcher',
    scope: 'Command bar',
    description: 'Opens other registered applications.',
  },
  {
    id: '01.5.1',
    technicalName: 'mdi.appSwitcher.triggerButton',
    name: 'Application launcher button',
    scope: 'Application switcher',
    description: 'Opens the application launcher with a nine-dot symbol.',
  },
  {
    id: '01.5.2',
    technicalName: 'mdi.appSwitcher.dropdownPanel',
    name: 'Application launcher panel',
    scope: 'Application switcher',
    description: 'Shows the application launcher popover.',
  },
  {
    id: '01.5.3',
    technicalName: 'mdi.appSwitcher.applicationGrid',
    name: 'Application grid',
    scope: 'Application launcher panel',
    description: 'Lists all application destinations in a three-column grid.',
  },
  {
    id: '01.6',
    technicalName: 'mdi.commandBar.profileMenu',
    name: 'Profile menu',
    scope: 'Command bar',
    description: 'Opens profile and session actions.',
  },
  {
    id: '01.6.1',
    technicalName: 'mdi.profile.triggerButton',
    name: 'User button',
    scope: 'Profile menu',
    description: 'Shows the user avatar or the first letter of the user name.',
  },
  {
    id: '01.6.2',
    technicalName: 'mdi.profile.dropdownPanel',
    name: 'Profile dropdown',
    scope: 'Profile menu',
    description: 'Shows the current user identity and session actions.',
  },
  {
    id: '01.6.3',
    technicalName: 'mdi.profile.userAvatar',
    name: 'User avatar',
    scope: 'Profile dropdown',
    description: 'Shows an image when supplied and a name initial otherwise.',
  },
  {
    id: '01.6.4',
    technicalName: 'mdi.profile.sessionActions',
    name: 'Session actions',
    scope: 'Profile dropdown',
    description: 'Contains the shared sign-out action.',
  },
  {
    id: '01.6.5',
    technicalName: 'mdi.profile.themeToggle',
    name: 'Theme toggle',
    scope: 'Profile dropdown',
    description: 'Cycles the shared appearance mode through system, light, and dark.',
  },
  {
    id: '02',
    technicalName: 'mdi.navigation.sidebar',
    name: 'Application sidebar',
    scope: 'Application chrome',
    description: 'Contains the primary action, navigation, and feature settings.',
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
    id: '05.1',
    technicalName: 'mdi.appearance.themeSelector',
    name: 'Theme selector',
    scope: 'Appearance control',
    description: 'Selects the shared color mode and accent composition.',
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
