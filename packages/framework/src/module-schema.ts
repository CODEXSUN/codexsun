import { z } from 'zod'
import type { FrameworkModule, ModuleLifecycle } from './module-contracts.js'
import type { ModuleIssue } from './module-errors.js'

const identifier = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
const semanticVersion = z.string().min(1)
const semanticVersionRange = z.string().min(1)
const checksum = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const lifecycleAction = z.custom<ModuleLifecycle['activate']>(isFunction)
const upgradeAction = z.custom<ModuleLifecycle['upgrade']>(isFunction)

const dependencySchema = z.object({ id: identifier, versionRange: semanticVersionRange }).strict()
const dataSchema = z.object({ checksum, version: semanticVersion }).strict()
const publicContractSchema = z.object({ id: identifier, version: semanticVersion }).strict()
const publishedEventSchema = z.object({ id: identifier, version: semanticVersion }).strict()
const consumedEventSchema = z
  .object({ id: identifier, versionRange: semanticVersionRange })
  .strict()
const configurationSchema = z
  .object({ key: z.string().regex(/^[A-Z][A-Z0-9_]*$/), required: z.boolean() })
  .strict()
const extensionPointSchema = z
  .object({
    cardinality: z.enum(['many', 'one']),
    id: identifier,
    version: semanticVersion,
  })
  .strict()
const extensionSchema = z
  .object({
    id: identifier,
    order: z.number().int().safe(),
    pointId: identifier,
    pointVersionRange: semanticVersionRange,
  })
  .strict()
const lifecycleSchema = z
  .object({
    activate: lifecycleAction,
    deactivate: lifecycleAction,
    install: lifecycleAction,
    uninstall: lifecycleAction,
    upgrade: upgradeAction,
  })
  .strict()

const frameworkModuleSchema = z
  .object({
    capabilities: z.array(identifier),
    configuration: z.array(configurationSchema),
    consumes: z.array(consumedEventSchema),
    dependencies: z.array(dependencySchema),
    description: z.string().trim().min(1),
    dataSchema: dataSchema.optional(),
    extensionPoints: z.array(extensionPointSchema),
    extensions: z.array(extensionSchema),
    id: identifier,
    kind: z.enum(['adapter', 'addon', 'core', 'feature']),
    lifecycle: lifecycleSchema,
    owner: z.string().trim().min(1),
    platformVersionRange: semanticVersionRange,
    publicContracts: z.array(publicContractSchema),
    publishes: z.array(publishedEventSchema),
    scope: z.string().trim().min(1),
    version: semanticVersion,
  })
  .strict()

export type ModuleShapeResult =
  { module: FrameworkModule; success: true } | { issues: readonly ModuleIssue[]; success: false }

export function parseModuleShape(input: unknown): ModuleShapeResult {
  const result = frameworkModuleSchema.safeParse(input)
  if (result.success) return { module: result.data, success: true }

  const moduleId = readModuleId(input)
  return {
    issues: result.error.issues.map((problem) => ({
      code: 'INVALID_MANIFEST',
      message: `Module "${moduleId}" has an invalid manifest field "${formatPath(problem.path)}": ${problem.message}`,
      moduleId,
    })),
    success: false,
  }
}

function readModuleId(input: unknown): string {
  if (typeof input !== 'object' || input === null || !('id' in input)) return '<unknown>'
  return typeof input.id === 'string' && input.id.length > 0 ? input.id : '<unknown>'
}

function formatPath(path: readonly PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join('.') : '<root>'
}

function isFunction(value: unknown): boolean {
  return typeof value === 'function'
}
