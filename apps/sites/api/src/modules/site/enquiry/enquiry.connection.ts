import { EnquiryService } from "./enquiry.service.js";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { existsSync, realpathSync } from "node:fs";
import { resolve, relative, isAbsolute, join } from "node:path";
import { AppError } from "@codexsun/framework/errors";
import { findSitesCheckout } from "../site.runtime.js";
import { migrateEnquiry } from "./enquiry.migration.js";
import { EnquiryRepository } from "./enquiry.repository.js";
export function withClientEnquiries<T>(
  tenantId: string,
  siteUuid: string,
  work: (service: EnquiryService) => T,
  dataRoot?: string
): T {
  if (!tenantId || !/^[a-f0-9]{8}$/.test(siteUuid))
    throw AppError.forbidden("A verified client identity is required.");
  const key = createHash("sha256").update(`${tenantId}:${siteUuid}`).digest("hex");
  const root = resolve(
    dataRoot ||
      process.env.CODEXSUN_SITES_DATA_ROOT ||
      resolve(findSitesCheckout([import.meta.dirname, process.cwd()]), "storage/sites-data")
  );
  const path = resolve(root, key, "content.sqlite");
  if (!existsSync(path))
    throw AppError.conflict("Start this client first to connect its enquiry database.");
  const within = relative(realpathSync(root), realpathSync(path));
  if (within.startsWith("..") || isAbsolute(within) || within !== join(key, "content.sqlite"))
    throw AppError.forbidden("Client storage is outside the configured data directory.");
  const database = new DatabaseSync(path);
  try {
    database.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
    const identity = database
      .prepare("SELECT site_uuid FROM sites_delivery_identity WHERE id=1")
      .get();
    if (identity?.site_uuid !== siteUuid)
      throw AppError.forbidden("This database belongs to another client.");
    const bound = database
      .prepare("SELECT name FROM sqlite_master WHERE name='sites_delivery_binding'")
      .get();
    if (bound) {
      const binding = database
        .prepare("SELECT site_key FROM sites_delivery_binding WHERE id=1")
        .get();
      if (binding && binding.site_key !== key)
        throw AppError.forbidden("This database belongs to another tenant.");
    }
    migrateEnquiry(database);
    const service = new EnquiryService(new EnquiryRepository(database));
    service.expire();
    return work(service);
  } finally {
    database.close();
  }
}
