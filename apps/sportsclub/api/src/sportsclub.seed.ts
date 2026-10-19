import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "./sportsclub.types.js";
import { seedProgramModule } from "./modules/program/program.seed.js";
import { seedMasterModule } from "./modules/master/master.seed.js";
import { seedMemberModule } from "./modules/member/member.seed.js";
import { seedSessionModule } from "./modules/session/session.seed.js";
import { seedAttendanceModule } from "./modules/attendance/attendance.seed.js";
import { seedProgressModule } from "./modules/progress/progress.seed.js";
import { seedEventModule } from "./modules/event/event.seed.js";
import { seedEnquiryModule } from "./modules/enquiry/enquiry.seed.js";

export async function seedSportsclubDatabase(db: Kysely<SportsclubDatabase>): Promise<void> {
  await seedProgramModule(db);
  await seedMasterModule(db);
  await seedMemberModule(db);
  await seedSessionModule(db);
  await seedAttendanceModule(db);
  await seedProgressModule(db);
  await seedEventModule(db);
  await seedEnquiryModule(db);
}

export const seedSportsclub = seedSportsclubDatabase;
export const seedSportsclubDemo = seedSportsclubDatabase;
