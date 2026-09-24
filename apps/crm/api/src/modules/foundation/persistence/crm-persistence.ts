import {
  createLifecycleChecksum,
  createSqliteDataProvider,
  MigrationRunner,
  type DatabaseLifecyclePlan,
  type DatabaseLifecycleRecord,
  type KyselyDataProvider,
} from "@codexsun/platform-core";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Kysely } from "kysely";
import type { CrmDatabase } from "./crm-database.js";

export interface CrmPersistenceConfiguration {
  readonly localDatabasePath: string;
}

export class CrmPersistence {
  constructor(
    readonly configuration: CrmPersistenceConfiguration,
    private readonly provider: KyselyDataProvider<CrmDatabase>,
  ) {}

  async initialize(): Promise<readonly string[]> {
    return new MigrationRunner(this.database()).run(crmFoundationLifecyclePlan);
  }

  async verify(): Promise<readonly DatabaseLifecycleRecord[]> {
    return new MigrationRunner(this.database()).verify(crmFoundationLifecyclePlan);
  }

  database(): Kysely<CrmDatabase> {
    return this.provider.queryDatabase();
  }

  async destroy(): Promise<void> {
    await this.provider.destroy();
  }
}

export function createCrmPersistence(configuration: CrmPersistenceConfiguration): CrmPersistence {
  mkdirSync(dirname(configuration.localDatabasePath), { recursive: true });
  return new CrmPersistence(
    configuration,
    createSqliteDataProvider<CrmDatabase>({ filename: configuration.localDatabasePath }),
  );
}

const crmFoundationMigration = {
  checksum: createLifecycleChecksum(
    "crm.foundation.001|foundation metadata|campaign account lead enquiry activity assignment work collection verification",
  ),
  description: "Create the CRM foundation and first sales service workflow tables.",
  id: "crm.foundation.001",
  owner: "crm.foundation",
  async apply(database: Kysely<CrmDatabase>): Promise<void> {
    await database.schema
      .createTable("crm_foundation_metadata")
      .ifNotExists()
      .addColumn("key", "varchar(120)", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();
    await createCampaignTable(database);
    await createAccountTable(database);
    await createLeadTable(database);
    await createEnquiryTable(database);
    await createActivityTable(database);
    await createAssignmentTable(database);
    await createWorkOrderTable(database);
    await createCollectionTable(database);
    await createVerificationTable(database);
  },
};

const crmFoundationSeeder = {
  checksum: createLifecycleChecksum("crm.foundation.seed.001|crm_foundation_metadata|foundation.status=ready"),
  description: "Record CRM foundation readiness.",
  id: "crm.foundation.seed.001",
  owner: "crm.foundation",
  async seed(database: Kysely<CrmDatabase>): Promise<void> {
    const existing = await database
      .selectFrom("crm_foundation_metadata")
      .select("key")
      .where("key", "=", "foundation.status")
      .executeTakeFirst();
    if (existing) return;
    await database
      .insertInto("crm_foundation_metadata")
      .values({ key: "foundation.status", value: "ready", updated_at: new Date().toISOString() })
      .execute();
  },
};

const crmCustomer360Migration = {
  checksum: createLifecycleChecksum(
    "crm.foundation.002|customer 360|contacts addresses consents lead qualification conversion",
  ),
  description: "Add customer 360 records and lead qualification fields.",
  id: "crm.foundation.002",
  owner: "crm.foundation",
  async apply(database: Kysely<CrmDatabase>): Promise<void> {
    await database.schema
      .alterTable("crm_leads")
      .addColumn("qualification_note", "text")
      .execute();
    await database.schema
      .alterTable("crm_leads")
      .addColumn("qualified_at", "varchar(40)")
      .execute();
    await database.schema
      .alterTable("crm_leads")
      .addColumn("converted_enquiry_id", "varchar(36)")
      .execute();
    await createContactTable(database);
    await createAddressTable(database);
    await createConsentTable(database);
    await createCommunicationTable(database);
  },
};

export const crmFoundationLifecyclePlan: DatabaseLifecyclePlan<CrmDatabase> = {
  moduleId: "crm.foundation",
  migrations: [crmFoundationMigration, crmCustomer360Migration],
  seeders: [crmFoundationSeeder],
};

async function createCampaignTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_campaigns").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("name", "varchar(160)", (column) => column.notNull()).addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("source", "varchar(80)").addColumn("owner_actor_id", "varchar(120)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createAccountTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_accounts").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("name", "varchar(160)", (column) => column.notNull()).addColumn("kind", "varchar(24)", (column) => column.notNull()).addColumn("primary_phone", "varchar(40)").addColumn("primary_email", "varchar(160)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createLeadTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_leads").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("campaign_id", "varchar(36)").addColumn("account_id", "varchar(36)").addColumn("name", "varchar(160)", (column) => column.notNull()).addColumn("phone", "varchar(40)").addColumn("email", "varchar(160)").addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("score", "integer", (column) => column.notNull()).addColumn("owner_actor_id", "varchar(120)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createContactTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema
    .createTable("crm_contacts")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("account_id", "varchar(36)", (column) => column.notNull())
    .addColumn("name", "varchar(160)", (column) => column.notNull())
    .addColumn("phone", "varchar(40)")
    .addColumn("email", "varchar(160)")
    .addColumn("role", "varchar(80)")
    .addColumn("is_primary", "integer", (column) => column.notNull().defaultTo(0))
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute();
}

