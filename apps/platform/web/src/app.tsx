import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { uiGalleryTopologySections } from '@codexsun/ui/templates/ui-gallery'
import { RouterProvider } from '@tanstack/react-router'
import { platformRouter, platformWebComposition } from './app-router'
import { systemTopologySections } from './modules/system/system.topology'

const navigation = [
  {
    label: 'Platform',
    items: platformWebComposition.navigation.map((item) => {
      const route = platformWebComposition.routes.find(({ id }) => id === item.routeId)!
      return {
        active: window.location.pathname === route.path,
        href: route.path,
        label: item.label,
      }
    }),
  },
]

export function App() {
  return (
    <MdiMain
      applicationId="platform"
      applicationName="Platform"
      navigation={navigation}
      searchPlaceholder="Search workspace"
      topologySections={[...systemTopologySections, ...uiGalleryTopologySections]}
      workspaceTitle="System"
    >
      <RouterProvider router={platformRouter} />
    </MdiMain>
  )
}
