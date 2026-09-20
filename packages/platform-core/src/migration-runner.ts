import type { Kysely, Transaction } from "kysely";
import {
  isMissingLifecycleStateError,
  parseLifecycleKind,
  validateDatabaseLifecyclePlan,
  verifyDatabaseLifecycleHistory,
} from "./migration-integrity.js";

export interface DatabaseMigration<TDatabase> {
  readonly checksum: string;
  readonly description: string;
  readonly id: string;
  readonly owner: string;
  apply(database: Kysely<TDatabase> | Transaction<TDatabase>): Promise<void>;
}

export interface DatabaseSeeder<TDatabase> {
  readonly checksum: string;
  readonly description: string;
  readonly id: string;
  readonly owner: string;
  seed(database: Kysely<TDatabase> | Transaction<TDatabase>): Promise<void>;
}

export interface DatabaseLifecyclePlan<TDatabase> {
  readonly moduleId: string;
  readonly migrations: readonly DatabaseMigration<TDatabase>[];
  readonly seeders: readonly DatabaseSeeder<TDatabase>[];
}

export interface DatabaseLifecycleRecord {
  readonly checksum: string;
  readonly descriptorId: string;
  readonly firstAppliedAt: string;
  readonly kind: "migration" | "seeder";
  readonly lastAppliedAt: string;
  readonly moduleId: string;
  readonly runCount: number;
  readonly sequence: number;
}

interface MigrationStateDatabase {
  platform_lifecycle_state: {
    checksum: string;
    descriptor_id: string;
    first_applied_at: string;
    kind: string;
    last_applied_at: string;
    module_id: string;
    record_key: string;
    run_count: number;
    sequence_number: number;
  };
  platform_migration_state: {
    applied_at: string;
    id: string;
    owner: string;
  };
}

type LifecycleDescriptor<TDatabase> = DatabaseMigration<TDatabase> | DatabaseSeeder<TDatabase>;
type LifecycleDatabase<TDatabase> = Kysely<TDatabase> | Transaction<TDatabase>;

