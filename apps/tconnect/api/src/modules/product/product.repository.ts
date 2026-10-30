import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { ProductInput, ProductRecord } from "./product.types.js";
export class ProductRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async search(q: string) {
    const term = `%${q}%`;
    return (
      await sql<
        import("./product.types.js").CatalogProduct
      >`SELECT p.uuid,p.company_uuid AS companyUuid,p.name,p.category,p.description,CAST(p.price AS DOUBLE) AS price,p.unit,p.minimum_order AS minimumOrder,p.image_data_url AS imageDataUrl,p.status,c.name AS sellerName,c.slug AS sellerSlug,c.city,c.industry FROM tconnect_products p INNER JOIN tconnect_companies c ON c.uuid=p.company_uuid WHERE p.status='active' AND c.status='active' AND (p.name LIKE ${term} OR p.category LIKE ${term} OR p.description LIKE ${term} OR c.name LIKE ${term} OR c.city LIKE ${term} OR c.industry LIKE ${term}) ORDER BY p.id DESC LIMIT 100`.execute(
        this.database
      )
    ).rows;
  }
  async list(companyUuid: string | null, publicOnly: boolean) {
    return (
      await sql<ProductRecord>`SELECT p.uuid,p.company_uuid AS companyUuid,p.name,p.category,p.description,CAST(p.price AS DOUBLE) AS price,p.unit,p.minimum_order AS minimumOrder,p.image_data_url AS imageDataUrl,p.status FROM tconnect_products p INNER JOIN tconnect_companies c ON c.uuid=p.company_uuid WHERE (${companyUuid} IS NULL OR p.company_uuid=${companyUuid}) AND (${publicOnly ? 1 : 0}=0 OR (p.status='active' AND c.status='active')) ORDER BY p.id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async lock(uuid: string, companyUuid: string | null) {
    return (
      (
        await sql`SELECT id FROM tconnect_products WHERE uuid=${uuid} AND (${companyUuid} IS NULL OR company_uuid=${companyUuid}) FOR UPDATE`.execute(
          this.database
        )
      ).rows.length > 0
    );
  }
  async save(input: ProductInput, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    if (uuid)
      await sql`UPDATE tconnect_products SET company_uuid=${input.companyUuid},name=${input.name},category=${input.category},description=${input.description},price=${input.price},unit=${input.unit},minimum_order=${input.minimumOrder},image_data_url=${input.imageDataUrl},status=${input.status} WHERE uuid=${uuid}`.execute(
        this.database
      );
    else
      await sql`INSERT INTO tconnect_products (uuid,company_uuid,name,category,description,price,unit,minimum_order,image_data_url,status) VALUES (${key},${input.companyUuid},${input.name},${input.category},${input.description},${input.price},${input.unit},${input.minimumOrder},${input.imageDataUrl},${input.status})`.execute(
        this.database
      );
    return { ...input, uuid: key };
  }
}
