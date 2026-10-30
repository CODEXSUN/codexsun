import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export type FrappeActivityImportContext = {
  database: Kysely<FrappeDatabase>;
  resolveActor?: (remoteUser: string, baseUrl: string) => Promise<string | null>;
};
