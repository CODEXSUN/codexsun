import type {
  AppliedModuleDataRecord,
  DurableModuleRecord,
  ModuleRuntimeRepository,
} from './module-runtime.types.js'

export class MemoryModuleRuntimeRepository implements ModuleRuntimeRepository {
  private readonly migrations = new Map<string, AppliedModuleDataRecord>()
  private readonly modules = new Map<string, DurableModuleRecord>()
  private readonly seeds = new Map<string, AppliedModuleDataRecord>()

  findMigration(moduleId: string, migrationId: string) {
    return Promise.resolve(this.migrations.get(key(moduleId, migrationId)))
  }

  findSeed(moduleId: string, seedId: string) {
    return Promise.resolve(this.seeds.get(key(moduleId, seedId)))
  }

  getModule(moduleId: string) {
    return Promise.resolve(this.modules.get(moduleId))
  }

  listModules() {
    return Promise.resolve(
      [...this.modules.values()].sort((left, right) => left.moduleId.localeCompare(right.moduleId)),
    )
  }

  recordMigration(record: AppliedModuleDataRecord): Promise<void> {
    this.migrations.set(key(record.moduleId, record.id), { ...record })
    return Promise.resolve()
  }

  recordSeed(record: AppliedModuleDataRecord): Promise<void> {
    this.seeds.set(key(record.moduleId, record.id), { ...record })
    return Promise.resolve()
  }

  saveModule(record: DurableModuleRecord): Promise<void> {
    this.modules.set(record.moduleId, { ...record })
    return Promise.resolve()
  }
}

function key(moduleId: string, recordId: string): string {
  return `${moduleId}:${recordId}`
}
