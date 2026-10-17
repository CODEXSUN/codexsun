import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export type MobileCustomerResolver = (input: {
  externalKey: string;
  name: string;
  mobile: string;
}) => Promise<{ id: number }>;

export type FrappeContactImportContext = {
  database: Kysely<FrappeDatabase>;
  resolveContact: MobileCustomerResolver;
};
