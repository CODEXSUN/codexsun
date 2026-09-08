import type { PlatformWebModule } from '@codexsun/platform-core-web'
import { UiGallery } from '@codexsun/ui/templates/ui-gallery'
import type { FC } from 'react'

export const uiGalleryWebModule: PlatformWebModule<FC> = {
  id: 'ui-gallery',
  navigation: [
    {
      id: 'ui-gallery.components',
      label: 'UI Gallery',
      order: 20,
      routeId: 'ui-gallery.components',
    },
  ],
  routes: [
    {
      component: UiGallery,
      id: 'ui-gallery.components',
      path: '/ui',
      title: 'UI component gallery',
    },
  ],
  version: '1.0.0',
}
