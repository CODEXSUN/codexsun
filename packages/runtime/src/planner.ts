import { satisfies, valid } from 'semver'
import {
  deploymentCatalogSchema,
  deploymentProfileSchema,
  type DeploymentAddon,
  type DeploymentApplication,
  type DeploymentCatalog,
  type DeploymentComponent,
  type DeploymentProfile,
  type RuntimeBinding,
} from './contracts.js'

export interface PlannedComponent extends DeploymentComponent {
  applicationId: string
  port: number
}

export interface DeploymentPlan {
  addons: readonly DeploymentAddon[]
  applications: readonly DeploymentApplication[]
  buildWorkspaces: readonly string[]
  components: readonly PlannedComponent[]
  profile: DeploymentProfile
  runtimePackages: readonly { id: string; version: string }[]
}

export class DeploymentPlanner {
  private readonly catalog: DeploymentCatalog

  constructor(catalogInput: unknown) {
    this.catalog = deploymentCatalogSchema.parse(catalogInput)
    validateCatalog(this.catalog)
  }

  createPlan(profileInput: unknown): DeploymentPlan {
    const profile = deploymentProfileSchema.parse(profileInput)
    const applications = resolveApplications(this.catalog, profile.applications)
    const addons = resolveAddons(this.catalog, profile.addons, applications)
    const bindings = [
      ...applications.flatMap(({ runtimeBindings }) => runtimeBindings),
      ...addons.flatMap(({ runtimeBindings }) => runtimeBindings),
    ]
    const runtimePackages = resolveRuntimePackages(this.catalog, bindings)
    const components = orderComponents(
      attachAddons(resolveComponents(applications, profile), addons, applications),
    )
    const buildWorkspaces = unique([
      ...runtimePackages.map(({ id }) => id),
      ...components.flatMap(({ buildWorkspaces: workspaces }) => workspaces),
      ...addons.map(({ workspace }) => workspace),
    ])

    return freezePlan({
      addons,
      applications,
      buildWorkspaces,
      components,
      profile,
      runtimePackages,
    })
  }
}

function attachAddons(
  components: readonly PlannedComponent[],
  addons: readonly DeploymentAddon[],
  applications: readonly DeploymentApplication[],
): PlannedComponent[] {
  const applicationComponents = new Map(
    applications.map((application) => [
      application.id,
      new Set(application.components.map(({ id }) => id)),
    ]),
  )
  const workspacesByComponent = new Map<string, string[]>()

  for (const addon of addons) {
    const allowed = applicationComponents.get(addon.targetApplication)!
    for (const componentId of addon.componentIds) {
      if (!allowed.has(componentId)) {
        throw new Error(
          `Add-on "${addon.id}" cannot bind unknown target component "${componentId}".`,
        )
      }
      const workspaces = workspacesByComponent.get(componentId) ?? []
      workspaces.push(addon.workspace)
      workspacesByComponent.set(componentId, workspaces)
    }
  }

  return components.map((component) => ({
    ...component,
    buildWorkspaces: unique([
      ...component.buildWorkspaces,
      ...(workspacesByComponent.get(component.id) ?? []),
    ]),
  }))
}

