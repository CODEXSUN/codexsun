import { AppError } from "@codexsun/framework/errors";
import { ProductImageRepository } from "./product-image.repository.js";
import type { ProductImageFilters, ProductImageSaveInput } from "./product-image.types.js";
export class ProductImageService {
  constructor(private readonly repository = new ProductImageRepository()) {}
  list(filters: ProductImageFilters = {}) {
    return this.repository.list(filters);
  }
  find(id: number) {
    return this.repository.find(id);
  }
  productOptions() {
    return this.repository.productOptions();
  }
  variantOptions() {
    return this.repository.variantOptions();
  }
  async create(input: ProductImageSaveInput) {
    const value = await this.validate(input);
    return this.repository.create(value);
  }
  async update(id: number, input: ProductImageSaveInput) {
    if (!(await this.repository.find(id))) throw AppError.notFound("Product image was not found.");
    const value = await this.validate(input);
    return this.repository.update(id, value);
  }
  setActive(id: number, active: boolean) {
    return this.repository.setActive(id, active);
  }
  private async validate(input: ProductImageSaveInput) {
    let url: URL;
    try {
      url = new URL(input.url);
    } catch {
      throw AppError.validation("Image URL must be valid.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw AppError.validation("Image URL must use HTTP or HTTPS.");
    if (!(await this.repository.parentsValid(input.productInformationId, input.variantId)))
      throw AppError.validation("The selected Product Details or Variant is invalid.");
    return { ...input, url: url.toString(), altText: input.altText.trim() };
  }
}
