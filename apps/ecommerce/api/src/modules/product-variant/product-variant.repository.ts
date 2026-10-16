import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  ProductInformationOption,
  ProductVariantFilters,
  ProductVariantRecord,
  ProductVariantSaveInput
} from "./product-variant.types.js";
type Row = Record<string, unknown> & {
  id: number | string;
  uuid: string;
  product_information_id: number | string;
  product_title: string;
  sku: string;
  title: string;
  status: "active" | "inactive";
};
export class ProductVariantRepository {
  async list(filters: ProductVariantFilters = {}) {
    const search = filters.search?.trim().toLowerCase() ?? "";
    const productId = filters.productInformationId ?? 0;
    const status = filters.status ?? "";
    const result =
      await sql<Row>`${selectRows()} WHERE (${productId}=0 OR v.product_information_id=${productId}) AND (${status}='' OR v.status=${status}) AND (${search}='' OR LOWER(v.sku) LIKE ${`%${search}%`} OR LOWER(v.title) LIKE ${`%${search}%`}) ORDER BY p.storefront_title,v.sort_order,v.id`.execute(
        getEcommerceDatabase()
      );
    return result.rows.map(toRecord);
  }
  async find(id: number) {
    const result = await sql<Row>`${selectRows()} WHERE v.id=${id} LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }
  async productOptions() {
    const result = await sql<{
      id: number | string;
      title: string;
    }>`SELECT id,storefront_title AS title FROM ecommerce_product_information WHERE publication_status<>'archived' ORDER BY storefront_title,id`.execute(
      getEcommerceDatabase()
    );
    return result.rows.map((r) => ({
      id: Number(r.id),
      title: r.title
    })) as ProductInformationOption[];
  }
  async productExists(id: number) {
    const result = await sql<{
      id: number;
    }>`SELECT id FROM ecommerce_product_information WHERE id=${id} AND publication_status<>'archived' LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return Boolean(result.rows[0]);
  }
  async duplicateSku(sku: string, exceptId = 0) {
    const result = await sql<{
      id: number;
    }>`SELECT id FROM ecommerce_product_variants WHERE sku=${sku} AND (${exceptId}=0 OR id<>${exceptId}) LIMIT 1`.execute(
      getEcommerceDatabase()
    );
    return Boolean(result.rows[0]);
  }
  async create(input: ProductVariantSaveInput) {
    const result =
      await sql`INSERT INTO ecommerce_product_variants (uuid,product_information_id,sku,title,barcode,option_1_name,option_1_value,option_2_name,option_2_value,option_3_name,option_3_value,price_adjustment,compare_at_adjustment,cost_adjustment,weight,sort_order,status) VALUES (${randomBytes(4).toString("hex")},${input.productInformationId},${input.sku},${input.title},${input.barcode},${input.option1Name},${input.option1Value},${input.option2Name},${input.option2Value},${input.option3Name},${input.option3Value},${input.priceAdjustment},${input.compareAtAdjustment},${input.costAdjustment},${input.weight},${input.sortOrder},${input.status})`.execute(
        getEcommerceDatabase()
      );
    return this.find(Number(result.insertId));
  }
  async update(id: number, input: ProductVariantSaveInput) {
    await sql`UPDATE ecommerce_product_variants SET product_information_id=${input.productInformationId},sku=${input.sku},title=${input.title},barcode=${input.barcode},option_1_name=${input.option1Name},option_1_value=${input.option1Value},option_2_name=${input.option2Name},option_2_value=${input.option2Value},option_3_name=${input.option3Name},option_3_value=${input.option3Value},price_adjustment=${input.priceAdjustment},compare_at_adjustment=${input.compareAtAdjustment},cost_adjustment=${input.costAdjustment},weight=${input.weight},sort_order=${input.sortOrder},status=${input.status},updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getEcommerceDatabase()
    );
    return this.find(id);
  }
  async setActive(id: number, active: boolean) {
    await sql`UPDATE ecommerce_product_variants SET status=${active ? "active" : "inactive"},updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getEcommerceDatabase()
    );
    return this.find(id);
  }
}
function selectRows() {
  return sql`SELECT v.*,p.storefront_title AS product_title FROM ecommerce_product_variants v INNER JOIN ecommerce_product_information p ON p.id=v.product_information_id`;
}
function toRecord(r: Row): ProductVariantRecord {
  return {
    id: Number(r.id),
    uuid: r.uuid,
    productInformationId: Number(r.product_information_id),
    productTitle: String(r.product_title),
    sku: r.sku,
    title: r.title,
    barcode: String(r.barcode ?? ""),
    option1Name: String(r.option_1_name ?? ""),
    option1Value: String(r.option_1_value ?? ""),
    option2Name: String(r.option_2_name ?? ""),
    option2Value: String(r.option_2_value ?? ""),
    option3Name: String(r.option_3_name ?? ""),
    option3Value: String(r.option_3_value ?? ""),
    priceAdjustment: Number(r.price_adjustment ?? 0),
    compareAtAdjustment: Number(r.compare_at_adjustment ?? 0),
    costAdjustment: Number(r.cost_adjustment ?? 0),
    weight: Number(r.weight ?? 0),
    sortOrder: Number(r.sort_order ?? 1000),
    status: r.status,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString()
  };
}
