export interface PlatformNavigationContribution {
  id: string
  label: string
  order: number
  routeId: string
}

export interface PlatformRouteContribution<TComponent> {
  component: TComponent
  id: string
  path: string
  title: string
}

export interface PlatformWebModule<TComponent> {
  id: string
  navigation: readonly PlatformNavigationContribution[]
  routes: readonly PlatformRouteContribution<TComponent>[]
  version: string
}

export interface PlatformWebComposition<TComponent> {
  modules: readonly PlatformWebModule<TComponent>[]
  navigation: readonly PlatformNavigationContribution[]
  routes: readonly PlatformRouteContribution<TComponent>[]
}

export function composeWebModules<TComponent>(
  modules: readonly PlatformWebModule<TComponent>[],
): PlatformWebComposition<TComponent> {
  const moduleIds = new Set<string>()
  const routeIds = new Set<string>()
  const routePaths = new Set<string>()

  for (const module of modules) {
    assertUnique(moduleIds, module.id, 'module ID')
    for (const route of module.routes) {
      assertUnique(routeIds, route.id, 'route ID')
      assertUnique(routePaths, route.path, 'route path')
    }
    for (const item of module.navigation) {
      if (!module.routes.some(({ id }) => id === item.routeId)) {
        throw new Error(`Navigation item "${item.id}" references missing route "${item.routeId}".`)
      }
    }
  }

  return Object.freeze({
    modules: Object.freeze([...modules].sort((left, right) => left.id.localeCompare(right.id))),
    navigation: Object.freeze(
      modules
        .flatMap(({ navigation }) => navigation)
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)),
    ),
    routes: Object.freeze(modules.flatMap(({ routes }) => routes)),
  })
}

function assertUnique(values: Set<string>, value: string, label: string): void {
  if (values.has(value)) throw new Error(`Duplicate Platform web ${label}: "${value}".`)
  values.add(value)
}
