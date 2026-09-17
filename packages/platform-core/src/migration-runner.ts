import type { Kysely } from "kysely";

export interface DatabaseMigration<TDatabase> {
  readonly id: string;
  readonly owner: string;
  readonly description?: string;
  apply(database: Kysely<TDatabase>): Promise<void>;
}

export interface DatabaseSeeder<TDatabase> {
  readonly id: string;
  readonly owner: string;
  seed(database: Kysely<TDatabase>): Promise<void>;
}

export interface DatabaseLifecyclePlan<TDatabase> {
  readonly moduleId: string;
  readonly migrations: readonly DatabaseMigration<TDatabase>[];
  readonly seeders: readonly DatabaseSeeder<TDatabase>[];
}

interface MigrationStateDatabase {
  platform_migration_state: {
    id: string;
    owner: string;
    applied_at: string;
  };
}

export class MigrationRunner<TDatabase> {
  constructor(
    private readonly database: Kysely<TDatabase>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async run(plan: DatabaseLifecyclePlan<TDatabase>): Promise<readonly string[]> {
    validatePlan(plan);
    await this.ensureStateTable();
    const applied = await this.appliedMigrationIds();
    const executed: string[] = [];
    for (const migration of plan.migrations) {
      if (applied.has(migration.id)) continue;
      await this.applyMigration(migration);
      executed.push(migration.id);
    }
    for (const seeder of plan.seeders) await seeder.seed(this.database);
    return executed;
  }

  async appliedMigrationIds(): Promise<ReadonlySet<string>> {
    await this.ensureStateTable();
    const records = await this.stateDatabase().selectFrom("platform_migration_state").select("id").execute();
    return new Set(records.map((record) => record.id));
  }

  private async applyMigration(migration: DatabaseMigration<TDatabase>): Promise<void> {
    await this.database.transaction().execute(async (transaction) => {
      await migration.apply(transaction);
      await transaction
        .insertInto("platform_migration_state" as never)
        .values({ id: migration.id, owner: migration.owner, applied_at: this.now().toISOString() } as never)
        .execute();
    });
  }

  private async ensureStateTable(): Promise<void> {
    await this.database.schema
      .createTable("platform_migration_state")
      .ifNotExists()
      .addColumn("id", "varchar(160)", (column) => column.primaryKey())
      .addColumn("owner", "varchar(160)", (column) => column.notNull())
      .addColumn("applied_at", "varchar(40)", (column) => column.notNull())
      .execute();
  }

  private stateDatabase(): Kysely<MigrationStateDatabase> {
    return this.database as unknown as Kysely<MigrationStateDatabase>;
  }
}

function validatePlan<TDatabase>(plan: DatabaseLifecyclePlan<TDatabase>): void {
  const owner = requireValue(plan.moduleId, "Migration plan requires a module ID.");
  validateDescriptors("migration", owner, plan.migrations);
  validateDescriptors("seeder", owner, plan.seeders);
}

function validateDescriptors<TDatabase>(
  kind: "migration" | "seeder",
  owner: string,
  descriptors: readonly (DatabaseMigration<TDatabase> | DatabaseSeeder<TDatabase>)[],
): void {
  const ids = new Set<string>();
  for (const descriptor of descriptors) {
    const id = requireValue(descriptor.id, `Module ${owner} has a ${kind} without an ID.`);
    if (descriptor.owner !== owner) throw new Error(`Module ${owner} cannot run ${kind} owned by ${descriptor.owner}.`);
    if (ids.has(id)) throw new Error(`Module ${owner} declares duplicate ${kind}: ${id}.`);
    ids.add(id);
  }
}

function requireValue(value: string, message: string): string {
  if (!value.trim()) throw new Error(message);
  return value;
}
