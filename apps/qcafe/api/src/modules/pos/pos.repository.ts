import { readQCafeSettings } from "../settings/index.js";
import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { PosBill, PosLine, PaymentInput, PosPayment } from "./pos.types.js";

type BillRow = {
  id: number;
  uuid: string;
  total: number;
  paid: number;
  status: PosBill["status"];
  created_epoch: number;
  payload_hash: string;
  service_context: string | null;
  receipt_context: string | import("./pos.types.js").ReceiptContext | null;
};

export class PosRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}

  async list() {
    const bills = (
      await sql<BillRow>`SELECT *, UNIX_TIMESTAMP(created_at) AS created_epoch FROM qcafe_pos ORDER BY id DESC LIMIT 50`.execute(
        this.database
      )
    ).rows;
    return Promise.all(bills.map((bill) => this.details(bill)));
  }

  async get(uuid: string) {
    const bill = (
      await sql<BillRow>`SELECT *, UNIX_TIMESTAMP(created_at) AS created_epoch FROM qcafe_pos WHERE uuid=${uuid}`.execute(
        this.database
      )
    ).rows[0];
    if (!bill) throw AppError.notFound("Bill was not found.");
    return this.details(bill);
  }

  async create(requestId: string, hash: string, lines: PosLine[], actor: string) {
    try {
      return await this.database
        .transaction()
        .execute((transaction) =>
          new PosRepository(transaction).createInTransaction(requestId, hash, lines, actor)
        );
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const existing = (
        await sql<BillRow>`SELECT * FROM qcafe_pos WHERE request_id=${requestId}`.execute(
          this.database
        )
      ).rows[0];
      if (!existing) throw error;
      return this.replay(existing, hash);
    }
  }

  async createInTransaction(
    requestId: string,
    hash: string,
    lines: PosLine[],
    actor: string,
    serviceContext?: {
      orderUuid: string;
      mode: string;
      tableName: string;
      seats: number[];
      parcelToken?: string | null;
      booking?: { token: string; customerName: string; mobile: string; pickupAt: string } | null;
    }
  ) {
    const existing = (
      await sql<BillRow>`SELECT * FROM qcafe_pos WHERE request_id=${requestId}`.execute(
        this.database
      )
    ).rows[0];
    if (existing) return this.replay(existing, hash);
    const uuid = randomBytes(4).toString("hex");
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const prefs = await readQCafeSettings(this.database);
    const netAmount = Math.round((total * 100) / (100 + prefs.gstRate));
    const receiptContext = {
      restaurantName: prefs.restaurantName,
      branchName: prefs.branchName,
      address: prefs.address,
      contactNumber: prefs.contactNumber,
      gstin: prefs.gstin,
      fssai: prefs.fssai,
      receiptHeader: prefs.receiptHeader,
      receiptFooter: prefs.receiptFooter,
      receiptLegalNote: prefs.receiptLegalNote,
      showReceiptContact: prefs.showReceiptContact,
      receiptWidth: prefs.receiptWidth,
      gstRate: prefs.gstRate,
      taxAmount: total - netAmount,
      netAmount
    };
    await sql`INSERT INTO qcafe_pos (uuid, request_id, payload_hash, total, created_by, service_context, receipt_context)
          VALUES (${uuid}, ${requestId}, ${hash}, ${total}, ${actor}, ${serviceContext ? JSON.stringify(serviceContext) : null},${JSON.stringify(receiptContext)})`.execute(
      this.database
    );
    const bill = (
      await sql<BillRow>`SELECT * FROM qcafe_pos WHERE uuid=${uuid}`.execute(this.database)
    ).rows[0]!;
    for (const line of lines) {
      await sql`INSERT INTO qcafe_pos_lines (uuid, pos_id, menu_uuid, code, name, quantity, rate, amount)
            VALUES (${randomBytes(4).toString("hex")}, ${bill.id}, ${line.menuUuid}, ${line.code}, ${line.name}, ${line.quantity}, ${line.rate}, ${line.amount})`.execute(
        this.database
      );
    }
    await this.activity(bill.id, actor, "created");
    return this.get(uuid);
  }

  async replayRequest(requestId: string, hash: string) {
    const bill = (
      await sql<BillRow>`SELECT * FROM qcafe_pos WHERE request_id=${requestId}`.execute(
        this.database
      )
    ).rows[0];
    return bill ? this.replay(bill, hash) : null;
  }

  async pay(
    uuid: string,
    input: PaymentInput,
    hash: string,
    actor: string,
    releaseSeats?: (database: Kysely<QCafeDatabase>, uuid: string) => Promise<void>
  ) {
    return this.database.transaction().execute(async (transaction) => {
      const repo = new PosRepository(transaction);
      const bill = (
        await sql<BillRow>`SELECT * FROM qcafe_pos WHERE uuid=${uuid} FOR UPDATE`.execute(
          transaction
        )
      ).rows[0];
      if (!bill) throw AppError.notFound("Bill was not found.");
      const previous = (
        await sql<{ pos_id: number; payload_hash: string }>`SELECT pos_id, payload_hash
        FROM qcafe_pos_payments WHERE request_id=${input.requestId}`.execute(transaction)
      ).rows[0];
      if (previous) {
        if (previous.pos_id !== bill.id || previous.payload_hash !== hash)
          throw AppError.conflict("Payment request was already used with different details.");
        return repo.get(uuid);
      }
      if (input.amount > bill.total - bill.paid)
        throw AppError.conflict("Payment exceeds the outstanding amount.");
      await sql`INSERT INTO qcafe_pos_payments (uuid, request_id, payload_hash, pos_id, amount, mode, reference, created_by)
        VALUES (${randomBytes(4).toString("hex")}, ${input.requestId}, ${hash}, ${bill.id}, ${input.amount}, ${input.mode}, ${input.reference}, ${actor})`.execute(
        transaction
      );
      const paid = bill.paid + input.amount;
      await sql`UPDATE qcafe_pos SET paid=${paid}, status=${paid === bill.total ? "paid" : "part-paid"} WHERE id=${bill.id}`.execute(
        transaction
      );
      if (paid === bill.total && releaseSeats) await releaseSeats(transaction, uuid);
      await repo.activity(bill.id, actor, "payment-recorded");
      return repo.get(uuid);
    });
  }

  private async replay(bill: BillRow, hash: string) {
    if (bill.payload_hash !== hash)
      throw AppError.conflict("Bill request was already used with different details.");
    return this.get(bill.uuid);
  }

  private async activity(id: number, actor: string, action: string) {
    await sql`INSERT INTO qcafe_pos_activity (uuid, pos_id, actor, action)
      VALUES (${randomBytes(4).toString("hex")}, ${id}, ${actor}, ${action})`.execute(
      this.database
    );
  }

  private async details(row: BillRow): Promise<PosBill> {
    const lines = (
      await sql<PosLine>`SELECT menu_uuid AS menuUuid, code, name, quantity, rate, amount
      FROM qcafe_pos_lines WHERE pos_id=${row.id} ORDER BY id`.execute(this.database)
    ).rows;
    const payments = (
      await sql<
        Omit<PosPayment, "createdAt"> & { created_epoch: number }
      >`SELECT uuid, amount, mode, reference, UNIX_TIMESTAMP(created_at) AS created_epoch
      FROM qcafe_pos_payments WHERE pos_id=${row.id} ORDER BY id`.execute(this.database)
    ).rows;
    return {
      receiptContext: row.receipt_context
        ? typeof row.receipt_context === "string"
          ? JSON.parse(row.receipt_context)
          : row.receipt_context
        : null,
      serviceContext: row.service_context ? JSON.parse(row.service_context) : null,
      uuid: row.uuid,
      number: `POS-${String(row.id).padStart(6, "0")}`,
      total: row.total,
      paid: row.paid,
      status: row.status,
      createdAt: new Date(Number(row.created_epoch) * 1000).toISOString(),
      lines: lines.map((line) => ({ ...line, quantity: Number(line.quantity) })),
      payments: payments.map(({ created_epoch, ...payment }) => ({
        ...payment,
        createdAt: new Date(Number(created_epoch) * 1000).toISOString()
      }))
    };
  }
}

function isDuplicate(error: unknown) {
  return (
    error !== null && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY"
  );
}
