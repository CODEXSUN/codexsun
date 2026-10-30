import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export type MobileCustomerResolver = (input: {
  externalKey: string;
  externalCode: string;
  name: string;
  mobile: string;
  contactType?: "Customer" | "Supplier";
  existingContactId?: number;
}) => Promise<{ id: number; code: string }>;

export type ContactIdentityLookup = (code: string) => Promise<{ id: number; code: string } | null>;
export type ContactIdLookup = (id: number) => Promise<{ id: number; code: string } | null>;

export type FrappeContactImportContext = {
  database: Kysely<FrappeDatabase>;
  resolveContact: MobileCustomerResolver;
  findContactByCode: ContactIdentityLookup;
  findContactById: ContactIdLookup;
};
