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
    description:
      'Observed execution state, readiness checklists, and optional startup splash with measured values.',
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
  {
    defaultVariantId: 'default',
    description: 'An interactive drag-and-drop Kanban board with sortable columns and cards.',
    id: 'kanban',
    name: 'Kanban Board',
    source: '@codexsun/ui/blocks/kanban',
    variants: [defaultVariant],
  },
  {
    defaultVariantId: 'default',
    description: 'A hierarchical file and workspace explorer tree with icons, filter, and actions.',
    id: 'file-tree',
    name: 'File Tree',
    source: '@codexsun/ui/blocks/file-tree',
    variants: [defaultVariant],
  },
  {
    defaultVariantId: 'default',
    description: 'A drag-and-drop file upload zone with type/size validation and progress tracking.',
    id: 'dropzone',
    name: 'File Dropzone',
    source: '@codexsun/ui/blocks/dropzone',
    variants: [defaultVariant],
  },
  {
    defaultVariantId: 'default',
    description: 'A multi-condition query filter builder with combinators and typed operators.',
    id: 'filter-builder',
    name: 'Filter Builder',
    source: '@codexsun/ui/blocks/filter-builder',
    variants: [defaultVariant],
  },
  {
    defaultVariantId: 'default',
    description: 'An e-commerce product card with image zoom, ratings, swatches, and cart actions.',
    id: 'product-card',
    name: 'Product Card',
    source: '@codexsun/ui/blocks/product-card',
    variants: [defaultVariant],
  },
  {
    defaultVariantId: 'default',
    description: 'A multi-tier pricing table with monthly/annual interval toggle and feature lists.',
    id: 'pricing',
    name: 'Pricing Table',
    source: '@codexsun/ui/blocks/pricing',
    variants: [defaultVariant],
  },
]

export function getDesignSystemBlock(blockId: string) {
  return designSystemBlocks.find(({ id }) => id === blockId)
}
