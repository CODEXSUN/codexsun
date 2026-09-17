export const uiuxGalleryModule = {
  id: 'uiux.web.gallery',
  owner: "apps/uiux/web/modules/gallery",
  version: '1.3.1',
  dependencies: ['@codexsun/ui'],
  contracts: ['uiux.gallery.browser'],
  events: { published: [], consumed: [] },
} as const
