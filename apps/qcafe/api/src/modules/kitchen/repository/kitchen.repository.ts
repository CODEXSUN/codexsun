import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
export class KitchenRepository {
  constructor(private db: Kysely<QcafeFoundationDatabase>) {}
  async workspace(businessId: string, locationId: string) {
    const stations = await this.db
        .selectFrom("qcafe_kitchen_stations")
        .innerJoin("qcafe_locations", "qcafe_locations.id", "qcafe_kitchen_stations.location_id")
        .selectAll("qcafe_kitchen_stations")
        .where("qcafe_locations.business_id", "=", businessId)
        .where("qcafe_kitchen_stations.location_id", "=", locationId)
        .execute(),
      stationIds = stations.map((s) => s.id),
      routes = stationIds.length
        ? await this.db
            .selectFrom("qcafe_item_station_routes")
            .selectAll()
            .where("station_id", "in", stationIds)
            .execute()
        : [],
      tickets = stationIds.length
        ? await this.db
            .selectFrom("qcafe_kitchen_tickets")
            .selectAll()
            .where("station_id", "in", stationIds)
            .orderBy("fired_at", "desc")
            .execute()
        : [],
      ticketIds = tickets.map((t) => t.id),
      lines = ticketIds.length
        ? await this.db
            .selectFrom("qcafe_kitchen_ticket_lines")
            .selectAll()
            .where("ticket_id", "in", ticketIds)
            .execute()
        : [],
      events = ticketIds.length
        ? await this.db
            .selectFrom("qcafe_kitchen_ticket_events")
            .selectAll()
            .where("ticket_id", "in", ticketIds)
            .execute()
        : [],
      printAttempts = ticketIds.length
        ? await this.db
            .selectFrom("qcafe_kitchen_print_attempts")
            .selectAll()
            .where("ticket_id", "in", ticketIds)
            .execute()
        : [];
    return { stations, routes, tickets, lines, events, printAttempts };
  }
  async station(locationId: string, code: string, name: string, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_kitchen_stations")
      .values({ id, location_id: locationId, code, name, active: 1, created_at: now, updated_at: now })
      .execute();
    return id;
  }
  location(businessId: string, locationId: string) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", locationId)
      .where("business_id", "=", businessId)
      .where("status", "=", "active")
      .executeTakeFirst();
  }
  routeScope(input: { businessId: string; itemId: string; locationId: string; stationId: string }) {
    return Promise.all([
      this.db
        .selectFrom("qcafe_menu_items")
        .select("id")
        .where("id", "=", input.itemId)
        .where("business_id", "=", input.businessId)
        .where("active", "=", 1)
        .executeTakeFirst(),
      this.db
        .selectFrom("qcafe_kitchen_stations")
        .select("id")
        .where("id", "=", input.stationId)
        .where("location_id", "=", input.locationId)
        .where("active", "=", 1)
        .executeTakeFirst(),
    ]);
  }
  async route(input: { itemId: string; variantId?: string; stationId: string; priority: number }, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_item_station_routes")
      .values({
        id,
        item_id: input.itemId,
        variant_id: input.variantId ?? null,
        station_id: input.stationId,
        priority: input.priority,
        active: 1,
        created_at: now,
        updated_at: now,
      })
      .execute();
    return id;
  }
  async fire(
    order: { id: string; location_id: string },
    lines: QcafeFoundationDatabase["qcafe_order_lines"][],
    actor: string,
    now: string,
  ) {
    const existing = await this.db
      .selectFrom("qcafe_kitchen_tickets")
      .select("id")
      .where("order_id", "=", order.id)
      .execute();
    if (existing.length) return existing.length;
    const routes = await this.db
        .selectFrom("qcafe_item_station_routes")
        .innerJoin("qcafe_kitchen_stations", "qcafe_kitchen_stations.id", "qcafe_item_station_routes.station_id")
        .selectAll("qcafe_item_station_routes")
        .where("qcafe_kitchen_stations.location_id", "=", order.location_id)
        .where("qcafe_kitchen_stations.active", "=", 1)
        .where("qcafe_item_station_routes.active", "=", 1)
        .execute(),
      grouped = new Map<string, QcafeFoundationDatabase["qcafe_order_lines"][]>();
    for (const line of lines) {
      const candidates = routes
        .filter((r) => r.item_id === line.item_id && (r.variant_id === null || r.variant_id === line.variant_id))
        .sort((a, b) => Number(Boolean(b.variant_id)) - Number(Boolean(a.variant_id)) || b.priority - a.priority);
      const route = candidates[0];
      if (route) grouped.set(route.station_id, [...(grouped.get(route.station_id) ?? []), line]);
    }
    await this.db.transaction().execute(async (tx) => {
      for (const [stationId, stationLines] of grouped) {
        const sequence = await tx
          .selectFrom("qcafe_number_sequences")
          .selectAll()
          .where("location_id", "=", order.location_id)
          .where("document_kind", "=", "kot")
          .executeTakeFirstOrThrow();
        await tx
          .updateTable("qcafe_number_sequences")
          .set({ next_value: sequence.next_value + 1, updated_at: now })
          .where("id", "=", sequence.id)
          .execute();
        const id = randomUUID();
        await tx
          .insertInto("qcafe_kitchen_tickets")
          .values({
            id,
            number: `${sequence.prefix}-${String(sequence.next_value).padStart(6, "0")}`,
            order_id: order.id,
            station_id: stationId,
            status: "fired",
            fired_at: now,
            ready_at: null,
            updated_at: now,
          })
          .execute();
        await tx
          .insertInto("qcafe_kitchen_ticket_lines")
          .values(
            stationLines.map((line) => ({
              id: randomUUID(),
              ticket_id: id,
              order_line_id: line.id,
              quantity_milli: line.quantity_milli,
              status: "fired" as const,
              preparation_note: line.note,
              updated_at: now,
            })),
          )
          .execute();
        await tx
          .insertInto("qcafe_kitchen_ticket_events")
          .values({
            id: randomUUID(),
            ticket_id: id,
            line_id: null,
            event_type: "fired",
            actor_ref: actor,
            note: null,
            occurred_at: now,
          })
          .execute();
      }
    });
    return grouped.size;
  }
  ticket(id: string) {
    return this.db.selectFrom("qcafe_kitchen_tickets").selectAll().where("id", "=", id).executeTakeFirst();
  }
  async transition(
    id: string,
    status: QcafeFoundationDatabase["qcafe_kitchen_tickets"]["status"],
    eventType: string,
    actor: string,
    note: string | null,
    now: string,
  ) {
    await this.db.transaction().execute(async (tx) => {
      const readyAt = status === "ready" ? now : undefined;
      await tx
        .updateTable("qcafe_kitchen_tickets")
        .set({ status, ...(readyAt ? { ready_at: readyAt } : {}), updated_at: now })
        .where("id", "=", id)
        .execute();
      const lineStatus =
        status === "accepted"
          ? "fired"
          : status === "recalled"
            ? "preparing"
            : status === "voided"
              ? "voided"
              : (status as QcafeFoundationDatabase["qcafe_kitchen_ticket_lines"]["status"]);
      await tx
        .updateTable("qcafe_kitchen_ticket_lines")
        .set({ status: lineStatus, updated_at: now })
        .where("ticket_id", "=", id)
        .execute();
      await tx
        .insertInto("qcafe_kitchen_ticket_events")
        .values({
          id: randomUUID(),
          ticket_id: id,
          line_id: null,
          event_type: eventType,
          actor_ref: actor,
          note,
          occurred_at: now,
        })
        .execute();
    });
  }
  async print(id: string, routeRef: string, actor: string, now: string) {
    const prior = await this.db
      .selectFrom("qcafe_kitchen_print_attempts")
      .select("id")
      .where("ticket_id", "=", id)
      .execute();
    const attempt = randomUUID();
    await this.db
      .insertInto("qcafe_kitchen_print_attempts")
      .values({
        id: attempt,
        ticket_id: id,
        attempt_number: prior.length + 1,
        route_ref: routeRef,
        status: "queued",
        error: null,
        requested_by: actor,
        requested_at: now,
      })
      .execute();
    await this.db
      .insertInto("qcafe_kitchen_ticket_events")
      .values({
        id: randomUUID(),
        ticket_id: id,
        line_id: null,
        event_type: prior.length ? "reprint_requested" : "print_requested",
        actor_ref: actor,
        note: routeRef,
        occurred_at: now,
      })
      .execute();
    return attempt;
  }
  async orderReady(orderId: string) {
    const tickets = await this.db
      .selectFrom("qcafe_kitchen_tickets")
      .select("status")
      .where("order_id", "=", orderId)
      .execute();
    return tickets.every((t) => ["ready", "served", "voided"].includes(t.status));
  }
}
