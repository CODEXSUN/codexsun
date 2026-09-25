import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeDocumentsDatabase } from "./documents.database.js";
const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.documents.001|documents,printer-profiles,printer-routes,print-jobs,print-attempts|business,location,document,printer foreign keys|durable document before queue",
  ),
  description: "Create Q Cafe documents, printer profiles, routes, jobs, and attempts.",
  id: "qcafe.documents.001",
  owner: "qcafe.documents",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeDocumentsDatabase>;
    await db.schema
      .createTable("qcafe_documents")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("kind", "varchar(16)", (c) => c.notNull())
      .addColumn("title", "varchar(200)", (c) => c.notNull())
      .addColumn("storage_object_ref", "varchar(240)")
      .addColumn("checksum", "varchar(128)")
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_printer_profiles")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("kind", "varchar(16)", (c) => c.notNull())
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("config_ref", "varchar(160)")
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_printer_profiles_location_code_key", ["location_id", "code"])
      .execute();
    await db.schema
      .createTable("qcafe_printer_routes")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("document_kind", "varchar(16)", (c) => c.notNull())
      .addColumn("printer_profile_id", "varchar(36)", (c) => c.notNull().references("qcafe_printer_profiles.id"))
      .addColumn("priority", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("fallback_profile_id", "varchar(36)", (c) => c.references("qcafe_printer_profiles.id"))
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_print_jobs")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("document_id", "varchar(36)", (c) => c.notNull().references("qcafe_documents.id"))
      .addColumn("printer_profile_id", "varchar(36)", (c) => c.notNull().references("qcafe_printer_profiles.id"))
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("attempt_count", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_print_attempts")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("job_id", "varchar(36)", (c) => c.notNull().references("qcafe_print_jobs.id"))
      .addColumn("attempt_number", "integer", (c) => c.notNull())
      .addColumn("route_ref", "varchar(160)")
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("error", "varchar(500)")
      .addColumn("requested_by", "varchar(120)", (c) => c.notNull())
      .addColumn("requested_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const previewMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.documents.002|print-previews|job foreign key|operator confirms before attempt starts",
  ),
  description: "Create Q Cafe print preview confirmations.",
  id: "qcafe.documents.002",
  owner: "qcafe.documents",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeDocumentsDatabase>;
    await db.schema
      .createTable("qcafe_print_previews")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("job_id", "varchar(36)", (c) => c.notNull().references("qcafe_print_jobs.id"))
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("requested_by", "varchar(120)", (c) => c.notNull())
      .addColumn("requested_at", "varchar(40)", (c) => c.notNull())
      .addColumn("confirmed_by", "varchar(120)")
      .addColumn("confirmed_at", "varchar(40)")
      .execute();
  },
};

export const idempotencyMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.documents.003|print-jobs idempotency key|unique per location|direct service replay returns existing job",
  ),
  description: "Add idempotency keys to Q Cafe print jobs for direct service retries.",
  id: "qcafe.documents.003",
  owner: "qcafe.documents",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeDocumentsDatabase>;
    await db.schema.alterTable("qcafe_print_jobs").addColumn("idempotency_key", "varchar(120)").execute();
    await db.schema
      .createIndex("qcafe_print_jobs_location_key_unique")
      .unique()
      .on("qcafe_print_jobs")
      .columns(["location_id", "idempotency_key"])
      .execute();
  },
};

export const adapterDispatchMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.documents.004|print-dispatches|job foreign key|adapter availability and fallback evidence",
  ),
  description: "Create Q Cafe print dispatch decisions.",
  id: "qcafe.documents.004",
  owner: "qcafe.documents",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeDocumentsDatabase>;
    await db.schema
      .createTable("qcafe_print_dispatches")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("job_id", "varchar(36)", (c) => c.notNull().references("qcafe_print_jobs.id"))
      .addColumn("adapter_kind", "varchar(16)", (c) => c.notNull())
      .addColumn("endpoint_ref", "varchar(160)")
      .addColumn("decision", "varchar(16)", (c) => c.notNull())
      .addColumn("detail", "varchar(500)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const deliveryMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.documents.005|delivery-consents,deliveries|business,location,document,consent foreign keys|rendered document, consent, provider reference",
  ),
  description: "Create Q Cafe delivery consents and channel deliveries.",
  id: "qcafe.documents.005",
  owner: "qcafe.documents",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeDocumentsDatabase>;
    await db.schema
      .createTable("qcafe_delivery_consents")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("customer_ref", "varchar(160)", (c) => c.notNull())
      .addColumn("channel", "varchar(16)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("granted_at", "varchar(40)", (c) => c.notNull())
      .addColumn("revoked_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_delivery_consents_customer_channel_key", ["location_id", "customer_ref", "channel"])
      .execute();
    await db.schema
      .createTable("qcafe_deliveries")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("document_id", "varchar(36)", (c) => c.notNull().references("qcafe_documents.id"))
      .addColumn("consent_id", "varchar(36)", (c) => c.notNull().references("qcafe_delivery_consents.id"))
      .addColumn("channel", "varchar(16)", (c) => c.notNull())
      .addColumn("destination", "varchar(200)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("provider_reference", "varchar(160)")
      .addColumn("error", "varchar(500)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const qcafeDocumentsLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration, previewMigration, idempotencyMigration, adapterDispatchMigration, deliveryMigration],
  moduleId: "qcafe.documents",
  seeders: [],
};
