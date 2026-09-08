import type { FrameworkModule } from './module-contracts.js'
import { ModuleCompositionError } from './module-errors.js'
import { parseModuleShape } from './module-schema.js'
import { validateModuleManifest } from './module-validation.js'

export function parseModuleManifest(input: unknown): FrameworkModule {
  const shape = parseModuleShape(input)
  if (!shape.success) throw new ModuleCompositionError(shape.issues)

  const issues = validateModuleManifest(shape.module)
  if (issues.length > 0) throw new ModuleCompositionError(issues)
  return shape.module
}
