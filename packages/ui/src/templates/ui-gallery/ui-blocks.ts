export type UiBlockId = 'form' | 'table'

export type UiBlockDoc = {
  id: UiBlockId
  name: string
  source: string
}

export const uiBlockDocs: readonly UiBlockDoc[] = [
  { id: 'table', name: 'Table', source: '@codexsun/ui/blocks/table' },
  { id: 'form', name: 'Form', source: '@codexsun/ui/blocks/form' },
]

export function findUiBlock(blockId: string | null): UiBlockDoc | undefined {
  return uiBlockDocs.find(({ id }) => id === blockId)
}
