import type { DatabaseSync } from "node:sqlite";
import { migrateEnquiry } from "./enquiry.migration.js";
import { EnquiryRepository } from "./enquiry.repository.js";
import { EnquiryService } from "./enquiry.service.js";
export function enquiryModule(database: DatabaseSync) {
  migrateEnquiry(database);
  return new EnquiryService(new EnquiryRepository(database));
}
