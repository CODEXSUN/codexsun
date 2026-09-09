import { designSystemBlocks, getDesignSystemBlock } from './block-registry'
import { designSystemComponents, getDesignSystemComponent } from './component-registry'
import { designSystemPages, getDesignSystemPage } from './page-registry'
import type { DesignSystemSelection, DesignSystemSelectionInput } from './contracts'

export const defaultDesignSystemSelection = createDesignSystemSelection()

export function createDesignSystemSelection(
  input: DesignSystemSelectionInput = {},
): DesignSystemSelection {
  return Object.freeze({
    blocks: Object.freeze(resolveSelections(designSystemBlocks, input.blocks)),
    components: Object.freeze(resolveSelections(designSystemComponents, input.components)),
    pages: Object.freeze(resolveSelections(designSystemPages, input.pages)),
  })
}

export function resolveDesignSystemComponentVariant(
  componentId: string,
  requestedVariantId?: string,
) {
  const component = getDesignSystemComponent(componentId)
  if (!component) throw new Error(`Unknown design-system component: ${componentId}`)
  return resolveVariant(component, requestedVariantId)
}

export function resolveDesignSystemBlockVariant(blockId: string, requestedVariantId?: string) {
  const block = getDesignSystemBlock(blockId)
  if (!block) throw new Error(`Unknown design-system block: ${blockId}`)
  return resolveVariant(block, requestedVariantId)
}

export function resolveDesignSystemPageVariant(pageId: string, requestedVariantId?: string) {
  const page = getDesignSystemPage(pageId)
  if (!page) throw new Error(`Unknown design-system page: ${pageId}`)
  return resolveVariant(page, requestedVariantId)
}

type VariantOwner = {
  defaultVariantId: string
  id: string
  variants: readonly { id: string }[]
}

function resolveSelections(
  definitions: readonly VariantOwner[],
  requested: Readonly<Record<string, string>> = {},
) {
  rejectUnknownKeys(definitions, requested)
  return Object.fromEntries(
    definitions.map((definition) => [
      definition.id,
      resolveVariant(definition, requested[definition.id]),
    ]),
  )
}

function resolveVariant(definition: VariantOwner, requestedVariantId?: string) {
  const variantId = requestedVariantId ?? definition.defaultVariantId
  if (!definition.variants.some(({ id }) => id === variantId)) {
    throw new Error(`Unknown ${definition.id} variant: ${variantId}`)
  }
  return variantId
}

function rejectUnknownKeys(
  definitions: readonly VariantOwner[],
  requested: Readonly<Record<string, string>>,
) {
  const knownIds = new Set(definitions.map(({ id }) => id))
  const unknownId = Object.keys(requested).find((id) => !knownIds.has(id))
  if (unknownId) throw new Error(`Unknown design-system selection: ${unknownId}`)
}
