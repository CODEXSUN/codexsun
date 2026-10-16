import { createHash } from "node:crypto";
import type { Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { PosLine } from "./pos.types.js";
import { PosRepository } from "./pos.repository.js";
export async function createQCafeOrderBill(
  database: Kysely<QCafeDatabase>,
  input: {
    requestId: string;
    lines: PosLine[];
    context: { orderUuid: string; mode: string; tableName: string; seats: number[] };
  },
  actor: string
) {
  return new PosRepository(database).createInTransaction(
    input.requestId,
    createHash("sha256").update(JSON.stringify(input)).digest("hex"),
    input.lines,
    actor,
    input.context
  );
}