export class MigrationRunner<TDatabase> {
  constructor(
    private readonly database: Kysely<TDatabase>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async run(plan: DatabaseLifecyclePlan<TDatabase>): Promise<readonly string[]> {
    validateDatabaseLifecyclePlan(plan);
    await this.ensureStateTables();
    await this.adoptLegacyMigrations(plan);
    await this.verifyRecordedHistory(plan, false);

    const records = await this.recordsFor(plan.moduleId);
    const recordedMigrations = new Set(
      records.filter((record) => record.kind === "migration").map((record) => record.descriptorId),
    );
    const executed: string[] = [];
    for (const [sequence, migration] of plan.migrations.entries()) {
      if (recordedMigrations.has(migration.id)) continue;
      await this.applyMigration(plan.moduleId, migration, sequence);
      executed.push(migration.id);
    }
    for (const [sequence, seeder] of plan.seeders.entries()) {
      await this.applySeeder(plan.moduleId, seeder, sequence);
    }
    return executed;
  }

  async verify(plan: DatabaseLifecyclePlan<TDatabase>): Promise<readonly DatabaseLifecycleRecord[]> {
    validateDatabaseLifecyclePlan(plan);
    try {
      return await this.verifyRecordedHistory(plan, true);
    } catch (error) {
      if (isMissingLifecycleStateError(error)) {
        throw new Error(
          `Database migrations are not prepared for ${plan.moduleId}. The lifecycle recorder is missing; run the explicit migration command before production start.`,
        );
      }
      throw error;
    }
  }

  async appliedMigrationIds(): Promise<ReadonlySet<string>> {
    await this.ensureStateTables();
    const records = await this.stateDatabase().selectFrom("platform_migration_state").select("id").execute();
    return new Set(records.map((record) => record.id));
  }

  async assertApplied(plan: DatabaseLifecyclePlan<TDatabase>): Promise<void> {
    await this.verify(plan);
  }

  private async applyMigration(
    moduleId: string,
    migration: DatabaseMigration<TDatabase>,
    sequence: number,
  ): Promise<void> {
    await this.database.transaction().execute(async (transaction) => {
      await migration.apply(transaction);
      const appliedAt = this.now().toISOString();
      await transaction
        .insertInto("platform_migration_state" as never)
        .values({ applied_at: appliedAt, id: migration.id, owner: migration.owner } as never)
        .execute();
      await this.insertLifecycleRecord(transaction, moduleId, "migration", migration, sequence, appliedAt);
    });
  }

  private async applySeeder(moduleId: string, seeder: DatabaseSeeder<TDatabase>, sequence: number): Promise<void> {
    const existing = await this.record(moduleId, "seeder", seeder.id);
    await this.database.transaction().execute(async (transaction) => {
      await seeder.seed(transaction);
      const appliedAt = this.now().toISOString();
      if (existing) {
        await (transaction as unknown as Kysely<MigrationStateDatabase>)
          .updateTable("platform_lifecycle_state")
          .set({ last_applied_at: appliedAt, run_count: existing.runCount + 1 })
          .where("record_key", "=", recordKey(moduleId, "seeder", seeder.id))
          .execute();
      } else {
        await this.insertLifecycleRecord(transaction, moduleId, "seeder", seeder, sequence, appliedAt);
      }
    });
  }

  private async adoptLegacyMigrations(plan: DatabaseLifecyclePlan<TDatabase>): Promise<void> {
    const state = this.stateDatabase();
    const recorded = new Set((await this.recordsFor(plan.moduleId)).map((record) => record.descriptorId));
    const legacy = await state
      .selectFrom("platform_migration_state")
      .select(["id", "owner", "applied_at"])
      .where("owner", "=", plan.moduleId)
      .orderBy("applied_at")
      .orderBy("id")
      .execute();
    for (const [sequence, record] of legacy.entries()) {
      if (plan.migrations[sequence]?.id !== record.id) {
        throw new Error(`${plan.moduleId} legacy migration history changed at sequence ${sequence}.`);
      }
    }
    const legacyById = new Map(legacy.map((record) => [record.id, record]));
    for (const [sequence, migration] of plan.migrations.entries()) {
      const record = legacyById.get(migration.id);
      if (!record || recorded.has(migration.id)) continue;
      await this.insertLifecycleRecord(
        this.database,
        plan.moduleId,
        "migration",
        migration,
        sequence,
        record.applied_at,
      );
    }
  }

  private async verifyRecordedHistory(
    plan: DatabaseLifecyclePlan<TDatabase>,
    requireComplete: boolean,
  ): Promise<readonly DatabaseLifecycleRecord[]> {
    const records = await this.recordsFor(plan.moduleId);
    verifyDatabaseLifecycleHistory(plan, records, requireComplete);
    return records;
  }

  private async recordsFor(moduleId: string): Promise<readonly DatabaseLifecycleRecord[]> {
    const rows = await this.stateDatabase()
      .selectFrom("platform_lifecycle_state")
      .selectAll()
      .where("module_id", "=", moduleId)
      .orderBy("kind")
      .orderBy("sequence_number")
      .execute();
    return rows.map((row) => ({
      checksum: row.checksum,
      descriptorId: row.descriptor_id,
      firstAppliedAt: row.first_applied_at,
      kind: parseLifecycleKind(row.kind),
      lastAppliedAt: row.last_applied_at,
      moduleId: row.module_id,
      runCount: row.run_count,
      sequence: row.sequence_number,
    }));
  }

  private async record(
    moduleId: string,
    kind: DatabaseLifecycleRecord["kind"],
    descriptorId: string,
  ): Promise<DatabaseLifecycleRecord | undefined> {
    return (await this.recordsFor(moduleId)).find(
      (record) => record.kind === kind && record.descriptorId === descriptorId,
    );
  }

  private async insertLifecycleRecord(
    database: LifecycleDatabase<TDatabase>,
    moduleId: string,
    kind: DatabaseLifecycleRecord["kind"],
    descriptor: LifecycleDescriptor<TDatabase>,
    sequence: number,
    appliedAt: string,
  ): Promise<void> {
    await (database as unknown as Kysely<MigrationStateDatabase>)
      .insertInto("platform_lifecycle_state")
      .values({
        checksum: descriptor.checksum,
        descriptor_id: descriptor.id,
        first_applied_at: appliedAt,
        kind,
        last_applied_at: appliedAt,
        module_id: moduleId,
        record_key: recordKey(moduleId, kind, descriptor.id),
        run_count: 1,
        sequence_number: sequence,
      })
      .execute();
  }

  private async ensureStateTables(): Promise<void> {
    await this.database.schema
      .createTable("platform_migration_state")
      .ifNotExists()
      .addColumn("id", "varchar(160)", (column) => column.primaryKey())
      .addColumn("owner", "varchar(160)", (column) => column.notNull())
      .addColumn("applied_at", "varchar(40)", (column) => column.notNull())
      .execute();
    await this.database.schema
      .createTable("platform_lifecycle_state")
      .ifNotExists()
      .addColumn("record_key", "varchar(360)", (column) => column.primaryKey())
      .addColumn("module_id", "varchar(160)", (column) => column.notNull())
      .addColumn("kind", "varchar(16)", (column) => column.notNull())
      .addColumn("descriptor_id", "varchar(160)", (column) => column.notNull())
      .addColumn("sequence_number", "integer", (column) => column.notNull())
      .addColumn("checksum", "varchar(64)", (column) => column.notNull())
      .addColumn("first_applied_at", "varchar(40)", (column) => column.notNull())
      .addColumn("last_applied_at", "varchar(40)", (column) => column.notNull())
      .addColumn("run_count", "integer", (column) => column.notNull())
      .addUniqueConstraint("platform_lifecycle_module_kind_sequence_key", ["module_id", "kind", "sequence_number"])
      .execute();
  }

  private stateDatabase(): Kysely<MigrationStateDatabase> {
    return this.database as unknown as Kysely<MigrationStateDatabase>;
  }
}

function recordKey(moduleId: string, kind: DatabaseLifecycleRecord["kind"], descriptorId: string): string {
  return `${moduleId}:${kind}:${descriptorId}`;
}
