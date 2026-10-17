import { sql, type Transaction } from "kysely";
import {
  getCoreDatabase,
  runWithCoreDatabase,
  runWithCoreTransaction,
  type CoreDatabase
} from "../../../database/core-database.js";
import { ContactService } from "./contact.service.js";

export async function getActiveContactForDatabase(databaseName: string, id: number) {
  const result = await sql<{ name: string }>`
    SELECT name FROM core_contacts WHERE id = ${id} AND status = 'active' LIMIT 1
  `.execute(getCoreDatabase(databaseName));
  return result.rows[0] ?? null;
}

export function resolveOrCreateCustomerForDatabase(
  databaseName: string,
  input: { name: string | null; mobile: string | null },
  transaction?: Transaction<CoreDatabase>
) {
  const resolve = () => new ContactService().resolveOrCreateCustomer(input.name, input.mobile);
  return transaction
    ? runWithCoreTransaction(databaseName, transaction, resolve)
    : runWithCoreDatabase(databaseName, resolve);
}

export async function resolveExternalCustomerForDatabase(
  databaseName: string,
  input: { externalKey: string; name: string; mobile: string }
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getCoreDatabase(databaseName)
        .transaction()
        .execute((transaction) =>
          runWithCoreTransaction(databaseName, transaction, () =>
            new ContactService().resolveExternalCustomer(
              input.externalKey,
              input.name,
              input.mobile
            )
          )
        );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? error.code : null;
      const duplicateContactCode =
        code === "CONFLICT" &&
        error instanceof Error &&
        error.message === "Contact code already exists.";
      if (
        attempt === 2 ||
        (!duplicateContactCode && !["ER_LOCK_DEADLOCK", "ER_DUP_ENTRY"].includes(String(code)))
      )
        throw error;
    }
  }
  throw new Error("External customer resolution failed.");
}
