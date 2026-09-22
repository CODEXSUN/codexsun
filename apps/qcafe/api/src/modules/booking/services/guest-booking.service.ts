import { createHash, randomBytes } from "node:crypto";
import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { PosService } from "../../pos/services/pos.service.js";
import type { CreateCustomer, CreateReservation, GuestBookingScope } from "../contracts/guest-booking.contract.js";
import { GuestBookingRepository } from "../repository/guest-booking.repository.js";
import type { TableServiceService } from "./table-service.service.js";

export class GuestBookingConflictError extends Error {}

export class GuestBookingService {
  constructor(
    private readonly repo: GuestBookingRepository,
    private readonly tables: TableServiceService,
    private readonly pos: PosService,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: GuestBookingScope) {
    return this.repo.workspace(scope);
  }

  async customer(input: CreateCustomer, context: CommandContext) {
    const id = await this.repo.createCustomer(input, this.timestamp());
    await this.record(context, "customer.created", id, "customer");
    return { id };
  }

  async reserve(input: CreateReservation, context: CommandContext) {
    const [location, customer, capacity] = await Promise.all([
      this.repo.location(input),
      this.repo.customer(input.customerId),
      this.repo.tableCapacity(input.tableIds, input.locationId),
    ]);
    if (!location || !customer || customer.business_id !== input.businessId)
      throw new GuestBookingConflictError("The customer or outlet scope is invalid.");
    if (capacity === null || capacity < input.partySize)
      throw new GuestBookingConflictError("Selected tables are invalid or do not have enough capacity.");
    const id = await this.repo.createReservation(input, context.actorId, this.timestamp());
    await this.record(context, "reservation.requested", id, "reservation", { tableCount: input.tableIds.length });
    return this.read(input);
  }

  async action(
    id: string,
    action: "cancel" | "complete" | "confirm" | "no_show",
    note: string | undefined,
    context: CommandContext,
  ) {
    const reservation = await this.repo.reservation(id);
    if (!reservation) throw new GuestBookingConflictError("Reservation not found.");
    const transitions = {
      cancel: { from: ["requested", "confirmed"], to: "cancelled" },
      complete: { from: ["seated"], to: "completed" },
      confirm: { from: ["requested"], to: "confirmed" },
      no_show: { from: ["confirmed"], to: "no_show" },
    } as const;
    const transition = transitions[action];
    if (!(transition.from as readonly string[]).includes(reservation.status))
      throw new GuestBookingConflictError(`Cannot ${action} a ${reservation.status} reservation.`);
    if (["cancel", "no_show"].includes(action) && !note)
      throw new GuestBookingConflictError("Cancellation and no-show require a note.");
    if (action === "confirm") {
      const tableIds = (await this.repo.reservationTableIds(id)).map((link) => link.table_id);
      const endsAt = new Date(
        new Date(reservation.arrival_at).getTime() + reservation.duration_minutes * 60_000,
      ).toISOString();
      if (await this.repo.hasConflict(id, tableIds, reservation.arrival_at, endsAt))
        throw new GuestBookingConflictError("A selected table already has an overlapping confirmed reservation.");
    }
    await this.repo.transition(id, transition.to, action, context.actorId, note ?? null, this.timestamp());
    await this.record(context, `reservation.${action}`, id, "reservation");
    const businessId = await this.businessId(reservation.location_id);
    return this.read({ businessId, locationId: reservation.location_id });
  }

  async seat(id: string, input: { priceBookId: string; serviceChannelId: string }, context: CommandContext) {
    const reservation = await this.repo.reservation(id);
    if (!reservation || reservation.status !== "confirmed")
      throw new GuestBookingConflictError("Only a confirmed reservation can be seated.");
    const customer = await this.repo.customer(reservation.customer_id);
    if (!customer) throw new GuestBookingConflictError("The reservation customer is unavailable.");
    const tableIds = (await this.repo.reservationTableIds(id)).map((link) => link.table_id);
    const businessId = customer.business_id;
    let sessionId: string | undefined;
    try {
      sessionId = await this.tables.openSession(
        { businessId, guestCount: reservation.party_size, locationId: reservation.location_id, tableIds },
        context,
      );
      const state = await this.pos.create(
        {
          businessId,
          contactRef: customer.phone ?? customer.email ?? undefined,
          customerName: customer.name,
          locationId: reservation.location_id,
          note: `Reservation ${reservation.id}`,
          priceBookId: input.priceBookId,
          serviceChannelId: input.serviceChannelId,
          tableSessionId: sessionId,
        },
        context,
      );
      const order = state.orders.find((candidate) => candidate.table_session_id === sessionId);
      if (!order) throw new Error("Seated order was not returned.");
      await this.repo.seat(id, sessionId, order.id, context.actorId, this.timestamp());
      await this.record(context, "reservation.seated", id, "reservation", { orderId: order.id, sessionId });
      return this.read({ businessId, locationId: reservation.location_id });
    } catch (error) {
      if (sessionId) await this.tables.releaseEmptySession(sessionId, context);
      if (error instanceof GuestBookingConflictError) throw error;
      throw new GuestBookingConflictError(
        error instanceof Error ? error.message : "The reservation could not be seated.",
      );
    }
  }

  async rotateQr(input: GuestBookingScope & { expiresAt?: string; tableId: string }, context: CommandContext) {
    if (
      !(await this.repo.location(input)) ||
      (await this.repo.tableCapacity([input.tableId], input.locationId)) === null
    )
      throw new GuestBookingConflictError("The table is invalid for this outlet.");
    const token = randomBytes(32).toString("base64url");
    const id = await this.repo.rotateQr(
      input.locationId,
      input.tableId,
      hash(token),
      input.expiresAt ?? null,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "table-qr.rotated", id, "table-qr-token", { tableId: input.tableId });
    return { path: `/api/v1/qcafe/guest/qr/${token}`, token };
  }

  async resolveQr(token: string) {
    const resolved = await this.repo.resolveQr(hash(token), this.timestamp());
    if (!resolved) throw new GuestBookingConflictError("The table QR token is invalid, expired, or revoked.");
    return { ...resolved, status: "valid" as const };
  }

  async scanner(
    input: {
      acceptedFormats: string[];
      deviceRef: string;
      locationId: string;
      scanPurpose: "inventory" | "order" | "table_entry";
    },
    context: CommandContext,
  ) {
    const businessId = await this.businessId(input.locationId);
    const id = await this.repo.scanner(input, this.timestamp());
    await this.record(context, "scanner.configured", id, "scanner-profile");
    return this.read({ businessId, locationId: input.locationId });
  }

  private async businessId(locationId: string) {
    const businessId = await this.repo.businessId(locationId);
    if (businessId) return businessId;
    throw new GuestBookingConflictError("The outlet business is unavailable.");
  }

  private timestamp() {
    return this.now().toISOString();
  }
  private record(
    context: CommandContext,
    event: string,
    subjectId: string,
    subjectType: string,
    payload?: Record<string, unknown>,
  ) {
    return this.activity.record(context, { eventType: `qcafe.booking.${event}`, payload, subjectId, subjectType });
  }
}

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
