import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import { spoolKitchenToken } from "./order.printer.js";
import type { OrderLine } from "./order.types.js";
export async function dispatchKitchenPrint(
  db: Kysely<QCafeDatabase>,
  target: string,
  spool = spoolKitchenToken
) {
  const job = await db.transaction().execute(async (trx) => {
    const row = (
      await sql<{
        uuid: string;
        id: number;
        table_name: string;
        seats_json: string;
        lines_json: string;
        print_status: string;
      }>`SELECT t.uuid,t.id,t.lines_json,t.print_status,o.table_name,o.seats_json FROM qcafe_order_tickets t JOIN qcafe_order o ON o.uuid=t.order_uuid WHERE t.kind='send' AND o.mode='KOT' AND o.status='draft' AND t.print_status IN ('pending','spooling') ORDER BY t.id LIMIT 1 FOR UPDATE`.execute(
        trx
      )
    ).rows[0];
    if (!row || row.print_status === "spooling") return null;
    await sql`UPDATE qcafe_order_tickets SET print_status='spooling',print_target=${target},print_error='' WHERE uuid=${row.uuid}`.execute(
      trx
    );
    return row;
  });
  if (!job) return;
  try {
    const lines: OrderLine[] = JSON.parse(job.lines_json);
    const text = [
      "QCafe · KITCHEN TOKEN",
      `KOT-${String(job.id).padStart(6, "0")}`,
      `Table ${job.table_name} · Chairs ${JSON.parse(job.seats_json).join(", ")}`,
      "----------------------------",
      ...lines.map((line) => `${line.quantity} x ${line.name}`),
      "----------------------------",
      "Prepare in token order"
    ].join("\n");
    await spool(target, text);
    await sql`UPDATE qcafe_order_tickets SET print_status='spooled' WHERE uuid=${job.uuid}`.execute(
      db
    );
  } catch (error) {
    await sql`UPDATE qcafe_order_tickets SET print_status='review',print_error=${error instanceof Error ? error.message.slice(0, 500) : "Printer confirmation failed"} WHERE uuid=${job.uuid}`.execute(
      db
    );
  }
}
