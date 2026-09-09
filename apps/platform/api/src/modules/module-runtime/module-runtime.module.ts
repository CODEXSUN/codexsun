import type { FrameworkModule } from '@codexsun/framework'
import type { PlatformApiModule } from '@codexsun/platform-core-api'
import type { Database } from '../../database.js'
import { moduleRuntimeMigrations } from './module-runtime.migrations.js'
import { moduleRuntimeSchema } from './module-runtime.schema.js'
import { moduleRuntimeSeeds } from './module-runtime.seeds.js'

export const moduleRuntimeManifest: FrameworkModule = {
  capabilities: ['module-runtime.migrate', 'module-runtime.state.read'],
  configuration: [
    { key: 'DB_DRIVER', required: true },
    { key: 'DB_HOST', required: true },
    { key: 'DB_MASTER_NAME', required: true },
    { key: 'DB_USER', required: true },
  ],
  consumes: [],
  dependencies: [],
  description: 'Owns durable Platform module state, migrations, and seed execution.',
  dataSchema: {
    checksum: moduleRuntimeSchema.checksum,
    version: moduleRuntimeSchema.version,
  },
  extensionPoints: [],
  extensions: [],
  id: 'module-runtime',
  kind: 'core',
  lifecycle: {
    activate() {},
    deactivate() {},
    install() {},
    uninstall() {},
    upgrade() {},
  },
  owner: 'platform',
  platformVersionRange: '^0.1.0',
  publicContracts: [{ id: 'module-runtime.state', version: '1.0.0' }],
  publishes: [{ id: 'module-runtime.module-prepared', version: '1.0.0' }],
  scope: 'platform',
  version: '1.1.0',
}

export const moduleRuntimeApiModule: PlatformApiModule<Database> = {
  createPlugin: () => async () => {},
  manifest: moduleRuntimeManifest,
  migrations: moduleRuntimeMigrations,
  schema: moduleRuntimeSchema,
  seeds: moduleRuntimeSeeds,
}
