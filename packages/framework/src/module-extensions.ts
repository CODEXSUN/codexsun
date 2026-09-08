import { satisfies } from 'semver'
import type {
  FrameworkModule,
  ModuleExtensionContribution,
  ModuleExtensionPoint,
} from './module-contracts.js'
import type { ModuleIssue } from './module-errors.js'

export interface ResolvedModuleExtension {
  contribution: ModuleExtensionContribution
  contributorId: string
  point: ModuleExtensionPoint
  providerId: string
}

export function collectExtensionIssues(modules: readonly FrameworkModule[]): ModuleIssue[] {
  const issues: ModuleIssue[] = []
  const points = collectPoints(modules, issues)
  const extensionIds = new Set<string>()
  const contributions = new Map<string, number>()

  for (const module of modules) {
    for (const extension of module.extensions) {
      checkUniqueExtension(extensionIds, extension.id, module.id, issues)
      const target = points.get(extension.pointId)
      if (!target) {
        issues.push(
          issue(
            'MISSING_EXTENSION_POINT',
            module.id,
            `Module "${module.id}" targets missing extension point "${extension.pointId}".`,
          ),
        )
        continue
      }

      if (!satisfies(target.point.version, extension.pointVersionRange)) {
        issues.push(
          issue(
            'INCOMPATIBLE_EXTENSION_POINT',
            module.id,
            `Extension "${extension.id}" requires "${extension.pointId}" at "${extension.pointVersionRange}", but version "${target.point.version}" is registered.`,
          ),
        )
      }

      if (target.moduleId !== module.id && !hasDependency(module, target.moduleId)) {
        issues.push(
          issue(
            'EXTENSION_DEPENDENCY_REQUIRED',
            module.id,
            `Module "${module.id}" must depend on extension point owner "${target.moduleId}".`,
          ),
        )
      }
      contributions.set(extension.pointId, (contributions.get(extension.pointId) ?? 0) + 1)
    }
  }

  for (const [pointId, count] of contributions) {
    const target = points.get(pointId)
    if (target?.point.cardinality === 'one' && count > 1) {
      issues.push(
        issue(
          'EXTENSION_CARDINALITY',
          target.moduleId,
          `Extension point "${pointId}" accepts one contribution, but ${count} are registered.`,
        ),
      )
    }
  }
  return issues
}

export function resolveModuleExtensions(
  modules: readonly FrameworkModule[],
): readonly ResolvedModuleExtension[] {
  const points = collectPoints(modules, [])
  return modules
    .flatMap((module) =>
      module.extensions.map((contribution) => {
        const target = points.get(contribution.pointId)!
        return {
          contribution: Object.freeze({ ...contribution }),
          contributorId: module.id,
          point: Object.freeze({ ...target.point }),
          providerId: target.moduleId,
        }
      }),
    )
    .sort(
      (left, right) =>
        left.contribution.pointId.localeCompare(right.contribution.pointId) ||
        left.contribution.order - right.contribution.order ||
        left.contribution.id.localeCompare(right.contribution.id),
    )
    .map((extension) => Object.freeze(extension))
}

function collectPoints(
  modules: readonly FrameworkModule[],
  issues: ModuleIssue[],
): Map<string, { moduleId: string; point: ModuleExtensionPoint }> {
  const points = new Map<string, { moduleId: string; point: ModuleExtensionPoint }>()
  for (const module of modules) {
    for (const point of module.extensionPoints) {
      const owner = points.get(point.id)
      if (owner) {
        issues.push(
          issue(
            'DUPLICATE_EXTENSION_POINT',
            module.id,
            `Extension point "${point.id}" is already owned by module "${owner.moduleId}".`,
          ),
        )
      } else {
        points.set(point.id, { moduleId: module.id, point })
      }
    }
  }
  return points
}

function checkUniqueExtension(
  ids: Set<string>,
  extensionId: string,
  moduleId: string,
  issues: ModuleIssue[],
): void {
  if (ids.has(extensionId)) {
    issues.push(
      issue(
        'DUPLICATE_EXTENSION',
        moduleId,
        `Extension "${extensionId}" is registered more than once.`,
      ),
    )
  }
  ids.add(extensionId)
}

function hasDependency(module: FrameworkModule, moduleId: string): boolean {
  return module.dependencies.some((dependency) => dependency.id === moduleId)
}

function issue(code: ModuleIssue['code'], moduleId: string, message: string): ModuleIssue {
  return { code, message, moduleId }
}
