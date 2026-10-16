import { createHash, randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type {
  CafeOrder,
  OrderDependencies,
  OrderInput,
  OrderLine,
  KitchenTicket
} from "./order.types.js";
type Row = {
  uuid: string;
  name: string;
  revision: number;
  status: CafeOrder["status"];
  mode: CafeOrder["mode"];
  table_uuid: string | null;
  table_name: string;
  seats_json: string;
  lines_json: string;
  bill_uuid: string | null;
};
export class OrderRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}
  async list() {
    const rows = (
      await sql<Row>`SELECT * FROM qcafe_order WHERE status='draft' ORDER BY id LIMIT 100`.execute(
        this.database
      )
    ).rows;
    return Promise.all(rows.map((row) => this.details(row)));
  }
  async occupied() {
    return (
      await sql<{
        tableUuid: string;
        seat: number;
        orderUuid: string;
      }>`SELECT table_uuid AS tableUuid,seat,order_uuid AS orderUuid FROM qcafe_order_seats`.execute(
        this.database
      )
    ).rows;
  }
  async get(uuid: string) {
    const row = (
      await sql<Row>`SELECT * FROM qcafe_order WHERE uuid=${uuid}`.execute(this.database)
    ).rows[0];
    if (!row) throw AppError.notFound("Order was not found.");
    return this.details(row);
  }
  async mutate(uuid: string, input: OrderInput, actor: string, deps: OrderDependencies) {
    const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    try {
      return await this.database.transaction().execute(async (db) => {
        const repo = new OrderRepository(db);
        if (input.revision === 0)
          await sql`INSERT IGNORE INTO qcafe_order(uuid,name,mode,seats_json,lines_json,created_by) VALUES(${uuid},${input.name},${input.mode},'[]','[]',${actor})`.execute(
            db
          );
        const row = (
          await sql<Row>`SELECT * FROM qcafe_order WHERE uuid=${uuid} FOR UPDATE`.execute(db)
        ).rows[0];
        if (!row) throw AppError.notFound("Order was not found.");
        const replay = (
          await sql<{
            order_uuid: string;
            payload_hash: string;
            response_json: string;
          }>`SELECT order_uuid,payload_hash,response_json FROM qcafe_order_operations WHERE request_id=${input.requestId}`.execute(
            db
          )
        ).rows[0];
        if (replay) {
          if (replay.order_uuid !== uuid || replay.payload_hash !== hash)
            throw AppError.conflict("This operation ID already has different details.");
          return JSON.parse(replay.response_json) as CafeOrder;
        }
        if (row.revision !== input.revision || row.status !== "draft")
          throw AppError.conflict(
            "This order changed in another window. Refresh orders before editing."
          );
        const current = await repo.details(row);
        if (input.action === "cancel") {
          const sent = sentQuantities(current.tickets);
          const cancelLines = current.lines
            .filter((line) => (sent.get(line.menuUuid) ?? 0) > 0)
            .map((line) => ({
              ...line,
              quantity: sent.get(line.menuUuid)!,
              amount: Math.round(line.rate * sent.get(line.menuUuid)!)
            }));
          if (cancelLines.length) await repo.ticket(uuid, "cancel", cancelLines, actor);
          await sql`DELETE FROM qcafe_order_seats WHERE order_uuid=${uuid}`.execute(db);
          await sql`UPDATE qcafe_order SET status='cancelled',revision=revision+1 WHERE uuid=${uuid}`.execute(
            db
          );
        } else {
          const menu = await deps.lookupMenu(
            db,
            input.lines.map((line) => line.menuUuid)
          );
          const lines = priceLines(input, menu, current.lines);
          const sent = sentQuantities(current.tickets);
          for (const [key, count] of sent)
            if ((lines.find((line) => line.menuUuid === key)?.quantity ?? 0) < count)
              throw AppError.conflict(
                "Items already sent to the kitchen cannot be reduced. Cancel the order to issue a cancellation KOT."
              );
          if (
            current.tickets.length &&
            (current.tableUuid !== input.tableUuid ||
              current.mode !== input.mode ||
              JSON.stringify(current.seats) !== JSON.stringify(input.seats))
          )
            throw AppError.conflict(
              "Table, seats, and mode cannot change after a KOT. Cancel and create a new order."
            );
          let tableName = "";
          if (input.tableUuid) {
            const table = await deps.lockTable(db, input.tableUuid);
            if (!table || (table.status !== "active" && current.tableUuid !== table.uuid))
              throw AppError.validation("Choose an active restaurant table.");
            if (input.seats.some((seat) => seat > table.seats))
              throw AppError.validation("A selected seat is outside this table's capacity.");
            tableName = table.name;
          }
          await sql`DELETE FROM qcafe_order_seats WHERE order_uuid=${uuid}`.execute(db);
          for (const seat of input.seats)
            await sql`INSERT INTO qcafe_order_seats(table_uuid,seat,order_uuid) VALUES(${input.tableUuid},${seat},${uuid})`.execute(
              db
            );
          await sql`UPDATE qcafe_order SET name=${input.name},mode=${input.mode},table_uuid=${input.tableUuid},table_name=${tableName},seats_json=${JSON.stringify(input.seats)},lines_json=${JSON.stringify(lines)},revision=revision+1 WHERE uuid=${uuid}`.execute(
            db
          );
          if (input.action === "kitchen") {
            if (!lines.length)
              throw AppError.validation("Add an item before sending to the kitchen.");
            const delta = lines
              .map((line) => ({
                ...line,
                quantity: Math.round((line.quantity - (sent.get(line.menuUuid) ?? 0)) * 1000) / 1000
              }))
              .filter((line) => line.quantity > 0)
              .map((line) => ({ ...line, amount: Math.round(line.rate * line.quantity) }));
            if (delta.length) await repo.ticket(uuid, "send", delta, actor);
          }
          if (input.action === "bill") {
            if (!lines.length) throw AppError.validation("Add an item before saving the bill.");
            const bill = await deps.createBill(
              db,
              {
                requestId: input.requestId,
                lines,
                context: { orderUuid: uuid, mode: input.mode, tableName, seats: input.seats }
              },
              actor
            );
            await sql`UPDATE qcafe_order SET status='billed',bill_uuid=${bill.uuid} WHERE uuid=${uuid}`.execute(
              db
            );
          }
        }
        const result = await repo.get(uuid);
        await sql`INSERT INTO qcafe_order_operations(request_id,order_uuid,payload_hash,response_json,action,actor) VALUES(${input.requestId},${uuid},${hash},${JSON.stringify(result)},${input.action},${actor})`.execute(
          db
        );
        return result;
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        ["ER_DUP_ENTRY", "ER_CHECKREAD", "ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(
          String(error.code)
        )
      )
        throw AppError.conflict(
          "A selected seat is occupied, or this operation was already submitted. Refresh orders."
        );
      throw error;
    }
  }
  private async ticket(
    uuid: string,
    kind: KitchenTicket["kind"],
    lines: OrderLine[],
    actor: string
  ) {
    await sql`INSERT INTO qcafe_order_tickets(uuid,order_uuid,kind,lines_json,created_by) VALUES(${randomBytes(4).toString("hex")},${uuid},${kind},${JSON.stringify(lines)},${actor})`.execute(
      this.database
    );
  }
  private async details(row: Row): Promise<CafeOrder> {
    const tickets = (
      await sql<{
        uuid: string;
        id: number;
        kind: KitchenTicket["kind"];
        lines_json: string;
        epoch: number;
      }>`SELECT uuid,id,kind,lines_json,UNIX_TIMESTAMP(created_at) AS epoch FROM qcafe_order_tickets WHERE order_uuid=${row.uuid} ORDER BY id`.execute(
        this.database
      )
    ).rows;
    return {
      uuid: row.uuid,
      name: row.name,
      revision: row.revision,
      status: row.status,
      mode: row.mode,
      tableUuid: row.table_uuid,
      tableName: row.table_name,
      seats: JSON.parse(row.seats_json),
      lines: JSON.parse(row.lines_json),
      billUuid: row.bill_uuid,
      tickets: tickets.map((ticket) => ({
        uuid: ticket.uuid,
        number: `KOT-${String(ticket.id).padStart(6, "0")}`,
        kind: ticket.kind,
        lines: JSON.parse(ticket.lines_json),
        createdAt: new Date(Number(ticket.epoch) * 1000).toISOString()
      }))
    };
  }
}
function sentQuantities(tickets: KitchenTicket[]) {
  const sent = new Map<string, number>();
  for (const ticket of tickets.filter((t) => t.kind === "send"))
    for (const line of ticket.lines)
      sent.set(
        line.menuUuid,
        Math.round(((sent.get(line.menuUuid) ?? 0) + line.quantity) * 1000) / 1000
      );
  return sent;
}
function priceLines(
  input: OrderInput,
  menu: { uuid: string; code: string; name: string; price: number }[],
  previous: OrderLine[]
) {
  const seen = new Set<string>();
  const lines = input.lines.map((line) => {
    if (seen.has(line.menuUuid)) throw AppError.validation("Combine duplicate items.");
    seen.add(line.menuUuid);
    const item = menu.find((item) => item.uuid === line.menuUuid);
    const old = previous.find((item) => item.menuUuid === line.menuUuid);
    if (!item && !old) throw AppError.validation("A menu item is inactive or unavailable.");
    if (!item && line.quantity > (old?.quantity ?? 0))
      throw AppError.validation("Cannot add an inactive item.");
    const rate = old?.rate ?? item!.price;
    const amount = Math.round(rate * line.quantity);
    if (amount <= 0 || amount > 100_000_000)
      throw AppError.validation("Line amount is out of range.");
    return {
      menuUuid: line.menuUuid,
      code: old?.code ?? item!.code,
      name: old?.name ?? item!.name,
      rate,
      quantity: line.quantity,
      amount
    };
  });
  if (lines.reduce((sum, line) => sum + line.amount, 0) > 100_000_000)
    throw AppError.validation("Order total is out of range.");
  return lines;
}
export async function releaseQCafeOrderSeats(database: Kysely<QCafeDatabase>, billUuid: string) {
  await sql`DELETE s FROM qcafe_order_seats s JOIN qcafe_order o ON o.uuid=s.order_uuid WHERE o.bill_uuid=${billUuid}`.execute(
    database
  );
}
