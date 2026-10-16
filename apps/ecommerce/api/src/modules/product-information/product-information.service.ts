import { AppError } from "@codexsun/framework/errors";
import { ProductInformationRepository } from "./product-information.repository.js";
import type {
  ProductInformationFilters,
  ProductInformationSaveInput
} from "./product-information.types.js";

export class ProductInformationService {
  constructor(private readonly repository = new ProductInformationRepository()) {}
  list(filters: ProductInformationFilters = {}) {
    return this.repository.list(filters);
  }
  find(id: number) {
    return this.repository.find(id);
  }
  coreProductOptions() {
    return this.repository.coreProductOptions();
  }
  coreBrandOptions() {
    return this.repository.coreBrandOptions();
  }

  async create(input: ProductInformationSaveInput) {
    const value = normalize(input);
    await this.validate(value);
    return this.repository.create(value);
  }
  async update(id: number, input: ProductInformationSaveInput) {
    if (!(await this.repository.find(id)))
      throw AppError.notFound("Product information was not found.");
    const value = normalize(input);
    await this.validate(value, id);
    return this.repository.update(id, value);
  }
  async archive(id: number) {
    if (!(await this.repository.find(id)))
      throw AppError.notFound("Product information was not found.");
    return this.repository.archive(id);
  }

  private async validate(input: ProductInformationSaveInput, exceptId?: number) {
    if (!(await this.repository.coreProductExists(input.coreProductId))) {
      throw AppError.validation("The selected Core product was not found or is inactive.");
    }
    if (input.brandId && !(await this.repository.coreBrandExists(input.brandId))) {
      throw AppError.validation("The selected Core brand was not found or is inactive.");
    }
    if (await this.repository.duplicate(input.coreProductId, input.slug, exceptId)) {
      throw AppError.conflict(
        "The Core product or storefront slug already has product information."
      );
    }
  }
}

function normalize(input: ProductInformationSaveInput): ProductInformationSaveInput {
  const title = input.storefrontTitle.trim();
  const slug = input.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
  if (!title) throw AppError.validation("Storefront title is required.");
  if (!slug) throw AppError.validation("A valid storefront slug is required.");
  const minimum = Math.max(1, Number(input.minimumOrderQuantity ?? 1));
  const maximum = input.maximumOrderQuantity == null ? null : Number(input.maximumOrderQuantity);
  if (maximum !== null && maximum < minimum) {
    throw AppError.validation("Maximum order quantity must be at least the minimum quantity.");
  }
  return {
    ...input,
    storefrontTitle: title,
    slug,
    bulletPoints: (input.bulletPoints ?? []).map((item) => item.trim()).filter(Boolean),
    minimumOrderQuantity: minimum,
    maximumOrderQuantity: maximum
  };
}
