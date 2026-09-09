import type { FrameworkModule } from '@codexsun/framework'
import type { PlatformActor, PlatformApiModule } from '@codexsun/platform-core-api'
import type { FastifyRequest } from 'fastify'
import type { Environment } from '../../config.js'
import type { Database } from '../../database.js'
import { IdentityAuthorizer, IdentityService } from './application/identity.service.js'
import { ArgonIdentityPasswordHasher } from './infrastructure/identity.password.js'
import { MariaDbIdentityRepository } from './infrastructure/identity.repository.js'
import { identityMigrations } from './infrastructure/identity.migrations.js'
import { identitySchema } from './infrastructure/identity.schema.js'
import { createIdentitySeeds } from './infrastructure/identity.seeds.js'
import { identityCookieName, registerIdentityRoutes } from './presentation/identity.routes.js'

export interface IdentityRuntime {
  authorizer: IdentityAuthorizer
  module: PlatformApiModule<Database, Database>
  resolveActor(request: FastifyRequest): Promise<PlatformActor>
}

export function createIdentityRuntime(
  database: Database,
  environment: Environment,
): IdentityRuntime {
  const passwords = new ArgonIdentityPasswordHasher()
  const service = new IdentityService(new MariaDbIdentityRepository(database), passwords, {
    clock: () => new Date(),
    createId: () => crypto.randomUUID(),
    sessionRenewalHours: environment.IDENTITY_SESSION_RENEWAL_HOURS,
    sessionTtlHours: environment.IDENTITY_SESSION_TTL_HOURS,
  })

  return {
    authorizer: new IdentityAuthorizer(service),
    module: {
      createPlugin: () => async (server) => registerIdentityRoutes(server, service, environment),
      manifest: identityManifest,
      migrations: identityMigrations,
      schema: identitySchema,
      seeds: createIdentitySeeds(environment, passwords),
    },
    async resolveActor(request) {
      for (const portal of ['super-admin', 'administrator', 'regular'] as const) {
        const session = await service.resolveSession(
          portal,
          request.cookies[identityCookieName(portal)],
        )
        if (session) return { id: session.user.id, kind: 'user' }
      }
      return { kind: 'anonymous' }
    },
  }
}

export const identityManifest: FrameworkModule = {
  capabilities: ['identity.authenticate', 'identity.authorize', 'identity.session.manage'],
  configuration: [
    { key: 'IDENTITY_SESSION_TTL_HOURS', required: true },
    { key: 'IDENTITY_SUPER_ADMIN_EMAIL', required: true },
    { key: 'IDENTITY_SUPER_ADMIN_PASSWORD', required: true },
  ],
  consumes: [],
  dependencies: [{ id: 'module-runtime', versionRange: '^1.1.0' }],
  description: 'Owns users, credentials, portal sessions, roles, and permissions.',
  dataSchema: { checksum: identitySchema.checksum, version: identitySchema.version },
  extensionPoints: [],
  extensions: [],
  id: 'identity',
  kind: 'feature',
  lifecycle: { activate() {}, deactivate() {}, install() {}, uninstall() {}, upgrade() {} },
  owner: 'platform',
  platformVersionRange: '^0.1.0',
  publicContracts: [{ id: 'identity.sessions', version: '1.0.0' }],
  publishes: [],
  scope: 'platform',
  version: '1.0.0',
}
