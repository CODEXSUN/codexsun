import { AppError } from "@codexsun/framework/errors";
import { FeaturedCardRepository } from "./featured-card.repository.js";
import { invalidateStorefrontReadCache } from "../storefront/index.js";
import type { FeaturedCardFilters, FeaturedCardSaveInput } from "./featured-card.types.js";

export class FeaturedCardService {
  constructor(private readonly repository = new FeaturedCardRepository()) {}

  list(filters: FeaturedCardFilters = {}) {
    return this.repository.list(filters);
  }

  find(id: number) {
    return this.repository.find(id);
  }

  async create(input: FeaturedCardSaveInput) {
    const record = await this.repository.create(await this.validate(input));
    invalidateStorefrontReadCache();
    return record;
  }

  async update(id: number, input: FeaturedCardSaveInput) {
    if (!(await this.repository.find(id))) throw AppError.notFound("Featured card was not found.");
    const record = await this.repository.update(id, await this.validate(input, id));
    invalidateStorefrontReadCache();
    return record;
  }

  async setActive(id: number, active: boolean) {
    const record = await this.repository.setActive(id, active);
    invalidateStorefrontReadCache();
    return record;
  }

  private async validate(input: FeaturedCardSaveInput, currentId = 0) {
    const existing = await this.repository.findByCode(input.featuredCode);
    if (existing && existing.id !== currentId) {
      throw AppError.conflict("Featured code already exists.");
    }
    if (input.endsAt && input.startsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
      throw AppError.validation("End date must be after the start date.");
    }
    if (input.ishopItem && !(await this.repository.localItemExists(input.ishopItem))) {
      throw AppError.validation("Pull the selected Frappe item into local data before saving.");
    }
    return {
      ...input,
      actionLabel: input.actionLabel.trim(),
      actionUrl: input.actionUrl.trim(),
      badge: input.badge.trim(),
      badgeTint: input.badgeTint.trim(),
      badgeTextColor: input.badgeTextColor.trim(),
      description: input.description.trim(),
      eyebrow: input.eyebrow.trim(),
      imageUrl: input.imageUrl.trim(),
      ishopItem: input.ishopItem?.trim() || null,
      featuredCode: input.featuredCode.trim(),
      title: input.title.trim()
    };
  }
}
