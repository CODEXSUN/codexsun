import type { DesignSystemBlockDefinition, DesignSystemVariantDefinition } from './contracts'

const defaultVariant: DesignSystemVariantDefinition = {
  description: 'The package-owned application default.',
  id: 'default',
  name: 'Default',
}

const tableVariants: readonly DesignSystemVariantDefinition[] = [
  {
    description: 'A complete workspace table with tools, totals, and pagination.',
    id: 'default',
    name: 'Workspace',
  },
  {
    description: 'A compact table section without page-level tools.',
    id: 'section',
    name: 'Section',
  },
]

export const designSystemBlocks: readonly DesignSystemBlockDefinition[] = [
  {
    defaultVariantId: 'default',
    description: 'Observed execution state with motion-safe activity and measured values.',
    id: 'execution-status',
    name: 'Execution Status',
    source: '@codexsun/ui/blocks/execution-status',
    variants: [defaultVariant],
  },
  {
    defaultVariantId: 'default',
    description: 'A typed data table with application-owned rows and columns.',
    id: 'table',
    name: 'Table',
    source: '@codexsun/ui/blocks/table',
    variants: tableVariants,
  },
  {
    defaultVariantId: 'default',
    description: 'A typed application form frame with tabs, lookup fields, and actions.',
    id: 'form',
    name: 'Form',
    source: '@codexsun/ui/blocks/form',
    variants: [defaultVariant],
  },
]

export function getDesignSystemBlock(blockId: string) {
  return designSystemBlocks.find(({ id }) => id === blockId)
}
