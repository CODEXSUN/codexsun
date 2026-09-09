import type { PlatformModuleSeed } from '@codexsun/platform-core-api'
import type { Database } from '../../database.js'

export const moduleRuntimeSeeds: readonly PlatformModuleSeed<Database>[] = [
  {
    checksum: 'sha256:a735b1ec9e2131798870deedb7830b8b9aac106ec5bc5c909e67146fc2203abc',
    id: '0001-module-runtime-self-registration',
    version: '1.0.0',
    async run(database) {
      const now = new Date()
      await database
        .insertInto('platform_module_state')
        .values({
          enabled: 1,
          installed_version: '1.0.0',
          kind: 'core',
          last_failure_code: null,
          last_failure_message: null,
          manifest_checksum: 'module-runtime:1.0.0',
          module_id: 'module-runtime',
          requested_version: '1.0.0',
          runtime_state: 'installed',
          schema_checksum: null,
          updated_at: now,
        })
        .onDuplicateKeyUpdate({ updated_at: now })
        .execute()
    },
  },
]
