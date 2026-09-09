import {
  designSystemCategories,
  designSystemComponents,
  type DesignSystemCategory,
  type DesignSystemComponentDefinition,
} from '../../design-system'

export type GalleryCategory = DesignSystemCategory
export type GalleryComponent = Pick<DesignSystemComponentDefinition, 'category' | 'name' | 'source'>

export const galleryCategories = designSystemCategories
export const galleryComponents: readonly GalleryComponent[] = designSystemComponents
