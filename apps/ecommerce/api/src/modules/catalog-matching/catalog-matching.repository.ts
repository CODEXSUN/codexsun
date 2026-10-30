import { randomBytes, randomUUID } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { getEcommerceDatabase, type EcommerceDatabase } from "../../database/ecommerce-database.js";
import type {
  CatalogMatchCandidate,
  CatalogMatchDecision,
  CatalogMatchFilters,
  CatalogMatchInput,
  CatalogMatchRecord,
  CatalogMatchStatus
} from "./catalog-matching.types.js";

type Row = Record<string, unknown> & {
  correlation_id: string;
  id: number | string;
  query_json: unknown;
  source_reference: string;
  status: CatalogMatchStatus;
  strategy: CatalogMatchRecord["strategy"];
  uuid: string;
};

export type PendingCatalogMatchEvent = {
  aggregateId: string;
  attempts: number;
  correlationId: string;
  eventName: string;
  id: number;
  payload: Record<string, unknown>;
};

export class CatalogMatchingRepository {
  async candidates(): Promise<CatalogMatchCandidate[]> {
    const result = await sql<Record<string, unknown>>`
      SELECT
        product.id AS product_information_id,
        variant.id AS variant_id,
        variant.sku,
        variant.barcode,
        product.slug,
        product.storefront_title AS title,
        COALESCE(brand.name, '') AS brand
      FROM ecommerce_product_information product
      LEFT JOIN core_brands brand ON brand.id = product.brand_id
      LEFT JOIN ecommerce_product_variants variant
        ON variant.product_information_id = product.id
        AND variant.status = 'active'
      WHERE product.publication_status <> 'archived'
    `.execute(getEcommerceDatabase());

    return result.rows.map((row) => ({
      barcode: String(row.barcode ?? ""),
      brand: String(row.brand ?? ""),
      productInformationId: Number(row.product_information_id),
      sku: String(row.sku ?? ""),
      slug: String(row.slug ?? ""),
      title: String(row.title ?? ""),
      variantId: row.variant_id == null ? null : Number(row.variant_id)
    }));
  }

  async list(filters: CatalogMatchFilters = {}) {
    const search = filters.search?.trim().toLowerCase() ?? "";
    const status = filters.status ?? "";
    const result = await sql<Row>`
      SELECT *
      FROM ecommerce_catalog_match_requests
      WHERE (${status} = '' OR status = ${status})
        AND (
          ${search} = ''
          OR LOWER(source_reference) LIKE ${`%${search}%`}
          OR LOWER(query_json) LIKE ${`%${search}%`}
        )
      ORDER BY id DESC
      LIMIT 100
    `.execute(getEcommerceDatabase());
    return result.rows.map(toRecord);
  }

  async findBySource(sourceReference: string) {
    return findBySource(getEcommerceDatabase(), sourceReference);
  }

  async saveDecision(
    input: CatalogMatchInput,
    decision: CatalogMatchDecision,
    status: CatalogMatchStatus,
    correlationId = input.correlationId ?? randomUUID()
  ) {
    const database = getEcommerceDatabase();
    const existing = await findBySource(database, input.sourceReference);
    if (existing) return existing;

    return database.transaction().execute(async (transaction) => {
      const requestUuid = randomBytes(8).toString("hex");
      const query = {
        barcode: input.barcode ?? "",
        brand: input.brand ?? "",
        sku: input.sku ?? "",
        slug: input.slug ?? "",
        sourceReference: input.sourceReference,
        title: input.title
      };
      const result = await sql`
        INSERT INTO ecommerce_catalog_match_requests (
          uuid, source_reference, query_json, product_information_id, variant_id,
          strategy, confidence, status, correlation_id
        ) VALUES (
          ${requestUuid}, ${input.sourceReference}, ${JSON.stringify(query)},
          ${decision.candidate?.productInformationId ?? null},
          ${decision.candidate?.variantId ?? null}, ${decision.strategy},
          ${decision.confidence}, ${status}, ${correlationId}
        )
      `.execute(transaction);

      if (status === "semantic_pending") {
        const requestId = Number(result.insertId);
        await sql`
          INSERT INTO ecommerce_catalog_match_outbox (
            uuid, event_name, aggregate_id, idempotency_key, correlation_id, payload_json
          ) VALUES (
            ${randomBytes(8).toString("hex")},
            ${"ecommerce.catalog-match.semantic-requested"},
            ${requestUuid},
            ${`catalog-match:${requestUuid}:semantic:v1`},
            ${correlationId},
            ${JSON.stringify({ matchRequestId: requestId, sourceReference: input.sourceReference })}
          )
        `.execute(transaction);
      }

      return findById(transaction, Number(result.insertId));
    });
  }

