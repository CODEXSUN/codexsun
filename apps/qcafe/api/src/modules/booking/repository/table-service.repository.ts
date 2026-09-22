import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
export class TableServiceRepository {
  constructor(private db: Kysely<QcafeFoundationDatabase>) {}
  async workspace(businessId: string, locationId: string) {
    const areas = await this.db
        .selectFrom("qcafe_dining_areas")
        .innerJoin("qcafe_locations", "qcafe_locations.id", "qcafe_dining_areas.location_id")
        .selectAll("qcafe_dining_areas")
        .where("qcafe_locations.business_id", "=", businessId)
        .where("qcafe_dining_areas.location_id", "=", locationId)
        .execute(),
      areaIds = areas.map((a) => a.id),
      tables = areaIds.length
        ? await this.db.selectFrom("qcafe_dining_tables").selectAll().where("area_id", "in", areaIds).execute()
        : [],
      sessions = await this.db
        .selectFrom("qcafe_table_sessions")
        .selectAll()
        .where("location_id", "=", locationId)
        .orderBy("opened_at", "desc")
        .execute(),
      sessionIds = sessions.map((s) => s.id),
      sessionTables = sessionIds.length
        ? await this.db
            .selectFrom("qcafe_table_session_tables")
            .selectAll()
            .where("session_id", "in", sessionIds)
            .execute()
        : [];
    return { areas, tables, sessions, sessionTables };
  }
  async area(
    input: { locationId: string; name: string; kind: "dining" | "bar" | "terrace" | "private"; sortOrder: number },
    now: string,
  ) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_dining_areas")
      .values({
        id,
        location_id: input.locationId,
        name: input.name,
        kind: input.kind,
        sort_order: input.sortOrder,
        active: 1,
        created_at: now,
        updated_at: now,
      })
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
  areaAtLocation(areaId: string, locationId: string) {
    return this.db
      .selectFrom("qcafe_dining_areas")
      .select("id")
      .where("id", "=", areaId)
      .where("location_id", "=", locationId)
      .where("active", "=", 1)
      .executeTakeFirst();
  }
  async tablesAtLocation(tableIds: string[], locationId: string) {
    const rows = await this.db
      .selectFrom("qcafe_dining_tables")
      .innerJoin("qcafe_dining_areas", "qcafe_dining_areas.id", "qcafe_dining_tables.area_id")
      .select("qcafe_dining_tables.id")
      .where("qcafe_dining_tables.id", "in", tableIds)
      .where("qcafe_dining_tables.active", "=", 1)
      .where("qcafe_dining_areas.location_id", "=", locationId)
      .where("qcafe_dining_areas.active", "=", 1)
      .execute();
    return rows.length === new Set(tableIds).size;
  }
  async businessId(locationId: string) {
    return (
      await this.db.selectFrom("qcafe_locations").select("business_id").where("id", "=", locationId).executeTakeFirst()
    )?.business_id;
  }
  async table(input: { areaId: string; code: string; capacity: number; positionLabel?: string }, now: string) {
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_dining_tables")
      .values({
        id,
        area_id: input.areaId,
        code: input.code,
        capacity: input.capacity,
        position_label: input.positionLabel ?? null,
        active: 1,
        created_at: now,
        updated_at: now,
      })
      .execute();
    return id;
  }
  async open(locationId: string, tableIds: string[], guestCount: number, actor: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const occupied = await tx
        .selectFrom("qcafe_table_session_tables")
        .innerJoin("qcafe_table_sessions", "qcafe_table_sessions.id", "qcafe_table_session_tables.session_id")
        .select("table_id")
        .where("table_id", "in", tableIds)
        .where("qcafe_table_sessions.status", "=", "open")
        .execute();
      if (occupied.length) throw new Error("occupied");
      const id = randomUUID();
      await tx
        .insertInto("qcafe_table_sessions")
        .values({
          id,
          location_id: locationId,
          status: "open",
          guest_count: guestCount,
          primary_order_id: null,
          opened_at: now,
          closed_at: null,
          opened_by: actor,
          closed_by: null,
        })
        .execute();
      await tx
        .insertInto("qcafe_table_session_tables")
        .values(tableIds.map((tableId) => ({ id: randomUUID(), session_id: id, table_id: tableId, created_at: now })))
        .execute();
      return id;
    });
  }
  session(id: string) {
    return this.db.selectFrom("qcafe_table_sessions").selectAll().where("id", "=", id).executeTakeFirst();
  }
  async close(id: string, actor: string, now: string) {
    await this.db
      .updateTable("qcafe_table_sessions")
      .set({ status: "closed", closed_at: now, closed_by: actor })
      .where("id", "=", id)
      .execute();
  }
}