function orderComponents(components: readonly PlannedComponent[]): PlannedComponent[] {
  const componentsById = new Map(components.map((component) => [component.id, component]))
  const ordered: PlannedComponent[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  const visit = (component: PlannedComponent) => {
    if (visited.has(component.id)) return
    if (visiting.has(component.id)) {
      throw new Error(`Component dependency cycle includes "${component.id}".`)
    }
    visiting.add(component.id)
    for (const dependencyId of component.dependsOn) {
      const dependency = componentsById.get(dependencyId)
      if (!dependency) {
        throw new Error(`Component "${component.id}" requires missing component "${dependencyId}".`)
      }
      visit(dependency)
    }
    visiting.delete(component.id)
    visited.add(component.id)
    ordered.push(component)
  }

  for (const component of components) visit(component)
  return ordered
}

function validateCatalog(catalog: DeploymentCatalog): void {
  assertUnique(
    catalog.applications.map(({ id }) => id),
    'application',
  )
  assertUnique(
    catalog.addons.map(({ id }) => id),
    'add-on',
  )
  assertUnique(
    catalog.runtimePackages.map(({ id }) => id),
    'runtime package',
  )
  assertUnique(
    catalog.applications.flatMap(({ components }) => components.map(({ id }) => id)),
    'component',
  )

  const applicationIds = new Set(catalog.applications.map(({ id }) => id))
  for (const application of catalog.applications) {
    for (const required of application.requires) {
      if (!applicationIds.has(required)) {
        throw new Error(
          `Application "${application.id}" requires unknown application "${required}".`,
        )
      }
      if (required === application.id) {
        throw new Error(`Application "${application.id}" cannot require itself.`)
      }
    }
  }
  for (const addon of catalog.addons) {
    if (!applicationIds.has(addon.targetApplication)) {
      throw new Error(
        `Add-on "${addon.id}" targets unknown application "${addon.targetApplication}".`,
      )
    }
  }
}

function resolveApplications(
  catalog: DeploymentCatalog,
  selectedIds: readonly string[],
): DeploymentApplication[] {
  const applications = new Map(
    catalog.applications.map((application) => [application.id, application]),
  )
  const selected = new Map<string, DeploymentApplication>()
  const visiting = new Set<string>()

  const select = (id: string) => {
    if (selected.has(id)) return
    if (visiting.has(id)) throw new Error(`Application dependency cycle includes "${id}".`)
    const application = applications.get(id)
    if (!application) throw new Error(`Deployment profile selects unknown application "${id}".`)
    visiting.add(id)
    for (const required of application.requires) select(required)
    visiting.delete(id)
    selected.set(id, application)
  }

  for (const id of selectedIds) select(id)
  return [...selected.values()]
}

function resolveAddons(
  catalog: DeploymentCatalog,
  selectedIds: readonly string[],
  applications: readonly DeploymentApplication[],
): DeploymentAddon[] {
  const available = new Map(catalog.addons.map((addon) => [addon.id, addon]))
  const selected = new Map<string, DeploymentAddon>()
  const visiting = new Set<string>()
  const applicationIds = new Set(applications.map(({ id }) => id))

  const select = (id: string) => {
    if (selected.has(id)) return
    if (visiting.has(id)) throw new Error(`Add-on dependency cycle includes "${id}".`)
    const addon = available.get(id)
    if (!addon) throw new Error(`Deployment profile selects unknown add-on "${id}".`)
    visiting.add(id)
    for (const required of addon.requires) select(required)
    if (!applicationIds.has(addon.targetApplication)) {
      throw new Error(`Add-on "${id}" requires selected application "${addon.targetApplication}".`)
    }
    visiting.delete(id)
    selected.set(id, addon)
  }

  for (const id of selectedIds) select(id)
  return [...selected.values()]
}

function resolveRuntimePackages(
  catalog: DeploymentCatalog,
  bindings: readonly RuntimeBinding[],
): { id: string; version: string }[] {
  const packages = new Map(
    catalog.runtimePackages.map((runtimePackage) => [runtimePackage.id, runtimePackage]),
  )
  const selected = new Map<string, { id: string; version: string }>()

  for (const binding of bindings) {
    const runtimePackage = packages.get(binding.id)
    if (!runtimePackage) throw new Error(`Runtime package "${binding.id}" is not in the catalog.`)
    if (
      !valid(runtimePackage.version) ||
      !satisfies(runtimePackage.version, binding.versionRange)
    ) {
      throw new Error(
        `Runtime package "${binding.id}" version "${runtimePackage.version}" does not satisfy "${binding.versionRange}".`,
      )
    }
    selected.set(runtimePackage.id, runtimePackage)
  }
  return [...selected.values()].sort(byId)
}

function resolveComponents(
  applications: readonly DeploymentApplication[],
  profile: DeploymentProfile,
): PlannedComponent[] {
  const ports = new Map<number, string>()
  return applications.flatMap((application) =>
    application.components.map((component) => {
      const port = profile.portOverrides[component.id] ?? component.defaultPort
      const owner = ports.get(port)
      if (owner)
        throw new Error(`Components "${owner}" and "${component.id}" both use port ${port}.`)
      ports.set(port, component.id)
      return { ...component, applicationId: application.id, port }
    }),
  )
}

function freezePlan(plan: DeploymentPlan): DeploymentPlan {
  return Object.freeze({
    ...plan,
    addons: Object.freeze([...plan.addons]),
    applications: Object.freeze([...plan.applications]),
    buildWorkspaces: Object.freeze([...plan.buildWorkspaces]),
    components: Object.freeze(plan.components.map((component) => Object.freeze(component))),
    profile: Object.freeze(plan.profile),
    runtimePackages: Object.freeze(plan.runtimePackages.map((item) => Object.freeze(item))),
  })
}

function assertUnique(values: readonly string[], kind: string): void {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index)
  if (duplicate)
    throw new Error(`The deployment catalog declares duplicate ${kind} "${duplicate}".`)
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function byId(left: { id: string }, right: { id: string }): number {
  return left.id.localeCompare(right.id)
}
