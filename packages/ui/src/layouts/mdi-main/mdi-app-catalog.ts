import {
  BookOpenIcon,
  BotIcon,
  BoxesIcon,
  NetworkIcon,
  PanelsTopLeftIcon,
  WrenchIcon,
} from 'lucide-react'

import type { MdiAppItem } from './mdi-types'

type MdiCatalogEntry = MdiAppItem & {
  id: 'devkit' | 'docs' | 'orship' | 'platform' | 'ui' | 'zetro'
  localPort: string
  path: string
}

const mdiApplicationCatalog: readonly MdiCatalogEntry[] = [
  {
    icon: BoxesIcon,
    id: 'platform',
    label: 'Platform',
    localPort: '6021',
    path: '/system',
  },
  {
    icon: PanelsTopLeftIcon,
    id: 'ui',
    label: 'UI',
    localPort: '6021',
    path: '/ui',
  },
  {
    icon: BookOpenIcon,
    id: 'docs',
    label: 'Docs',
    localPort: '6040',
    path: '/',
  },
  {
    icon: WrenchIcon,
    id: 'devkit',
    label: 'DevKit',
    localPort: '6080',
    path: '/',
  },
  {
    icon: NetworkIcon,
    id: 'orship',
    label: 'Orship',
    localPort: '6091',
    path: '/',
  },
  {
    icon: BotIcon,
    id: 'zetro',
    label: 'Zetro',
    localPort: '6060',
    path: '/zetro',
  },
]

export function createDefaultMdiApps(applicationId: string): MdiAppItem[] {
  const currentLocation = typeof window === 'undefined' ? undefined : window.location

  return mdiApplicationCatalog.map(({ id, localPort, path, ...app }) => ({
    ...app,
    active: isApplicationActive(id, applicationId, currentLocation?.pathname),
    href: createApplicationHref(localPort, path, currentLocation),
  }))
}

function isApplicationActive(
  id: MdiCatalogEntry['id'],
  applicationId: string,
  pathname = '',
): boolean {
  if (id === 'ui') return applicationId === 'platform' && pathname.startsWith('/ui')
  if (id === 'platform') return applicationId === 'platform' && !pathname.startsWith('/ui')
  return id === applicationId
}

function createApplicationHref(
  localPort: string,
  path: string,
  currentLocation?: Location,
): string {
  if (!currentLocation || !isLocalHostname(currentLocation.hostname)) return path

  const target = new URL(currentLocation.origin)
  target.port = localPort
  target.pathname = path
  target.search = ''
  target.hash = ''
  return target.toString()
}

function isLocalHostname(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost'
}
