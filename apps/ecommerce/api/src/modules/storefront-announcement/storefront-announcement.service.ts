import { AppError } from "@codexsun/framework/errors";
import { StorefrontAnnouncementRepository } from "./storefront-announcement.repository.js";
import { invalidateStorefrontReadCache } from "../storefront/index.js";
import type { StorefrontAnnouncementInput } from "./storefront-announcement.types.js";

export class StorefrontAnnouncementService {
  constructor(private readonly repository = new StorefrontAnnouncementRepository()) {}

  active() {
    return this.repository.active();
  }

  list() {
    return this.repository.list();
  }

  async trigger(input: StorefrontAnnouncementInput) {
    const record = requiredResult(await this.repository.create(normalize(input)));
    invalidateStorefrontReadCache();
    return record;
  }

  async update(id: number, input: StorefrontAnnouncementInput) {
    await this.required(id);
    const record = requiredResult(await this.repository.update(id, normalize(input)));
    invalidateStorefrontReadCache();
    return record;
  }

  async setActive(id: number, active: boolean) {
    await this.required(id);
    const record = requiredResult(await this.repository.setActive(id, active));
    invalidateStorefrontReadCache();
    return record;
  }

  async forceDelete(id: number) {
    await this.required(id);
    const record = requiredResult(await this.repository.forceDelete(id));
    invalidateStorefrontReadCache();
    return record;
  }

  private async required(id: number) {
    const record = await this.repository.find(id);
    if (!record) throw AppError.notFound("Storefront announcement was not found.");
    return record;
  }
}

function requiredResult<T>(record: T | null): T {
  if (!record) throw AppError.notFound("Storefront announcement was not found.");
  return record;
}

function normalize(input: StorefrontAnnouncementInput): Required<StorefrontAnnouncementInput> {
  const message = input.message.trim();
  if (!message) throw AppError.validation("Announcement message is required.");
  const duration = Math.min(60_000, Math.max(3_000, Number(input.displayDurationMs ?? 12_000)));
  return {
    displayDurationMs: duration,
    endsAt: input.endsAt ? sqlDate(input.endsAt) : null,
    message,
    startsAt: sqlDate(input.startsAt ?? new Date().toISOString()),
    status: input.status ?? "active"
  };
}

function sqlDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw AppError.validation("Announcement date is invalid.");
  return date.toISOString().slice(0, 19).replace("T", " ");
}
