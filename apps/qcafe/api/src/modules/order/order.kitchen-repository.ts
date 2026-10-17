import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { OrderDependencies, OrderLine } from "./order.types.js";
export type KitchenJob = {
  uuid: string;
  number: string;
  orderUuid: string;
  orderName: string;
  tableName: string;
  seats: number[];
  status: "queued" | "ready" | "delivered";
  waiterUuid: string | null;
  printStatus: string;
  printError: string;
  lines: OrderLine[];
};
type JobRow = {
  uuid: string;
  id: number;
  order_uuid: string;
  name: string;
  table_name: string;
  seats_json: string;
  lines_json: string;
  preparation_status: KitchenJob["status"];
  waiter_uuid: string | null;
  print_status: string;
  print_error: string;
};
export class OrderKitchenRepository {
  constructor(private readonly db: Kysely<QCafeDatabase>) {}
  async list(): Promise<KitchenJob[]> {
    const rows = (
      await sql<JobRow>`SELECT t.*,o.name,o.table_name,o.seats_json FROM qcafe_order_tickets t JOIN qcafe_order o ON o.uuid=t.order_uuid WHERE t.kind='send' AND o.mode='KOT' AND o.status='draft' ORDER BY t.id LIMIT 500`.execute(
        this.db
      )
    ).rows;
    return rows.map((row) => ({
      uuid: row.uuid,
      number: `KOT-${String(row.id).padStart(6, "0")}`,
      orderUuid: row.order_uuid,
      orderName: row.name,
      tableName: row.table_name,
      seats: JSON.parse(row.seats_json),
      status: row.preparation_status,
      waiterUuid: row.waiter_uuid,
      printStatus: row.print_status,
      printError: row.print_error,
      lines: JSON.parse(row.lines_json)
    }));
  }
  async confirm(
    token: string,
    action: "ready" | "delivered",
    waiterUuid: string | null,
    actor: string,
    deps: OrderDependencies
  ) {
    return this.db.transaction().execute(async (db) => {
      const rows = (
        await sql<JobRow>`SELECT t.*,o.name,o.table_name,o.seats_json FROM qcafe_order_tickets t JOIN qcafe_order o ON o.uuid=t.order_uuid WHERE t.kind='send' AND o.mode='KOT' AND o.status='draft' ORDER BY t.id FOR UPDATE`.execute(
          db
        )
      ).rows;
      const target = rows.find(
        (row) =>
          row.uuid === token || `KOT-${String(row.id).padStart(6, "0")}` === token.toUpperCase()
      );
      if (!target) throw AppError.notFound("Kitchen token was not found.");
      if (target.preparation_status === action) return new OrderKitchenRepository(db).list();
      if (target.preparation_status === "delivered")
        throw AppError.conflict("This token has already been delivered.");
      const next = rows.find((row) =>
        action === "ready"
          ? row.preparation_status === "queued"
          : row.preparation_status !== "delivered"
      );
      if (next?.uuid !== target.uuid)
        throw AppError.conflict("Confirm the earlier kitchen token first.");
      if (action === "delivered") {
        if (target.preparation_status !== "ready")
          throw AppError.conflict("The kitchen must mark this token ready first.");
        if (!waiterUuid || !deps.activeWaiter || !(await deps.activeWaiter(db, waiterUuid)))
          throw AppError.validation("Select a registered active waiter.");
      }
      await sql`UPDATE qcafe_order_tickets SET preparation_status=${action},waiter_uuid=${action === "delivered" ? waiterUuid : null},confirmed_by=${actor},confirmed_at=CURRENT_TIMESTAMP WHERE uuid=${target.uuid}`.execute(
        db
      );
      await sql`INSERT INTO qcafe_order_delivery_activity(ticket_uuid,action,actor,waiter_uuid) VALUES(${target.uuid},${action},${actor},${action === "delivered" ? waiterUuid : null})`.execute(
        db
      );
      return new OrderKitchenRepository(db).list();
    });
  }
}
