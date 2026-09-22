import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { CreateCustomer, CreateReservation, GuestBookingScope } from "../contracts/guest-booking.contract.js";

export class GuestBookingRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  async workspace(scope: GuestBookingScope) {
    const customers = await this.db
      .selectFrom("qcafe_customers")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("name")
      .execute();
    const reservations = await this.db
      .selectFrom("qcafe_reservations")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .orderBy("arrival_at", "desc")
      .execute();
    const ids = reservations.map((reservation) => reservation.id);
    const orderIds = reservations.flatMap((reservation) => (reservation.order_id ? [reservation.order_id] : []));
    const bills = orderIds.length
      ? await this.db
          .selectFrom("qcafe_bills")
          .select(["id", "order_id", "status"])
          .where("order_id", "in", orderIds)
          .execute()
      : [];
    return {
      customers,
      reservations,
      reservationTables: ids.length
        ? await this.db.selectFrom("qcafe_reservation_tables").selectAll().where("reservation_id", "in", ids).execute()
        : [],
      reservationEvents: ids.length
        ? await this.db
            .selectFrom("qcafe_reservation_events")
            .selectAll()
            .where("reservation_id", "in", ids)
            .orderBy("occurred_at", "desc")
            .execute()
        : [],
      reservationBills: reservations.flatMap((reservation) => {
        const bill = bills.find((candidate) => candidate.order_id === reservation.order_id);
        return bill ? [{ billId: bill.id, billStatus: bill.status, reservationId: reservation.id }] : [];
      }),
      qrTokens: await this.db
        .selectFrom("qcafe_table_qr_tokens")
        .select(["id", "table_id", "version", "valid_from", "expires_at", "revoked_at"])
        .where("location_id", "=", scope.locationId)
        .orderBy("valid_from", "desc")
        .execute(),
      scannerProfiles: await this.db
        .selectFrom("qcafe_scanner_profiles")
        .selectAll()
        .where("location_id", "=", scope.locationId)
        .orderBy("device_ref")
        .execute(),
    };
  }

  location(scope: GuestBookingScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }
  async businessId(locationId: string) {
    return (
      await this.db.selectFrom("qcafe_locations").select("business_id").where("id", "=", locationId).executeTakeFirst()
    )?.business_id;
  }
  customer(id: string) {
    return this.db.selectFrom("qcafe_customers").selectAll().where("id", "=", id).executeTakeFirst();
  }
  reservation(id: string) {
    return this.db.selectFrom("qcafe_reservations").selectAll().where("id", "=", id).executeTakeFirst();
  }
  reservationTableIds(id: string) {
    return this.db.selectFrom("qcafe_reservation_tables").select("table_id").where("reservation_id", "=", id).execute();
  }

  async tableCapacity(tableIds: string[], locationId: string) {
    const tables = await this.db
      .selectFrom("qcafe_dining_tables")
      .innerJoin("qcafe_dining_areas", "qcafe_dining_areas.id", "qcafe_dining_tables.area_id")
      .select(["qcafe_dining_tables.id", "qcafe_dining_tables.capacity"])
      .where("qcafe_dining_tables.id", "in", tableIds)
      .where("qcafe_dining_tables.active", "=", 1)
      .where("qcafe_dining_areas.location_id", "=", locationId)
      .execute();
    return tables.length === new Set(tableIds).size ? tables.reduce((sum, table) => sum + table.capacity, 0) : null;
  }

  async createCustomer(input: CreateCustomer, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_customers")
      .values({
        business_id: input.businessId,
        created_at: now,
        email: input.email ?? null,
        email_consent: Number(input.emailConsent),
        external_reference: input.externalReference ?? null,
        id,
        marketing_consent: Number(input.marketingConsent),
        name: input.name,
        phone: input.phone ?? null,
        updated_at: now,
        whatsapp_consent: Number(input.whatsappConsent),
      })
      .execute();
    return id;
  }

  async createReservation(input: CreateReservation, actor: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const id = randomUUID();
      await tx
        .insertInto("qcafe_reservations")
        .values({
          arrival_at: input.arrivalAt,
          created_at: now,
          customer_id: input.customerId,
          duration_minutes: input.durationMinutes,
          id,
          location_id: input.locationId,
          notes: input.notes ?? null,
          order_id: null,
          party_size: input.partySize,
          source: input.source,
          status: "requested",
          table_session_id: null,
          updated_at: now,
        })
        .execute();
      await tx
        .insertInto("qcafe_reservation_tables")
        .values(
          input.tableIds.map((tableId) => ({
            assigned_at: now,
            id: randomUUID(),
            reservation_id: id,
            table_id: tableId,
          })),
        )
        .execute();
      await reservationEvent(tx, id, "requested", actor, input.notes ?? null, now);
      return id;
    });
  }

  async hasConflict(reservationId: string, tableIds: string[], arrivalAt: string, endsAt: string) {
    const matches = await this.db
      .selectFrom("qcafe_reservations")
      .innerJoin("qcafe_reservation_tables", "qcafe_reservation_tables.reservation_id", "qcafe_reservations.id")
      .select(["qcafe_reservations.arrival_at", "qcafe_reservations.duration_minutes"])
      .where("qcafe_reservations.id", "!=", reservationId)
      .where("qcafe_reservations.status", "in", ["confirmed", "seated"])
      .where("qcafe_reservation_tables.table_id", "in", tableIds)
      .execute();
    return matches.some((match) => {
      const existingEnd = new Date(
        new Date(match.arrival_at).getTime() + match.duration_minutes * 60_000,
      ).toISOString();
      return arrivalAt < existingEnd && match.arrival_at < endsAt;
    });
  }

  async transition(
    id: string,
    status: QcafeFoundationDatabase["qcafe_reservations"]["status"],
    eventType: string,
    actor: string,
    note: string | null,
    now: string,
  ) {
    await this.db.transaction().execute(async (tx) => {
      await tx.updateTable("qcafe_reservations").set({ status, updated_at: now }).where("id", "=", id).execute();
      await reservationEvent(tx, id, eventType, actor, note, now);
    });
  }

  async seat(id: string, sessionId: string, orderId: string, actor: string, now: string) {
    await this.db.transaction().execute(async (tx) => {
      await tx
        .updateTable("qcafe_reservations")
        .set({ order_id: orderId, status: "seated", table_session_id: sessionId, updated_at: now })
        .where("id", "=", id)
        .execute();
      await reservationEvent(tx, id, "seated", actor, null, now);
    });
  }

  async rotateQr(
    locationId: string,
    tableId: string,
    hash: string,
    expiresAt: string | null,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const current = await tx
        .selectFrom("qcafe_table_qr_tokens")
        .select("version")
        .where("table_id", "=", tableId)
        .orderBy("version", "desc")
        .executeTakeFirst();
      await tx
        .updateTable("qcafe_table_qr_tokens")
        .set({ revoked_at: now })
        .where("table_id", "=", tableId)
        .where("revoked_at", "is", null)
        .execute();
      const id = randomUUID();
      await tx
        .insertInto("qcafe_table_qr_tokens")
        .values({
          created_by: actor,
          expires_at: expiresAt,
          id,
          location_id: locationId,
          revoked_at: null,
          table_id: tableId,
          token_hash: hash,
          valid_from: now,
          version: (current?.version ?? 0) + 1,
        })
        .execute();
      return id;
    });
  }

  async resolveQr(hash: string, now: string) {
    const entry = await this.db
      .selectFrom("qcafe_table_qr_tokens")
      .innerJoin("qcafe_dining_tables", "qcafe_dining_tables.id", "qcafe_table_qr_tokens.table_id")
      .innerJoin("qcafe_dining_areas", "qcafe_dining_areas.id", "qcafe_dining_tables.area_id")
      .innerJoin("qcafe_locations", "qcafe_locations.id", "qcafe_table_qr_tokens.location_id")
      .select([
        "qcafe_dining_tables.id as table_id",
        "qcafe_dining_tables.code as table_code",
        "qcafe_locations.name as location_name",
        "qcafe_table_qr_tokens.expires_at",
        "qcafe_table_qr_tokens.valid_from",
      ])
      .where("qcafe_table_qr_tokens.token_hash", "=", hash)
      .where("qcafe_table_qr_tokens.revoked_at", "is", null)
      .where("qcafe_dining_tables.active", "=", 1)
      .executeTakeFirst();
    if (!entry || entry.valid_from > now || (entry.expires_at && entry.expires_at <= now)) return null;
    const session = await this.db
      .selectFrom("qcafe_table_session_tables")
      .innerJoin("qcafe_table_sessions", "qcafe_table_sessions.id", "qcafe_table_session_tables.session_id")
      .select("qcafe_table_sessions.id")
      .where("qcafe_table_session_tables.table_id", "=", entry.table_id)
      .where("qcafe_table_sessions.status", "=", "open")
      .executeTakeFirst();
    return { locationName: entry.location_name, sessionOpen: Boolean(session), tableCode: entry.table_code };
  }

  async scanner(
    input: {
      acceptedFormats: string[];
      deviceRef: string;
      locationId: string;
      scanPurpose: QcafeFoundationDatabase["qcafe_scanner_profiles"]["scan_purpose"];
    },
    now: string,
  ) {
    const existing = await this.db
      .selectFrom("qcafe_scanner_profiles")
      .select("id")
      .where("device_ref", "=", input.deviceRef)
      .where("scan_purpose", "=", input.scanPurpose)
      .executeTakeFirst();
    if (existing) {
      await this.db
        .updateTable("qcafe_scanner_profiles")
        .set({
          accepted_formats_json: JSON.stringify(input.acceptedFormats),
          active: 1,
          location_id: input.locationId,
          updated_at: now,
        })
        .where("id", "=", existing.id)
        .execute();
      return existing.id;
    }
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_scanner_profiles")
      .values({
        accepted_formats_json: JSON.stringify(input.acceptedFormats),
        active: 1,
        created_at: now,
        device_ref: input.deviceRef,
        id,
        location_id: input.locationId,
        scan_purpose: input.scanPurpose,
        updated_at: now,
      })
      .execute();
    return id;
  }
}

async function reservationEvent(
  db: Kysely<QcafeFoundationDatabase>,
  reservationId: string,
  eventType: string,
  actor: string,
  note: string | null,
  now: string,
) {
  await db
    .insertInto("qcafe_reservation_events")
    .values({
      actor_ref: actor,
      event_type: eventType,
      id: randomUUID(),
      note,
      occurred_at: now,
      reservation_id: reservationId,
    })
    .execute();
}
