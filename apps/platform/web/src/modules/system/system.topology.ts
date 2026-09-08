import type { InterfaceTopologySection } from '@codexsun/ui/features/interface-topology'

export const systemTopologySections: readonly InterfaceTopologySection[] = [
  {
    id: '10',
    technicalName: 'system.workspace.container',
    name: 'System workspace',
    scope: 'Platform',
    description: 'Shows Platform runtime and registered module information.',
  },
  {
    id: '10.1',
    technicalName: 'system.header.summary',
    name: 'System summary banner',
    scope: 'System workspace',
    description: 'Identifies the Platform version and System module page.',
  },
  {
    id: '10.2',
    technicalName: 'system.modules.list',
    name: 'Module list',
    scope: 'System workspace',
    description: 'Lists all active runtime modules.',
  },
  {
    id: '10.2.1',
    technicalName: 'system.modules.card',
    name: 'Module card',
    scope: 'Module list',
    description: 'Shows one module version and its capabilities.',
  },
  {
    id: '10.3',
    technicalName: 'system.error.retry',
    name: 'Runtime error and retry',
    scope: 'System workspace',
    description: 'Reports an unavailable Platform API and provides retry.',
  },
]
