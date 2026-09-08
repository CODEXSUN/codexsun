import type { PlatformWebModule } from '@codexsun/platform-core-web'
import type { FC } from 'react'
import { SystemWorkspace } from './system.workspace'

export const systemWebModule: PlatformWebModule<FC> = {
  id: 'system',
  navigation: [{ id: 'system.runtime', label: 'System', order: 10, routeId: 'system.runtime' }],
  routes: [
    {
      component: SystemWorkspace,
      id: 'system.runtime',
      path: '/system',
      title: 'System runtime',
    },
  ],
  version: '1.1.0',
}
