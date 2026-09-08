import type { FrameworkModule } from '@codexsun/framework'
import type { PlatformApiModule } from '@codexsun/platform-core-api'
import type { Database } from '../../database.js'
import { moduleRuntimeMigrations } from './module-runtime.migrations.js'
import { moduleRuntimeSeeds } from './module-runtime.seeds.js'

export const moduleRuntimeManifest: FrameworkModule = {
  capabilities: ['module-runtime.migrate', 'module-runtime.state.read'],
  configuration: [
    { key: 'DATABASE_HOST', required: true },
    { key: 'DATABASE_NAME', required: true },
    { key: 'DATABASE_USER', required: true },
  ],
  consumes: [],
  dependencies: [],
  description: 'Owns durable Platform module state, migrations, and seed execution.',
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
  version: '1.0.0',
}

export const moduleRuntimeApiModule: PlatformApiModule<Database> = {
  createPlugin: () => async () => {},
  manifest: moduleRuntimeManifest,
  migrations: moduleRuntimeMigrations,
  seeds: moduleRuntimeSeeds,
}
