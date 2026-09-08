import { z } from 'zod'

const identifierSchema = z.string().regex(/^[a-z][a-z0-9-]*$/)
const workspaceSchema = z.string().regex(/^@codexsun\/[a-z0-9-]+$/)
const relativePathSchema = z.string().min(1).refine(isSafeRelativePath, 'Use a safe relative path.')

export const runtimePackageSchema = z.strictObject({
  id: workspaceSchema,
  version: z.string().min(1),
})

export const runtimeBindingSchema = z.strictObject({
  id: workspaceSchema,
  versionRange: z.string().min(1),
})

export const deploymentComponentSchema = z.strictObject({
  buildWorkspaces: z.array(workspaceSchema).min(1),
  defaultPort: z.number().int().min(6000).max(6999),
  dependsOn: z.array(identifierSchema),
  healthPath: z.string().startsWith('/'),
  hostEnvironmentKey: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/)
    .optional(),
  id: identifierSchema,
  kind: z.enum(['api', 'web', 'worker']),
  outputPath: relativePathSchema,
  portEnvironmentKey: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  runtime: z.enum(['node', 'static']),
  startFile: relativePathSchema.optional(),
  workspace: workspaceSchema,
})

export const deploymentApplicationSchema = z.strictObject({
  components: z.array(deploymentComponentSchema).min(1),
  id: identifierSchema,
  requires: z.array(identifierSchema),
  runtimeBindings: z.array(runtimeBindingSchema).min(1),
  version: z.string().min(1),
})

export const deploymentAddonSchema = z.strictObject({
  componentIds: z.array(identifierSchema).min(1),
  id: identifierSchema,
  requires: z.array(identifierSchema),
  runtimeBindings: z.array(runtimeBindingSchema).min(1),
  targetApplication: identifierSchema,
  version: z.string().min(1),
  workspace: workspaceSchema,
})

export const deploymentCatalogSchema = z.strictObject({
  addons: z.array(deploymentAddonSchema),
  applications: z.array(deploymentApplicationSchema).min(1),
  runtimePackages: z.array(runtimePackageSchema).min(1),
  schemaVersion: z.literal(1),
})

export const deploymentProfileSchema = z.strictObject({
  addons: z.array(identifierSchema),
  applications: z.array(identifierSchema).min(1),
  buildEnvironment: z.record(z.string().regex(/^[A-Z][A-Z0-9_]*$/), z.string()),
  customer: z.string().min(1),
  environment: z.enum(['development', 'production']),
  id: identifierSchema,
  portOverrides: z.record(identifierSchema, z.number().int().min(6000).max(6999)).default({}),
  schemaVersion: z.literal(1),
  version: z.string().min(1),
})

export type DeploymentAddon = z.infer<typeof deploymentAddonSchema>
export type DeploymentApplication = z.infer<typeof deploymentApplicationSchema>
export type DeploymentCatalog = z.infer<typeof deploymentCatalogSchema>
export type DeploymentComponent = z.infer<typeof deploymentComponentSchema>
export type DeploymentProfile = z.infer<typeof deploymentProfileSchema>
export type RuntimeBinding = z.infer<typeof runtimeBindingSchema>

function isSafeRelativePath(value: string): boolean {
  return !value.startsWith('/') && !value.includes('..') && !value.includes('\\')
}
