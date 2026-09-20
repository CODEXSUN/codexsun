import type { DesignSystemTemplateDefinition } from './contracts';

export const designSystemTemplates: readonly DesignSystemTemplateDefinition[] = [
  {
    defaultVariantId: 'v1',
    description: 'A configurable master-data list with table and card views plus a generated record form.',
    id: 'master-list',
    name: 'Master List',
    source: '@codexsun/ui/blocks/master-list',
    variants: [
      { id: 'v1', name: 'Master List v1', description: 'A table-first master list page.' },
      { id: 'v2', name: 'Master List v2', description: 'A dense Desk-style list with quick filters and row activity.' },
      { id: 'v3', name: 'Master List v3', description: 'A dense Desk-style master list page.' },
      {
        id: 'v4',
        name: 'Master List v4',
        description: 'A v1 table with its title and create action in the application header.',
      },
    ],
  },
  {
    defaultVariantId: 'default',
    description: 'A compact status system with semantic colors and a check mark for record states.',
    id: 'status',
    name: 'Status Template',
    source: '@codexsun/ui/components/status-badge',
    variants: [{ id: 'default', name: 'Status', description: 'Standard colored status badges for record lists.' }],
  },
];

export function getDesignSystemTemplate(id: string) {
  return designSystemTemplates.find((template) => template.id === id);
}
