import { randomInt, randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { AddOrderLine, CreateOrder, PosScope } from "../contracts/pos.contract.js";

export class PosRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}
  async scope(input: CreateOrder) {
    return Promise.all([
      this.db.selectFrom("qcafe_businesses").selectAll().where("id", "=", input.businessId).executeTakeFirst(),
      this.db
        .selectFrom("qcafe_locations")
        .selectAll()
        .where("id", "=", input.locationId)
        .where("business_id", "=", input.businessId)
        .where("status", "=", "active")
        .executeTakeFirst(),
      this.db
        .selectFrom("qcafe_service_channels")
        .selectAll()
        .where("id", "=", input.serviceChannelId)
        .where("location_id", "=", input.locationId)
        .where("enabled", "=", 1)
        .executeTakeFirst(),
      this.db
        .selectFrom("qcafe_price_books")
        .selectAll()
        .where("id", "=", input.priceBookId)
        .where("business_id", "=", input.businessId)
        .executeTakeFirst(),
      input.tableSessionId
        ? this.db
            .selectFrom("qcafe_table_sessions")
            .selectAll()
            .where("id", "=", input.tableSessionId)
            .where("location_id", "=", input.locationId)
            .where("status", "=", "open")
            .executeTakeFirst()
        : Promise.resolve(undefined),
    ]);
  }
  async create(input: CreateOrder, currency: string, actorId: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const sequence = await tx
        .selectFrom("qcafe_number_sequences")
        .selectAll()
        .where("location_id", "=", input.locationId)
        .where("document_kind", "=", "order")
        .executeTakeFirstOrThrow();
      await tx
        .updateTable("qcafe_number_sequences")
        .set({ next_value: sequence.next_value + 1, updated_at: now })
        .where("id", "=", sequence.id)
        .execute();
      const id = randomUUID(),
        number = `${sequence.prefix}-${String(sequence.next_value).padStart(6, "0")}`;
      await tx
        .insertInto("qcafe_orders")
        .values({
          id,
          business_id: input.businessId,
          location_id: input.locationId,
          service_channel_id: input.serviceChannelId,
          price_book_id: input.priceBookId,
          table_session_id: input.tableSessionId ?? null,
          number,
          status: "draft",
          currency,
          customer_name: input.customerName ?? null,
          contact_ref: input.contactRef ?? null,
          subtotal_minor: 0,
          discount_minor: 0,
          total_minor: 0,
          note: input.note ?? null,
          opened_by: actorId,
          confirmed_at: null,
          closed_at: null,
          version: 1,
          created_at: now,
          updated_at: now,
        })
        .execute();
      if (input.tableSessionId)
        await tx
          .updateTable("qcafe_table_sessions")
          .set({ primary_order_id: id })
          .where("id", "=", input.tableSessionId)
          .where("primary_order_id", "is", null)
          .execute();
      await event(tx, id, "opened", actorId, null, now);
      return id;
    });
  }
  order(id: string) {
    return this.db.selectFrom("qcafe_orders").selectAll().where("id", "=", id).executeTakeFirst();
  }
  line(id: string, orderId: string) {
    return this.db
      .selectFrom("qcafe_order_lines")
      .selectAll()
      .where("id", "=", id)
      .where("order_id", "=", orderId)
      .executeTakeFirst();
  }
  async addLine(
    orderId: string,
    input: AddOrderLine,
    snapshot: {
      itemCode: string;
      itemName: string;
      variantName: string | null;
      unitPriceMinor: number;
      modifierTotalMinor: number;
      modifiers: Array<{ optionId: string; optionName: string; quantity: number; priceAdjustmentMinor: number }>;
    },
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const id = randomUUID(),
        quantityMilli = Math.round(input.quantity * 1000),
        lineTotal = Math.round((snapshot.unitPriceMinor + snapshot.modifierTotalMinor) * input.quantity);
      await tx
        .insertInto("qcafe_order_lines")
        .values({
          id,
          order_id: orderId,
          item_id: input.itemId,
          variant_id: input.variantId ?? null,
          item_code: snapshot.itemCode,
          item_name: snapshot.itemName,
          variant_name: snapshot.variantName,
          quantity_milli: quantityMilli,
          unit_price_minor: snapshot.unitPriceMinor,
          modifier_total_minor: snapshot.modifierTotalMinor,
          line_total_minor: lineTotal,
          note: input.note ?? null,
          status: "active",
          version: 1,
          created_at: now,
          updated_at: now,
        })
        .execute();
      if (snapshot.modifiers.length)
        await tx
          .insertInto("qcafe_order_line_modifiers")
          .values(
            snapshot.modifiers.map((m) => ({
              id: randomUUID(),
              order_line_id: id,
              option_id: m.optionId,
              option_name: m.optionName,
              quantity: m.quantity,
              price_adjustment_minor: m.priceAdjustmentMinor,
              created_at: now,
            })),
          )
          .execute();
      await recalculate(tx, orderId, now);
      return id;
    });
  }
  async transition(
    id: string,
    status: QcafeFoundationDatabase["qcafe_orders"]["status"],
    eventType: string,
    actor: string,
    reason: string | null,
    now: string,
  ) {
    await this.db.transaction().execute(async (tx) => {
      const timestamps = {
        ...(status === "confirmed" ? { confirmed_at: now } : {}),
        ...(["cancelled", "fulfilled"].includes(status) ? { closed_at: now } : {}),
      };
      await tx
        .updateTable("qcafe_orders")
        .set({
          status,
          ...timestamps,
          updated_at: now,
        })
        .where("id", "=", id)
        .execute();
      await event(tx, id, eventType, actor, reason, now);
      if (status === "confirmed")
        await tx
          .updateTable("qcafe_fulfillment_jobs")
          .set({ status: "preparing", updated_at: now })
          .where("order_id", "=", id)
          .execute();
      if (status === "fulfilled")
        await tx
          .updateTable("qcafe_fulfillment_jobs")
          .set({ status: "handed_over", handover_at: now, updated_at: now })
          .where("order_id", "=", id)
          .execute();
    });
  }
  async createFulfillment(
    orderId: string,
    kind: QcafeFoundationDatabase["qcafe_fulfillment_jobs"]["kind"],
    input: CreateOrder,
    now: string,
  ) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_fulfillment_jobs")
      .values({
        id,
        order_id: orderId,
        kind,
        status: "pending",
        promised_at: input.pickupWindow ?? null,
        ready_at: null,
        handover_at: null,
        handler_ref: null,
        created_at: now,
        updated_at: now,
      })
      .execute();
    if (kind === "takeaway") {
      await this.db
        .insertInto("qcafe_takeaway_details")
        .values({
          id: randomUUID(),
          fulfillment_job_id: id,
          collection_name: input.collectionName ?? input.customerName ?? "Guest",
          contact_ref: input.contactRef ?? null,
          pickup_code: String(randomInt(1000, 10_000)),
          pickup_window: input.pickupWindow ?? null,
          created_at: now,
          updated_at: now,
        })
        .execute();
    }
  }
  async adjustment(
    orderId: string,
    input: { amountMinor: number; kind: "discount" | "service_recovery" | "rounding"; reason: string },
    actor: string,
    now: string,
  ) {
    await this.db
      .insertInto("qcafe_order_adjustments")
      .values({
        id: randomUUID(),
        order_id: orderId,
        kind: input.kind,
        amount_minor: input.amountMinor,
        reason: input.reason,
        approved_by: actor,
        created_at: now,
      })
      .execute();
    await recalculate(this.db, orderId, now);
  }
  async changeLine(orderId: string, lineId: string, input: { note?: string | null; quantity: number }, now: string) {
    const line = await this.line(lineId, orderId);
    if (!line || line.status !== "active") return false;
    const quantityMilli = Math.round(input.quantity * 1000);
    await this.db
      .updateTable("qcafe_order_lines")
      .set({
        line_total_minor: Math.round(((line.unit_price_minor + line.modifier_total_minor) * quantityMilli) / 1000),
        note: input.note === undefined ? line.note : input.note,
        quantity_milli: quantityMilli,
        updated_at: now,
        version: line.version + 1,
      })
      .where("id", "=", lineId)
      .execute();
    await recalculate(this.db, orderId, now);
    return true;
  }
  async voidLine(orderId: string, lineId: string, now: string) {
    const result = await this.db
      .updateTable("qcafe_order_lines")
      .set({ status: "voided", updated_at: now })
      .where("id", "=", lineId)
      .where("order_id", "=", orderId)
      .where("status", "=", "active")
      .executeTakeFirst();
    await recalculate(this.db, orderId, now);
    return Number(result.numUpdatedRows) > 0;
  }
  async markFulfillmentReady(orderId: string, now: string) {
    await this.db
      .updateTable("qcafe_fulfillment_jobs")
      .set({ ready_at: now, status: "ready", updated_at: now })
      .where("order_id", "=", orderId)
      .where("status", "=", "preparing")
      .execute();
  }
  async note(
    orderId: string,
    input: {
      content: string;
      lineId?: string;
      noteKind: "guest" | "internal" | "kitchen";
      visibility: "guest" | "internal" | "kitchen";
    },
    now: string,
  ) {
    await this.db
      .insertInto("qcafe_order_notes")
      .values({
        id: randomUUID(),
        order_id: orderId,
        order_line_id: input.lineId ?? null,
        note_kind: input.noteKind,
        content: input.content,
        visibility: input.visibility,
        created_at: now,
      })
      .execute();
  }
  async workspace(scope: PosScope) {
    const orders = await this.db
      .selectFrom("qcafe_orders")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    const ids = orders.map((o) => o.id);
    if (!ids.length)
      return {
        orders: [],
        lines: [],
        modifiers: [],
        events: [],
        fulfillments: [],
        takeawayDetails: [],
        adjustments: [],
        notes: [],
      };
    const lines = await this.db.selectFrom("qcafe_order_lines").selectAll().where("order_id", "in", ids).execute(),
      lineIds = lines.map((l) => l.id),
      fulfillments = await this.db
        .selectFrom("qcafe_fulfillment_jobs")
        .selectAll()
        .where("order_id", "in", ids)
        .execute(),
      fulfillmentIds = fulfillments.map((f) => f.id);
    return {
      orders,
      lines,
      modifiers: lineIds.length
        ? await this.db
            .selectFrom("qcafe_order_line_modifiers")
            .selectAll()
            .where("order_line_id", "in", lineIds)
            .execute()
        : [],
      events: await this.db.selectFrom("qcafe_order_events").selectAll().where("order_id", "in", ids).execute(),
      fulfillments,
      takeawayDetails: fulfillmentIds.length
        ? await this.db
            .selectFrom("qcafe_takeaway_details")
            .selectAll()
            .where("fulfillment_job_id", "in", fulfillmentIds)
            .execute()
        : [],
      adjustments: await this.db
        .selectFrom("qcafe_order_adjustments")
        .selectAll()
        .where("order_id", "in", ids)
        .execute(),
      notes: await this.db.selectFrom("qcafe_order_notes").selectAll().where("order_id", "in", ids).execute(),
    };
  }
  async confirmedSnapshot(orderId: string) {
    const order = await this.order(orderId);
    if (!order) return null;
    const lines = await this.db
      .selectFrom("qcafe_order_lines")
      .selectAll()
      .where("order_id", "=", orderId)
      .where("status", "=", "active")
      .execute();
    return { order, lines };
  }
}
async function recalculate(db: Kysely<QcafeFoundationDatabase>, orderId: string, now: string) {
  const lines = await db
      .selectFrom("qcafe_order_lines")
      .select("line_total_minor")
      .where("order_id", "=", orderId)
      .where("status", "=", "active")
      .execute(),
    adjustments = await db
      .selectFrom("qcafe_order_adjustments")
      .select("amount_minor")
      .where("order_id", "=", orderId)
      .execute(),
    subtotal = lines.reduce((s, l) => s + l.line_total_minor, 0),
    discount = adjustments.reduce((s, a) => s + a.amount_minor, 0);
  await db
    .updateTable("qcafe_orders")
    .set({
      subtotal_minor: subtotal,
      discount_minor: discount,
      total_minor: Math.max(0, subtotal - discount),
      updated_at: now,
    })
    .where("id", "=", orderId)
    .execute();
}
async function event(
  db: Kysely<QcafeFoundationDatabase>,
  orderId: string,
  eventType: string,
  actorId: string,
  reason: string | null,
  now: string,
) {
  await db
    .insertInto("qcafe_order_events")
    .values({ id: randomUUID(), order_id: orderId, event_type: eventType, actor_id: actorId, reason, occurred_at: now })
    .execute();
}