async function createAddressTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema
    .createTable("crm_addresses")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("account_id", "varchar(36)", (column) => column.notNull())
    .addColumn("label", "varchar(80)", (column) => column.notNull())
    .addColumn("address_text", "text", (column) => column.notNull())
    .addColumn("latitude", "real")
    .addColumn("longitude", "real")
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute();
}

async function createConsentTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema
    .createTable("crm_consents")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("account_id", "varchar(36)", (column) => column.notNull())
    .addColumn("channel", "varchar(24)", (column) => column.notNull())
    .addColumn("status", "varchar(24)", (column) => column.notNull())
    .addColumn("captured_at", "varchar(40)", (column) => column.notNull())
    .addColumn("captured_by_actor_id", "varchar(120)")
    .execute();
}

async function createCommunicationTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema
    .createTable("crm_communications")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("enquiry_id", "varchar(36)")
    .addColumn("account_id", "varchar(36)")
    .addColumn("channel", "varchar(24)", (column) => column.notNull())
    .addColumn("direction", "varchar(16)", (column) => column.notNull())
    .addColumn("subject", "varchar(200)")
    .addColumn("body", "text")
    .addColumn("status", "varchar(24)", (column) => column.notNull())
    .addColumn("actor_id", "varchar(120)")
    .addColumn("occurred_at", "varchar(40)", (column) => column.notNull())
    .execute();
}

async function createEnquiryTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_enquiries").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("lead_id", "varchar(36)").addColumn("account_id", "varchar(36)").addColumn("subject", "varchar(200)", (column) => column.notNull()).addColumn("description", "text").addColumn("priority", "varchar(16)", (column) => column.notNull()).addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("owner_actor_id", "varchar(120)").addColumn("due_at", "varchar(40)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createActivityTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_activities").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("enquiry_id", "varchar(36)").addColumn("kind", "varchar(24)", (column) => column.notNull()).addColumn("subject", "varchar(200)", (column) => column.notNull()).addColumn("body", "text").addColumn("actor_id", "varchar(120)").addColumn("occurred_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createAssignmentTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_assignments").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("enquiry_id", "varchar(36)", (column) => column.notNull()).addColumn("assigner_actor_id", "varchar(120)", (column) => column.notNull()).addColumn("assignee_actor_id", "varchar(120)").addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("due_at", "varchar(40)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createWorkOrderTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_work_orders").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("enquiry_id", "varchar(36)", (column) => column.notNull()).addColumn("assignment_id", "varchar(36)").addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("scheduled_start_at", "varchar(40)").addColumn("scheduled_end_at", "varchar(40)").addColumn("check_in_at", "varchar(40)").addColumn("check_out_at", "varchar(40)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createCollectionTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_collection_plans").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("enquiry_id", "varchar(36)", (column) => column.notNull()).addColumn("expected_amount", "real", (column) => column.notNull()).addColumn("currency", "varchar(3)", (column) => column.notNull()).addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("due_at", "varchar(40)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}

async function createVerificationTable(database: Kysely<CrmDatabase>): Promise<void> {
  await database.schema.createTable("crm_verifications").ifNotExists().addColumn("id", "varchar(36)", (column) => column.primaryKey()).addColumn("enquiry_id", "varchar(36)", (column) => column.notNull()).addColumn("status", "varchar(24)", (column) => column.notNull()).addColumn("verifier_actor_id", "varchar(120)").addColumn("outcome_note", "text").addColumn("verified_at", "varchar(40)").addColumn("created_at", "varchar(40)", (column) => column.notNull()).addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
}
