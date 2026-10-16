import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export type FrappeContactImportContext = {
  database: Kysely<FrappeDatabase>;
  resolveContact: (name: string, mobile: string | null) => Promise<{ id: number }>;
};
