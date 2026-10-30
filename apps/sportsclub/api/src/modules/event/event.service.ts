import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import { eventPayloadSchema } from "./event.schema.js";
import type { EventRepository } from "./event.repository.js";
import type { EventListQuery, EventRecord, PublicEvent } from "./event.types.js";
import type { ListResponse } from "../../sportsclub.pagination.js";

export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly context: SportsclubContext
  ) {}

  async listPublic(): Promise<PublicEvent[]> {
    return this.repository.listApprovedPublic();
  }

  async list(query?: EventListQuery): Promise<ListResponse<EventRecord>> {
    this.assertAdmin();
    return this.repository.list(query);
  }

  async get(uuid: string): Promise<EventRecord> {
    const event = await this.repository.find(uuid);
    if (!event) {
      throw AppError.notFound("Event not found.");
    }
    return event;
  }

  async create(input: unknown): Promise<EventRecord> {
    this.assertAdmin();
    const payload = eventPayloadSchema.parse(input);
    return this.repository.save(null, payload);
  }

  async update(uuid: string, input: unknown): Promise<EventRecord> {
    this.assertAdmin();
    const payload = eventPayloadSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Event not found.");
    }
    return this.repository.save(uuid, payload);
  }

  async delete(uuid: string): Promise<void> {
    this.assertAdmin();
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Event not found.");
    }
    await this.repository.forceDelete(uuid);
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }
}
