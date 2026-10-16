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