  async nextPendingEvent(): Promise<PendingCatalogMatchEvent | null> {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM ecommerce_catalog_match_outbox
      WHERE status IN ('pending', 'failed')
        AND available_at <= CURRENT_TIMESTAMP
      ORDER BY id
      LIMIT 1
    `.execute(getEcommerceDatabase());
    const row = result.rows[0];
    if (!row) return null;
    return {
      aggregateId: String(row.aggregate_id),
      attempts: Number(row.attempts),
      correlationId: String(row.correlation_id),
      eventName: String(row.event_name),
      id: Number(row.id),
      payload: parseJson(row.payload_json)
    };
  }

  async markEventPublished(id: number) {
    await sql`
      UPDATE ecommerce_catalog_match_outbox
      SET status = 'published', published_at = CURRENT_TIMESTAMP, last_error = NULL
      WHERE id = ${id}
    `.execute(getEcommerceDatabase());
  }

  async markEventFailed(id: number, attempts: number, message: string) {
    const delaySeconds = Math.min(300, 5 * 2 ** attempts);
    await sql`
      UPDATE ecommerce_catalog_match_outbox
      SET status = 'failed', attempts = attempts + 1, last_error = ${message},
          available_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${delaySeconds} SECOND)
      WHERE id = ${id}
    `.execute(getEcommerceDatabase());
  }

  async completeSemanticMatch(
    requestId: number,
    result: { confidence: number; productInformationId: number; variantId: number | null } | null
  ) {
    await sql`
      UPDATE ecommerce_catalog_match_requests
      SET product_information_id = ${result?.productInformationId ?? null},
          variant_id = ${result?.variantId ?? null},
          strategy = ${result ? "semantic" : "none"},
          confidence = ${result?.confidence ?? 0},
          status = ${result ? "matched" : "unmatched"}
      WHERE id = ${requestId} AND status = 'semantic_pending'
    `.execute(getEcommerceDatabase());
  }
}

async function findBySource(database: Kysely<EcommerceDatabase>, sourceReference: string) {
  const result = await sql<Row>`
    SELECT * FROM ecommerce_catalog_match_requests
    WHERE source_reference = ${sourceReference}
    LIMIT 1
  `.execute(database);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

async function findById(database: Kysely<EcommerceDatabase>, id: number) {
  const result = await sql<Row>`
    SELECT * FROM ecommerce_catalog_match_requests WHERE id = ${id}
  `.execute(database);
  const row = result.rows[0];
  if (!row) throw new Error("Catalog match request was not persisted.");
  return toRecord(row);
}

function toRecord(row: Row): CatalogMatchRecord {
  return {
    confidence: Number(row.confidence ?? 0),
    correlationId: row.correlation_id,
    createdAt: toIsoString(row.created_at),
    id: Number(row.id),
    productInformationId:
      row.product_information_id == null ? null : Number(row.product_information_id),
    query: parseJson(row.query_json) as CatalogMatchRecord["query"],
    sourceReference: row.source_reference,
    status: row.status,
    strategy: row.strategy,
    updatedAt: toIsoString(row.updated_at),
    uuid: row.uuid,
    variantId: row.variant_id == null ? null : Number(row.variant_id)
  };
}

function parseJson(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value) return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toIsoString(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}
