import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeSyncDatabase } from "./sync.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.sync.001|device-profiles,change-log,sync-cursors,sync-conflicts|business,location,device,change foreign keys|financial conflicts never auto-resolve",
  ),
  description: "Create Q Cafe device profiles, change log, sync cursors, and conflict records.",
  id: "qcafe.sync.001",
  owner: "qcafe.sync",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeSyncDatabase>;
    await db.schema
      .createTable("qcafe_device_profiles")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("device_code", "varchar(80)", (c) => c.notNull())
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("platform", "varchar(16)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("last_seen_at", "varchar(40)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_device_profiles_business_code_key", ["business_id", "device_code"])
      .execute();
    await db.schema
      .createTable("qcafe_change_log")
      .ifNotExists()
      .addColumn("seq", "integer", (c) => c.primaryKey().autoIncrement())
      .addColumn("id", "varchar(36)", (c) => c.notNull().unique())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("device_id", "varchar(36)", (c) => c.references("qcafe_device_profiles.id"))
      .addColumn("entity_type", "varchar(60)", (c) => c.notNull())
      .addColumn("entity_id", "varchar(120)", (c) => c.notNull())
      .addColumn("change_kind", "varchar(40)", (c) => c.notNull())
      .addColumn("actor_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_sync_cursors")
      .ifNotExists()
      .addColumn("device_id", "varchar(36)", (c) => c.primaryKey().references("qcafe_device_profiles.id"))
      .addColumn("last_seq", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_sync_conflicts")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("entity_type", "varchar(60)", (c) => c.notNull())
      .addColumn("entity_id", "varchar(120)", (c) => c.notNull())
      .addColumn("local_change_id", "varchar(36)")
      .addColumn("remote_change_id", "varchar(36)")
      .addColumn("reason", "varchar(500)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("resolution", "varchar(40)")
      .addColumn("decided_by", "varchar(120)")
      .addColumn("decided_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const qcafeSyncLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration],
  moduleId: "qcafe.sync",
  seeders: [],
};
