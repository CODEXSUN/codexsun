import type { FrameworkModule } from '@codexsun/framework'
import type { PlatformApiModule } from '@codexsun/platform-core-api'
import type { Database } from '../../database.js'
import { eventRuntimeMigrations } from './event-runtime.migrations.js'
import { eventRuntimeSchema } from './event-runtime.schema.js'

export const eventRuntimeManifest: FrameworkModule = {
  capabilities: ['event-runtime.dispatch', 'event-runtime.outbox.write'],
  configuration: [
    { key: 'DB_DRIVER', required: true },
    { key: 'DB_HOST', required: true },
    { key: 'DB_MASTER_NAME', required: true },
  ],
  consumes: [],
  dataSchema: { checksum: eventRuntimeSchema.checksum, version: eventRuntimeSchema.version },
  dependencies: [{ id: 'module-runtime', versionRange: '^1.1.0' }],
  description: 'Owns durable outbox events and consumer-specific idempotent inbox delivery state.',
  extensionPoints: [],
  extensions: [],
  id: 'event-runtime',
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
  publicContracts: [{ id: 'event-runtime.durable-events', version: '1.0.0' }],
  publishes: [],
  scope: 'platform',
  version: '1.0.0',
}

export const eventRuntimeApiModule: PlatformApiModule<Database> = {
  createPlugin: () => async () => {},
  manifest: eventRuntimeManifest,
  migrations: eventRuntimeMigrations,
  schema: eventRuntimeSchema,
}
