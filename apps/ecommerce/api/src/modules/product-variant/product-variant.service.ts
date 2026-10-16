import { AppError } from "@codexsun/framework/errors";
import { ProductVariantRepository } from "./product-variant.repository.js";
import type { ProductVariantFilters, ProductVariantSaveInput } from "./product-variant.types.js";
export class ProductVariantService {
  constructor(private readonly repository = new ProductVariantRepository()) {}
  list(filters: ProductVariantFilters = {}) {
    return this.repository.list(filters);
  }
  find(id: number) {
    return this.repository.find(id);
  }
  productOptions() {
    return this.repository.productOptions();
  }
  async create(input: ProductVariantSaveInput) {
    const v = await this.validate(input);
    return this.repository.create(v);
  }
  async update(id: number, input: ProductVariantSaveInput) {
    if (!(await this.repository.find(id))) throw AppError.notFound("Variant was not found.");
    const v = await this.validate(input, id);
    return this.repository.update(id, v);
  }
  setActive(id: number, active: boolean) {
    return this.repository.setActive(id, active);
  }
  private async validate(input: ProductVariantSaveInput, exceptId = 0) {
    const sku = input.sku.trim().toUpperCase();
    if (!sku) throw AppError.validation("SKU is required.");
    if (!(await this.repository.productExists(input.productInformationId)))
      throw AppError.validation("Product Details was not found or is archived.");
    if (await this.repository.duplicateSku(sku, exceptId))
      throw AppError.conflict("Variant SKU already exists.");
    return { ...input, sku, title: input.title.trim() || sku };
  }
}
