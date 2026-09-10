import { designSystemBlocks } from '@codexsun/ui/design-system'

export type UiBlockId = 'form' | 'table' | 'execution-status'

export type UiBlockDoc = {
  id: UiBlockId
  name: string
  source: string
}

export const uiBlockDocs: readonly UiBlockDoc[] = designSystemBlocks.map(
  ({ id, name, source }) => ({
    id: id as UiBlockId,
    name,
    source,
  }),
)

export function findUiBlock(blockId: string | null): UiBlockDoc | undefined {
  return uiBlockDocs.find(({ id }) => id === blockId)
}
