import type { Kysely } from "kysely";
import { callLogMigrationBatch, migrateCallLogModule } from "./modules/call-log/index.js";
import { contact360MigrationBatches, migrateContact360Database } from "./contact-360.migration.js";
import {
  enquiryMigrationBatch,
  migrateCrmTenantDatabase as migrateEnquiryDatabase,
  rollbackCrmTenantDatabase as rollbackEnquiryDatabase
} from "./modules/enquiry/index.js";
import type { EnquiryDatabase } from "./modules/enquiry/index.js";
import { listinMigrationBatch, migrateListInMaster } from "./modules/list-in/index.js";
import type { ListInDatabase } from "./modules/list-in/index.js";
import { statusMigrationBatch, migrateStatusMaster } from "./modules/status/index.js";
import type { StatusDatabase } from "./modules/status/index.js";
import { priorityMigrationBatch, migratePriorityMaster } from "./modules/priority/index.js";
import type { PriorityDatabase } from "./modules/priority/index.js";
import { closureMigrationBatch, migrateClosureModule } from "./modules/closure/index.js";
import {
  enquiryLocationMigrationBatch,
  migrateEnquiryLocationModule
} from "./modules/enquiry-location/index.js";
import { sopMigrationBatch, migrateSopModule } from "./modules/sop/index.js";
import { sopItemMigrationBatch, migrateSopItemModule } from "./modules/sop-item/index.js";
import {
  dutyAssignmentMigrationBatch,
  migrateDutyAssignmentModule
} from "./modules/duty-assignment/index.js";
import { dutyReportMigrationBatch, migrateDutyReportModule } from "./modules/duty-report/index.js";
import { frappeSyncMigrationBatch, migrateFrappeSyncModule } from "./modules/frappe-sync/index.js";
import { taskMigrationBatch, migrateTaskModule } from "./modules/task/index.js";

const batches = [
  listinMigrationBatch,
  statusMigrationBatch,
  priorityMigrationBatch,
  enquiryMigrationBatch,
  closureMigrationBatch,
  enquiryLocationMigrationBatch,
  callLogMigrationBatch,
  ...contact360MigrationBatches,
  sopMigrationBatch,
  sopItemMigrationBatch,
  dutyAssignmentMigrationBatch,
  dutyReportMigrationBatch,
  frappeSyncMigrationBatch,
  taskMigrationBatch
];

export const crmTenantMigrations = batches.flatMap((batch) =>
  batch.steps.map(({ description, name }) => ({ description, name }))
);

export async function migrateCrmTenantDatabase(database: Kysely<EnquiryDatabase>) {
  await migrateListInMaster(database as unknown as Kysely<ListInDatabase>);
  await migrateStatusMaster(database as unknown as Kysely<StatusDatabase>);
  await migratePriorityMaster(database as unknown as Kysely<PriorityDatabase>);
  await migrateEnquiryDatabase(database);
  await migrateClosureModule(
    database as unknown as Kysely<import("./modules/closure/index.js").ClosureDatabase>
  );
  await migrateEnquiryLocationModule(
    database as unknown as Kysely<
      import("./modules/enquiry-location/index.js").EnquiryLocationDatabase
    >
  );
  await migrateCallLogModule(database as unknown as Kysely<unknown>);
  await migrateContact360Database(database);
  await migrateSopModule(
    database as unknown as Kysely<import("./modules/sop/index.js").SopDatabase>
  );
  await migrateSopItemModule(
    database as unknown as Kysely<import("./modules/sop-item/index.js").SopItemDatabase>
  );
  await migrateDutyAssignmentModule(
    database as unknown as Kysely<
      import("./modules/duty-assignment/index.js").DutyAssignmentDatabase
    >
  );
  await migrateDutyReportModule(
    database as unknown as Kysely<import("./modules/duty-report/index.js").DutyReportDatabase>
  );
  await migrateFrappeSyncModule(
    database as unknown as Kysely<import("./modules/frappe-sync/index.js").CrmFrappeSyncDatabase>
  );
  return migrateTaskModule(
    database as unknown as Kysely<import("./modules/task/index.js").TaskDatabase>
  );
}

export const rollbackCrmTenantDatabase = rollbackEnquiryDatabase;
