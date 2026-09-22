import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { CreateEventLead, CreateEventQuote, EventScope } from "../contracts/event-sales.contract.js";

export class EventSalesRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  async workspace(scope: EventScope) {
    const leads = await this.db
      .selectFrom("qcafe_event_leads")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("created_at", "desc")
      .execute();
    const leadIds = leads.map((lead) => lead.id);
    const bookings = leadIds.length
      ? await this.db
          .selectFrom("qcafe_event_bookings")
          .selectAll()
          .where("lead_id", "in", leadIds)
          .where("location_id", "=", scope.locationId)
          .orderBy("starts_at")
          .execute()
      : [];
    const bookingIds = bookings.map((booking) => booking.id);
    const quotes = bookingIds.length
      ? await this.db.selectFrom("qcafe_event_quotes").selectAll().where("event_booking_id", "in", bookingIds).execute()
      : [];
    const quoteIds = quotes.map((quote) => quote.id);
    const orders = bookingIds.length
      ? await this.db.selectFrom("qcafe_event_orders").selectAll().where("event_booking_id", "in", bookingIds).execute()
      : [];
    const orderIds = orders.map((order) => order.order_id);
    const bills = orderIds.length
      ? await this.db
          .selectFrom("qcafe_bills")
          .select(["id", "order_id", "balance_minor", "paid_minor", "status"])
          .where("order_id", "in", orderIds)
          .execute()
      : [];
    return {
      leads,
      followups: leadIds.length
        ? await this.db
            .selectFrom("qcafe_event_followups")
            .selectAll()
            .where("lead_id", "in", leadIds)
            .orderBy("scheduled_at")
            .execute()
        : [],
      bookings,
      requirements: bookingIds.length
        ? await this.db
            .selectFrom("qcafe_event_requirements")
            .selectAll()
            .where("event_booking_id", "in", bookingIds)
            .execute()
        : [],
      quotes,
      quoteLines: quoteIds.length
        ? await this.db.selectFrom("qcafe_event_quote_lines").selectAll().where("quote_id", "in", quoteIds).execute()
        : [],
      orders,
      schedules: bookingIds.length
        ? await this.db
            .selectFrom("qcafe_event_schedule_items")
            .selectAll()
            .where("event_booking_id", "in", bookingIds)
            .orderBy("starts_at")
            .execute()
        : [],
      tasks: bookingIds.length
        ? await this.db
            .selectFrom("qcafe_event_tasks")
            .selectAll()
            .where("event_booking_id", "in", bookingIds)
            .orderBy("due_at")
            .execute()
        : [],
      advances: bookingIds.length
        ? await this.db.selectFrom("qcafe_vouchers").selectAll().where("event_ref", "in", bookingIds).execute()
        : [],
      collections: orders.flatMap((order) =>
        bills
          .filter((bill) => bill.order_id === order.order_id)
          .map((bill) => ({ ...bill, eventBookingId: order.event_booking_id })),
      ),
    };
  }

  lead(id: string) {
    return this.db.selectFrom("qcafe_event_leads").selectAll().where("id", "=", id).executeTakeFirst();
  }
  booking(id: string) {
    return this.db.selectFrom("qcafe_event_bookings").selectAll().where("id", "=", id).executeTakeFirst();
  }
  quote(id: string) {
    return this.db.selectFrom("qcafe_event_quotes").selectAll().where("id", "=", id).executeTakeFirst();
  }
  readFollowup(id: string) {
    return this.db.selectFrom("qcafe_event_followups").selectAll().where("id", "=", id).executeTakeFirst();
  }
  readTask(id: string) {
    return this.db.selectFrom("qcafe_event_tasks").selectAll().where("id", "=", id).executeTakeFirst();
  }
  schedule(id: string) {
    return this.db.selectFrom("qcafe_event_schedule_items").selectAll().where("id", "=", id).executeTakeFirst();
  }
  order(id: string) {
    return this.db.selectFrom("qcafe_orders").selectAll().where("id", "=", id).executeTakeFirst();
  }
  location(id: string, businessId: string) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", id)
      .where("business_id", "=", businessId)
      .executeTakeFirst();
  }
  customer(id: string, businessId: string) {
    return this.db
      .selectFrom("qcafe_customers")
      .select("id")
      .where("id", "=", id)
      .where("business_id", "=", businessId)
      .executeTakeFirst();
  }
  async completionState(bookingId: string) {
    const [tasks, schedules, orders] = await Promise.all([
      this.db.selectFrom("qcafe_event_tasks").select("status").where("event_booking_id", "=", bookingId).execute(),
      this.db
        .selectFrom("qcafe_event_schedule_items")
        .select("status")
        .where("event_booking_id", "=", bookingId)
        .execute(),
      this.db.selectFrom("qcafe_event_orders").select("order_id").where("event_booking_id", "=", bookingId).execute(),
    ]);
    const orderIds = orders.map((order) => order.order_id);
    const bills = orderIds.length
      ? await this.db
          .selectFrom("qcafe_bills")
          .select(["order_id", "status"])
          .where("order_id", "in", orderIds)
          .execute()
      : [];
    return { bills, orders, schedules, tasks };
  }

  async createLead(input: CreateEventLead, actor: string, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_event_leads")
      .values({
        business_id: input.businessId,
        created_at: now,
        customer_id: input.customerId ?? null,
        event_date: input.eventDate,
        guest_count: input.guestCount,
        id,
        occasion_type: input.occasionType,
        owner_ref: input.ownerRef || actor,
        source: input.source,
        status: "new",
        updated_at: now,
      })
      .execute();
    return id;
  }
  async followup(leadId: string, input: { note: string; ownerRef: string; scheduledAt: string }, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_event_followups")
      .values({
        completed_at: null,
        created_at: now,
        id,
        lead_id: leadId,
        note: input.note,
        outcome: null,
        owner_ref: input.ownerRef,
        scheduled_at: input.scheduledAt,
      })
      .execute();
    await this.db
      .updateTable("qcafe_event_leads")
      .set({ status: "contacted", updated_at: now })
      .where("id", "=", leadId)
      .where("status", "=", "new")
      .execute();
    return id;
  }
  async completeFollowup(id: string, leadId: string, outcome: string, now: string) {
    await this.db
      .updateTable("qcafe_event_followups")
      .set({ completed_at: now, outcome })
      .where("id", "=", id)
      .execute();
    await this.db
      .updateTable("qcafe_event_leads")
      .set({ status: "qualified", updated_at: now })
      .where("id", "=", leadId)
      .where("status", "in", ["new", "contacted"])
      .execute();
  }
  async createBooking(
    lead: QcafeFoundationDatabase["qcafe_event_leads"],
    input: { endsAt: string; locationId: string; startsAt: string },
    now: string,
  ) {
    const id = randomUUID();
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto("qcafe_event_bookings")
        .values({
          created_at: now,
          customer_id: lead.customer_id,
          ends_at: input.endsAt,
          guest_count: lead.guest_count,
          id,
          lead_id: lead.id,
          location_id: input.locationId,
          starts_at: input.startsAt,
          status: "confirmed",
          updated_at: now,
        })
        .execute();
      await tx
        .updateTable("qcafe_event_leads")
        .set({ status: "won", updated_at: now })
        .where("id", "=", lead.id)
        .execute();
    });
    return id;
  }
  async bookingStatus(id: string, status: QcafeFoundationDatabase["qcafe_event_bookings"]["status"], now: string) {
    await this.db.updateTable("qcafe_event_bookings").set({ status, updated_at: now }).where("id", "=", id).execute();
  }
  async requirement(
    bookingId: string,
    input: {
      category: QcafeFoundationDatabase["qcafe_event_requirements"]["category"];
      details: string;
      responsibleRef: string;
    },
    now: string,
  ) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_event_requirements")
      .values({
        category: input.category,
        created_at: now,
        details: input.details,
        event_booking_id: bookingId,
        id,
        responsible_ref: input.responsibleRef,
        status: "open",
        updated_at: now,
      })
      .execute();
    return id;
  }
  async createQuote(booking: QcafeFoundationDatabase["qcafe_event_bookings"], input: CreateEventQuote, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const sequence = await tx
        .selectFrom("qcafe_number_sequences")
        .selectAll()
        .where("location_id", "=", booking.location_id)
        .where("document_kind", "=", "event_quote")
        .executeTakeFirstOrThrow();
      await tx
        .updateTable("qcafe_number_sequences")
        .set({ next_value: sequence.next_value + 1, updated_at: now })
        .where("id", "=", sequence.id)
        .execute();
      const id = randomUUID();
      const lines = input.lines.map((line) => ({
        ...line,
        quantityMilli: Math.round(line.quantity * 1000),
        totalMinor: Math.round(line.quantity * line.unitAmountMinor),
      }));
      await tx
        .insertInto("qcafe_event_quotes")
        .values({
          created_at: now,
          currency: input.currency,
          event_booking_id: booking.id,
          id,
          number: `${sequence.prefix}-${String(sequence.next_value).padStart(6, "0")}`,
          status: "draft",
          total_minor: lines.reduce((sum, line) => sum + line.totalMinor, 0),
          updated_at: now,
          valid_until: input.validUntil,
        })
        .execute();
      await tx
        .insertInto("qcafe_event_quote_lines")
        .values(
          lines.map((line) => ({
            created_at: now,
            description: line.description,
            id: randomUUID(),
            item_ref: line.itemRef ?? null,
            quantity_milli: line.quantityMilli,
            quote_id: id,
            total_minor: line.totalMinor,
            unit_amount_minor: line.unitAmountMinor,
          })),
        )
        .execute();
      return id;
    });
  }
  async quoteStatus(id: string, status: QcafeFoundationDatabase["qcafe_event_quotes"]["status"], now: string) {
    await this.db.updateTable("qcafe_event_quotes").set({ status, updated_at: now }).where("id", "=", id).execute();
  }
  async task(bookingId: string, input: { dueAt: string; ownerRef: string; task: string }, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_event_tasks")
      .values({
        created_at: now,
        due_at: input.dueAt,
        event_booking_id: bookingId,
        id,
        owner_ref: input.ownerRef,
        status: "open",
        task: input.task,
        updated_at: now,
      })
      .execute();
    return id;
  }
  async completeTask(id: string, now: string) {
    await this.db
      .updateTable("qcafe_event_tasks")
      .set({ status: "done", updated_at: now })
      .where("id", "=", id)
      .execute();
  }
  async scheduleItem(
    bookingId: string,
    input: { activity: string; endsAt: string; ownerRef: string; startsAt: string },
    now: string,
  ) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_event_schedule_items")
      .values({
        activity: input.activity,
        created_at: now,
        ends_at: input.endsAt,
        event_booking_id: bookingId,
        id,
        owner_ref: input.ownerRef,
        starts_at: input.startsAt,
        status: "planned",
        updated_at: now,
      })
      .execute();
    return id;
  }
  async scheduleStatus(id: string, status: "done" | "running", now: string) {
    await this.db
      .updateTable("qcafe_event_schedule_items")
      .set({ status, updated_at: now })
      .where("id", "=", id)
      .execute();
  }
  async linkOrder(
    bookingId: string,
    orderId: string,
    role: QcafeFoundationDatabase["qcafe_event_orders"]["role"],
    now: string,
  ) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_event_orders")
      .values({ created_at: now, event_booking_id: bookingId, id, order_id: orderId, role })
      .execute();
    return id;
  }
}
