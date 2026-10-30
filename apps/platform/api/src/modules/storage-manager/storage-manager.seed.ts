import type { Kysely } from "kysely";
import type { PlatformDatabase } from "../../database/schema.js";
import { ensureAppStorage } from "./storage-manager.paths.js";

export async function seedStorageManagerModule(_database: Kysely<PlatformDatabase>) {
  await ensureAppStorage();
  return { seeded: 1, storage: "app-root-ready" } as const;
}
