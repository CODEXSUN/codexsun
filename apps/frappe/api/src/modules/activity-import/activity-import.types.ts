import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export type FrappeActivityImportContext = Kysely<FrappeDatabase>;
