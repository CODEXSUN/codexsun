import type { Kysely } from "kysely";
import { seedContact360Database } from "./contact-360.seed.js";
import { seedCallLogPermissions } from "./modules/call-log/index.js";
import { seedEnquiryModule } from "./modules/enquiry/index.js";
import type { EnquiryDatabase } from "./modules/enquiry/index.js";
import { seedListInMaster } from "./modules/list-in/index.js";
import type { ListInDatabase } from "./modules/list-in/index.js";
import { seedStatusMaster } from "./modules/status/index.js";
import type { StatusDatabase } from "./modules/status/index.js";
import { seedPriorityMaster } from "./modules/priority/index.js";
import type { PriorityDatabase } from "./modules/priority/index.js";
import { seedClosurePermissions } from "./modules/closure/index.js";
import { seedCrmContactPermissions } from "./modules/contact/index.js";
import { seedSopPermissions } from "./modules/sop/index.js";
import { seedTaskPermissions } from "./modules/task/index.js";

export async function seedCrmTenantDatabase(database: Kysely<EnquiryDatabase>) {
  await seedListInMaster(database as unknown as Kysely<ListInDatabase>);
  await seedStatusMaster(database as unknown as Kysely<StatusDatabase>);
  await seedPriorityMaster(database as unknown as Kysely<PriorityDatabase>);
  await seedEnquiryModule(database);
  await seedClosurePermissions(
    database as unknown as Kysely<import("./modules/closure/index.js").ClosureDatabase>
  );
  await seedCallLogPermissions(database);
  await seedCrmContactPermissions(database);
  await seedSopPermissions(
    database as unknown as Kysely<import("./modules/sop/index.js").SopDatabase>
  );
  await seedTaskPermissions(
    database as unknown as Kysely<import("./modules/task/index.js").TaskDatabase>
  );
  await seedContact360Database(database);
}
