import { designSystemComponents, type DesignSystemComponentDefinition } from '../../design-system'

export type UiComponentDoc = DesignSystemComponentDefinition

export const uiComponentDocs: readonly UiComponentDoc[] = designSystemComponents
  .filter(({ id }) => id !== 'table')
  .sort((left, right) => left.name.localeCompare(right.name))

export function findUiComponent(componentId: string | null): UiComponentDoc | undefined {
  return uiComponentDocs.find(({ id }) => id === componentId)
}
