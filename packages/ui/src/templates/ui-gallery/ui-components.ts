import { galleryComponents, type GalleryCategory } from './gallery-catalog'

export type UiComponentDoc = {
  category: GalleryCategory
  id: string
  name: string
  source: string
}

export const uiComponentDocs: readonly UiComponentDoc[] = galleryComponents
  .filter(({ name }) => name !== 'Table')
  .map((component) => ({ ...component, id: toId(component.name) }))
  .sort((left, right) => left.name.localeCompare(right.name))

export function findUiComponent(componentId: string | null): UiComponentDoc | undefined {
  return uiComponentDocs.find(({ id }) => id === componentId)
}

function toId(name: string) {
  return name.toLowerCase().replaceAll(' ', '-')
}
