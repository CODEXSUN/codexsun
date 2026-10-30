import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  ImageProductOption,
  ImageVariantOption,
  ProductImageFilters,
  ProductImageRecord,
  ProductImageSaveInput
} from "./product-image.types.js";
type Row = Record<string, unknown> & {
  id: number | string;
  uuid: string;
  product_information_id: number | string;
  product_title: string;
  variant_id: number | string | null;
  url: string;
  alt_text: string;
  status: "active" | "inactive";
};
export class ProductImageRepository {
  async list(filters: ProductImageFilters = {}) {
    const search = filters.search?.trim().toLowerCase() ?? "",
      productId = filters.productInformationId ?? 0;
    const status = filters.status ?? "";
    const result =
      await sql<Row>`${selectRows()} WHERE (${productId}=0 OR i.product_information_id=${productId}) AND (${status}='' OR i.status=${status}) AND (${search}='' OR LOWER(i.alt_text) LIKE ${`%${search}%`} OR LOWER(p.storefront_title) LIKE ${`%${search}%`}) ORDER BY p.storefront_title,i.sort_order,i.id`.execute(
        getEcommerceDatabase()
      );
    return result.rows.map(toRecord);
  }
  async find(id: number) {
    const result = await sql<Row>`${selectRows()} WHERE i.id=${id} LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }
  async productOptions() {
    const result = await sql<{
      id: number | string;
      title: string;
    }>`SELECT id,storefront_title AS title FROM ecommerce_product_information WHERE publication_status<>'archived' ORDER BY storefront_title`.execute(
      getEcommerceDatabase()
    );
    return result.rows.map((r) => ({ id: Number(r.id), title: r.title })) as ImageProductOption[];
  }
  async variantOptions() {
    const result = await sql<{
      id: number | string;
      product_information_id: number | string;
      title: string;
      sku: string;
    }>`SELECT id,product_information_id,title,sku FROM ecommerce_product_variants WHERE status='active' ORDER BY title`.execute(
      getEcommerceDatabase()
    );
    return result.rows.map((r) => ({
      id: Number(r.id),
      productInformationId: Number(r.product_information_id),
      title: r.title,
      sku: r.sku
    })) as ImageVariantOption[];
  }
  async parentsValid(productId: number, variantId: number | null) {
    const product = await sql<{
      id: number;
    }>`SELECT id FROM ecommerce_product_information WHERE id=${productId} AND publication_status<>'archived' LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    if (!product.rows[0]) return false;
    if (!variantId) return true;
    const variant = await sql<{
      id: number;
    }>`SELECT id FROM ecommerce_product_variants WHERE id=${variantId} AND product_information_id=${productId} LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return Boolean(variant.rows[0]);
  }
  async create(input: ProductImageSaveInput) {
    await this.clearPrimary(input);
    const result =
      await sql`INSERT INTO ecommerce_product_images (uuid,product_information_id,variant_id,url,alt_text,caption,sort_order,is_primary,status) VALUES (${randomBytes(4).toString("hex")},${input.productInformationId},${input.variantId},${input.url},${input.altText},${input.caption},${input.sortOrder},${input.isPrimary ? 1 : 0},${input.status})`.execute(
        getEcommerceDatabase()
      );
    return this.find(Number(result.insertId));
  }
  async update(id: number, input: ProductImageSaveInput) {
    await this.clearPrimary(input, id);
    await sql`UPDATE ecommerce_product_images SET product_information_id=${input.productInformationId},variant_id=${input.variantId},url=${input.url},alt_text=${input.altText},caption=${input.caption},sort_order=${input.sortOrder},is_primary=${input.isPrimary ? 1 : 0},status=${input.status},updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getEcommerceDatabase()
    );
    return this.find(id);
  }
  async setActive(id: number, active: boolean) {
    await sql`UPDATE ecommerce_product_images SET status=${active ? "active" : "inactive"},updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getEcommerceDatabase()
    );
    return this.find(id);
  }
  private async clearPrimary(input: ProductImageSaveInput, exceptId = 0) {
    if (!input.isPrimary) return;
    await sql`UPDATE ecommerce_product_images SET is_primary=0 WHERE product_information_id=${input.productInformationId} AND (${exceptId}=0 OR id<>${exceptId})`.execute(
      getEcommerceDatabase()
    );
  }
}
function selectRows() {
  return sql`SELECT i.*,p.storefront_title AS product_title,v.title AS variant_title FROM ecommerce_product_images i INNER JOIN ecommerce_product_information p ON p.id=i.product_information_id LEFT JOIN ecommerce_product_variants v ON v.id=i.variant_id`;
}
function toRecord(r: Row): ProductImageRecord {
  return {
    id: Number(r.id),
    uuid: r.uuid,
    productInformationId: Number(r.product_information_id),
    productTitle: String(r.product_title),
    variantId: r.variant_id == null ? null : Number(r.variant_id),
    variantTitle: r.variant_title ? String(r.variant_title) : null,
    url: r.url,
    altText: r.alt_text,
    caption: String(r.caption ?? ""),
    sortOrder: Number(r.sort_order ?? 1000),
    isPrimary: Boolean(r.is_primary),
    status: r.status,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString()
  };
}
