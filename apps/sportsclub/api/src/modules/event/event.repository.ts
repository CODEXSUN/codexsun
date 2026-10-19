import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { EventListQuery, EventPayload, EventRecord, PublicEvent } from "./event.types.js";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
  type ListResponse
} from "../../sportsclub.pagination.js";

export class EventRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async list(query?: EventListQuery): Promise<ListResponse<EventRecord>> {
    const page = typeof query?.page === "number" ? query.page : Number(query?.page ?? 1) || 1;
    const pageSize = DEFAULT_PAGE_SIZE;
    const search = query?.search?.trim();

    let baseQuery = this.db.selectFrom("sportsclub_events");

    if (query?.eventType) {
      baseQuery = baseQuery.where("event_type", "=", query.eventType);
    }
    if (query?.status) {
      baseQuery = baseQuery.where("status", "=", query.status);
    }
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("title", "like", term),
          eb("description", "like", term),
          eb("location", "like", term)
        ])
      );
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQuery
      .selectAll()
      .orderBy("event_date", "desc")
      .orderBy("id", "desc")
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    const items = rows.map(toRecord);

    return {
      items,
      total,
      pagination: calculatePagination(total, page, pageSize)
    };
  }

  async listApprovedPublic(): Promise<PublicEvent[]> {
    const rows = await this.db
      .selectFrom("sportsclub_events")
      .select(["uuid", "title", "event_type", "description", "event_date", "end_date", "location"])
      .where("is_approved_public", "=", 1)
      .where("status", "in", ["upcoming", "ongoing"])
      .orderBy("event_date", "asc")
      .execute();

    return rows.map((row) => ({
      uuid: row.uuid,
      title: row.title,
      eventType: row.event_type as PublicEvent["eventType"],
      description: row.description,
      eventDate: row.event_date,
      endDate: row.end_date,
      location: row.location
    }));
  }

  async find(uuid: string): Promise<EventRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_events")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async save(uuid: string | null, value: EventPayload): Promise<EventRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data = {
      title: value.title.trim(),
      event_type: value.eventType,
      description: value.description.trim(),
      event_date: value.eventDate.trim(),
      end_date: value.endDate ? value.endDate.trim() : null,
      location: value.location.trim(),
      is_approved_public: value.isApprovedPublic ? 1 : 0,
      status: value.status,
      revision: value.revision + 1,
      updated_at: now
    };

    const current = uuid ? await this.find(uuid) : undefined;

    if (current) {
      const result = await this.db
        .updateTable("sportsclub_events")
        .set(data)
        .where("uuid", "=", uuid)
        .where("revision", "=", value.revision)
        .executeTakeFirst();

      if (!Number(result.numUpdatedRows)) {
        throw AppError.conflict("This event changed. Reload before saving.");
      }
    } else {
      await this.db
        .insertInto("sportsclub_events")
        .values({
          ...data,
          uuid: key,
          created_at: now
        })
        .execute();
    }

    return (await this.find(key))!;
  }

  async forceDelete(uuid: string): Promise<void> {
    const result = await this.db
      .deleteFrom("sportsclub_events")
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Event not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  title: string;
  event_type: "demonstration" | "tournament" | "workshop" | "camp";
  description: string;
  event_date: string;
  end_date: string | null;
  location: string;
  is_approved_public: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  revision: number;
  created_at: string;
  updated_at: string;
}): EventRecord {
  return {
    uuid: row.uuid,
    title: row.title,
    eventType: row.event_type,
    description: row.description,
    eventDate: row.event_date,
    endDate: row.end_date,
    location: row.location,
    isApprovedPublic: Boolean(row.is_approved_public),
    status: row.status,
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
