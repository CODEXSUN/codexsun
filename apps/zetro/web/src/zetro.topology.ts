import type { InterfaceTopologySection } from '@codexsun/ui/features/interface-topology'
import { agentChatTopologySections } from './modules/agent-chat'

export const zetroTopologySections: readonly InterfaceTopologySection[] = [
  {
    id: '15',
    technicalName: 'zetro.desk.container',
    name: 'Zetro Desk',
    scope: 'Zetro',
    description: 'Groups the complete Zetro Desk page and its owned components.',
  },
  {
    id: '15.1',
    technicalName: 'zetro.workspace.canvas',
    name: 'Zetro workspace',
    scope: 'Zetro Desk',
    description: 'Hosts the active Zetro workspace content.',
  },
  {
    id: '15.2',
    technicalName: 'zetro.sidebar.container',
    name: 'Zetro Desk sidebar',
    scope: 'Zetro Desk',
    description: 'Hosts Zetro-owned history through the shared MDI sidebar shell.',
  },
  {
    id: '15.1.4',
    technicalName: 'zetro.tasks.workspace',
    name: 'Project tasks workspace',
    scope: 'Zetro workspace',
    description: 'Lists and manages tasks for the selected project.',
  },
  {
    id: '15.2.4',
    technicalName: 'zetro.project.switcher',
    name: 'Project switcher',
    scope: 'Zetro Desk sidebar',
    description: 'Selects or registers a project workspace.',
  },
  {
    id: '15.2.5',
    technicalName: 'zetro.project.navigation',
    name: 'Project navigation',
    scope: 'Zetro Desk sidebar',
    description: 'Switches between project chat and task management.',
  },
  ...agentChatTopologySections,
]
