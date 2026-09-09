export interface PlatformModuleMigration<TContext> {
  checksum: string
  id: string
  up(context: TContext): Promise<void>
  version: string
}

export interface PlatformModuleSeed<TContext> {
  checksum: string
  id: string
  run(context: TContext): Promise<void>
  version: string
}

export interface PlatformModuleSchema<TContext> {
  checksum: string
  inspect(context: TContext): Promise<string>
  version: string
}

export function validateModuleDataDeclarations(
  moduleId: string,
  migrations: readonly PlatformModuleMigration<unknown>[],
  seeds: readonly PlatformModuleSeed<unknown>[],
): void {
  validateDeclarations(moduleId, 'migration', migrations)
  validateDeclarations(moduleId, 'seed', seeds)
}

export function validateModuleSchemaDeclaration(
  moduleId: string,
  schema: PlatformModuleSchema<unknown> | undefined,
): void {
  if (!schema) return
  if (!schema.version || !/^sha256:[a-f0-9]{64}$/u.test(schema.checksum)) {
    throw new Error(`Module "${moduleId}" has an invalid schema declaration.`)
  }
}

function validateDeclarations(
  moduleId: string,
  kind: 'migration' | 'seed',
  declarations: readonly { checksum: string; id: string; version: string }[],
): void {
  const ids = new Set<string>()
  let previousId = ''
  for (const declaration of declarations) {
    if (!declaration.id || !declaration.checksum || !declaration.version) {
      throw new Error(`Module "${moduleId}" has an incomplete ${kind} declaration.`)
    }
    if (ids.has(declaration.id)) {
      throw new Error(`Module "${moduleId}" declares duplicate ${kind} "${declaration.id}".`)
    }
    if (previousId && declaration.id.localeCompare(previousId) <= 0) {
      throw new Error(`Module "${moduleId}" ${kind} declarations must use stable ID order.`)
    }
    ids.add(declaration.id)
    previousId = declaration.id
  }
}
