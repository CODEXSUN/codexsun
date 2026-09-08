import { composeWebModules } from '@codexsun/platform-core-web'
import { Button } from '@codexsun/ui/components/button'
import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { systemWebModule } from './modules/system'
import { SystemWorkspace } from './modules/system/system.workspace'
import { uiGalleryWebModule } from './modules/ui-gallery'

export const platformWebComposition = composeWebModules([systemWebModule, uiGalleryWebModule])

const rootRoute = createRootRoute({
  component: Outlet,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
  pendingComponent: () => <PageMessage title="Loading page" />,
})

const homeRoute = createRoute({
  component: SystemWorkspace,
  getParentRoute: () => rootRoute,
  path: '/',
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

const routeTree = rootRoute.addChildren([homeRoute, overviewRoute, ...moduleRoutes])

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

function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageMessage action={reset} message={error.message} title="The page failed to load" />
}

function NotFound() {
  return <PageMessage message="The requested route does not exist." title="Page not found" />
}

function PageMessage({
  action,
  message,
  title,
}: {
  action?: () => void
  message?: string
  title: string
}) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {message ? <p className="text-muted-foreground">{message}</p> : null}
        {action ? <Button onClick={action}>Retry</Button> : null}
      </div>
    </div>
  )
}
