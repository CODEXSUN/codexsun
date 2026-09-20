import { createHash } from "node:crypto";
import type {
  DatabaseLifecyclePlan,
  DatabaseLifecycleRecord,
  DatabaseMigration,
  DatabaseSeeder,
} from "./migration-runner.js";

type LifecycleDescriptor<TDatabase> = DatabaseMigration<TDatabase> | DatabaseSeeder<TDatabase>;

export function createLifecycleChecksum(definition: string): string {
  const normalized = definition.trim().replace(/\r\n/gu, "\n");
  if (!normalized) throw new Error("Lifecycle checksum definition is required.");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function validateDatabaseLifecyclePlan<TDatabase>(plan: DatabaseLifecyclePlan<TDatabase>): void {
  const owner = requireValue(plan.moduleId, "Migration plan requires a module ID.");
  validateDescriptors("migration", owner, plan.migrations);
  validateDescriptors("seeder", owner, plan.seeders);
}

export function verifyDatabaseLifecycleHistory<TDatabase>(
  plan: DatabaseLifecyclePlan<TDatabase>,
  records: readonly DatabaseLifecycleRecord[],
  requireComplete: boolean,
): void {
  verifyDescriptorHistory(plan.moduleId, "migration", plan.migrations, records, requireComplete);
  verifyDescriptorHistory(plan.moduleId, "seeder", plan.seeders, records, requireComplete);
}

export function parseLifecycleKind(value: string): DatabaseLifecycleRecord["kind"] {
  if (value === "migration" || value === "seeder") return value;
  throw new Error(`Unknown lifecycle record kind: ${value}.`);
}

export function isMissingLifecycleStateError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("platform_lifecycle_state") &&
    (message.includes("no such table") || message.includes("doesn't exist"))
  );
}

function validateDescriptors<TDatabase>(
  kind: DatabaseLifecycleRecord["kind"],
  owner: string,
  descriptors: readonly LifecycleDescriptor<TDatabase>[],
): void {
  const ids = new Set<string>();
  for (const descriptor of descriptors) {
    const id = requireValue(descriptor.id, `Module ${owner} has a ${kind} without an ID.`);
    requireValue(descriptor.description, `Module ${owner} ${kind} ${id} requires a description.`);
    if (!/^[a-f0-9]{64}$/u.test(descriptor.checksum)) {
      throw new Error(`Module ${owner} ${kind} ${id} requires a SHA-256 checksum.`);
    }
    if (descriptor.owner !== owner) throw new Error(`Module ${owner} cannot run ${kind} owned by ${descriptor.owner}.`);
    if (ids.has(id)) throw new Error(`Module ${owner} declares duplicate ${kind}: ${id}.`);
    ids.add(id);
  }
}

function verifyDescriptorHistory<TDatabase>(
  moduleId: string,
  kind: DatabaseLifecycleRecord["kind"],
  descriptors: readonly LifecycleDescriptor<TDatabase>[],
  records: readonly DatabaseLifecycleRecord[],
  requireComplete: boolean,
): void {
  const history = records.filter((record) => record.kind === kind);
  if (history.length > descriptors.length)
    throw new Error(`${moduleId} has recorded ${kind} entries missing from code.`);
  for (const [sequence, record] of history.entries()) {
    const descriptor = descriptors[sequence];
    if (!descriptor || record.sequence !== sequence || record.descriptorId !== descriptor.id) {
      throw new Error(`${moduleId} ${kind} history changed at sequence ${sequence}. Append a new descriptor instead.`);
    }
    if (record.checksum !== descriptor.checksum) {
      throw new Error(`${moduleId} ${kind} ${descriptor.id} checksum changed. Applied lifecycle files are immutable.`);
    }
  }
  if (requireComplete && history.length !== descriptors.length) {
    const missing = descriptors.slice(history.length).map((descriptor) => descriptor.id);
    throw new Error(`Database ${kind} entries are missing for ${moduleId}: ${missing.join(", ")}.`);
  }
}

function requireValue(value: string, message: string): string {
  if (!value.trim()) throw new Error(message);
  return value;
}
