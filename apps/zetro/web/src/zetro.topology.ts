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
    id: '15.1.5',
    technicalName: 'zetro.settings.workspace',
    name: 'Zetro settings',
    scope: 'Zetro workspace',
    description: 'Centralizes application preferences, appearance, and connections.',
  },
  {
    id: '15.1.5.1',
    technicalName: 'zetro.settings.general',
    name: 'General settings',
    scope: 'Zetro settings',
    description: 'Controls application-wide workflow and interface topology defaults.',
  },
  {
    id: '15.1.5.2',
    technicalName: 'zetro.settings.appearance',
    name: 'Appearance settings',
    scope: 'Zetro settings',
    description: 'Controls theme and shared workspace chrome.',
  },
  {
    id: '15.1.5.3',
    technicalName: 'zetro.settings.connection',
    name: 'Codex connection',
    scope: 'Zetro settings',
    description: 'Manages the local Codex account connection.',
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
