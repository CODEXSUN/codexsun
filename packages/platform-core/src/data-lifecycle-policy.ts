import type { MigrationDescriptor, SeederDescriptor } from "@codexsun/framework";

export type DataCompatibilityLevel = "backward-compatible" | "coordinated-release";

export interface DataCompatibilityRecord {
  readonly level: DataCompatibilityLevel;
  readonly summary: string;
  readonly rollbackLimit: string;
}

export interface ModuleDataLifecyclePlan {
  readonly moduleId: string;
  readonly migrations: readonly MigrationDescriptor[];
  readonly seeders: readonly SeederDescriptor[];
  readonly compatibility: DataCompatibilityRecord;
}

export class ModuleDataLifecyclePolicy {
  validate(plan: ModuleDataLifecyclePlan): void {
    const moduleId = requireValue(plan.moduleId, "Module data lifecycle plan requires a module ID.");
    validateOwnedDescriptors("migration", moduleId, plan.migrations);
    validateOwnedDescriptors("seeder", moduleId, plan.seeders);
    requireValue(plan.compatibility.summary, "Data compatibility summary is required.");
    requireValue(plan.compatibility.rollbackLimit, "Data compatibility rollback limit is required.");
  }
}

function validateOwnedDescriptors(
  kind: "migration" | "seeder",
  moduleId: string,
  descriptors: readonly (MigrationDescriptor | SeederDescriptor)[],
): void {
  const ids = new Set<string>();
  for (const descriptor of descriptors) {
    const id = requireValue(descriptor.id, `Module ${moduleId} has a ${kind} without an ID.`);
    if (descriptor.owner !== moduleId) {
      throw new Error(`Module ${moduleId} cannot declare ${kind} owned by ${descriptor.owner}.`);
    }
    if (ids.has(id)) throw new Error(`Module ${moduleId} declares duplicate ${kind}: ${id}.`);
    ids.add(id);
  }
}

function requireValue(value: string, message: string): string {
  if (!value.trim()) throw new Error(message);
  return value;
}
