import type { PlatformWebModule } from '@codexsun/platform-core-web'
import { lazy, Suspense, type FC } from 'react'

const UiGallery = lazy(() =>
  import('@codexsun/ui/templates/ui-gallery/page').then((module) => ({
    default: module.UiGallery,
  })),
)

const UiGalleryRoute: FC = () => (
  <Suspense fallback={<div className="min-h-full bg-background" />}>
    <UiGallery />
  </Suspense>
)

export const uiGalleryWebModule: PlatformWebModule<FC> = {
  id: 'ui-gallery',
  navigation: [
    {
      id: 'ui-gallery.components',
      label: 'Overview',
      order: 20,
      routeId: 'ui-gallery.components',
    },
  ],
  routes: [
    {
      component: UiGalleryRoute,
      id: 'ui-gallery.components',
      path: '/ui',
      title: 'Overview workspace',
    },
  ],
  version: '1.2.0',
}
