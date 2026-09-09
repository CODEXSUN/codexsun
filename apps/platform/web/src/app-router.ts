import { composeWebModules } from '@codexsun/platform-core-web'
import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { LoadingPage, NotFound, RouteError } from './app-router.messages'
import { identityWebModule } from './modules/identity'
import { systemWebModule } from './modules/system'

export const platformWebComposition = composeWebModules([identityWebModule, systemWebModule])

const rootRoute = createRootRoute({
  component: Outlet,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
  pendingComponent: LoadingPage,
})

const overviewRoute = createRoute({
  component: () => null,
  getParentRoute: () => rootRoute,
  path: '/overview',
})

const moduleRoutes = platformWebComposition.routes.map((route) =>
  createRoute({
    component: route.component,
    getParentRoute: () => rootRoute,
    path: route.path,
  }),
)

const routeTree = rootRoute.addChildren([overviewRoute, ...moduleRoutes])

export const platformRouter = createRouter({
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof platformRouter
  }
}
