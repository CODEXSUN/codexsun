import { randomBytes } from "node:crypto";
import { sql, type Kysely, type Transaction } from "kysely";
import type {
  LogicxErpSchemeActivityAction,
  LogicxErpSchemeActivityRecord,
  LogicxErpSchemeDatabase,
  LogicxErpSchemeFilters,
  LogicxErpSchemeInvoiceOption,
  LogicxErpSchemeLookups,
  LogicxErpSchemeRecord,
  LogicxErpSchemeStatus,
  LogicxErpSchemeWrite
} from "./scheme.types.js";

type SchemeDatabase = Kysely<LogicxErpSchemeDatabase> | Transaction<LogicxErpSchemeDatabase>;

export class LogicxErpSchemeRepository {
  constructor(private readonly database: Kysely<LogicxErpSchemeDatabase>) {}

  async list(filters: LogicxErpSchemeFilters) {
    let query = recordQuery(this.database);
    if (filters.status && filters.status !== "all")
      query = query.where("scheme.status", "=", filters.status);
    if (filters.priority && filters.priority !== "all")
      query = query.where("scheme.priority", "=", filters.priority);
    if (filters.claim === "done") query = query.where("scheme.claim_done", "=", true);
    if (filters.claim === "pending") query = query.where("scheme.claim_done", "=", false);
    if (filters.search) {
      const term = likeTerm(filters.search);
      query = query.where((expression) =>
        expression.or([
          expression("scheme.scheme_no", "like", term),
          expression("scheme.description", "like", term),
          expression("sale.invoice_number", "like", term),
          expression("brand.name", "like", term),
          expression("requester.name", "like", term),
          expression("approver.name", "like", term)
        ])
      );
    }
    const rows = await query
      .orderBy("scheme.scheme_date", "desc")
      .orderBy("scheme.id", "desc")
      .execute();
    return rows.map(toRecord);
  }

  async get(uuid: string) {
    const row = await recordQuery(this.database).where("scheme.uuid", "=", uuid).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  findForWrite(uuid: string) {
    return this.database
      .selectFrom("logicx_erp_schemes")
      .select([
        "id",
        "scheme_no as schemeNo",
        "sales_id as salesId",
        "brand_id as brandId",
        "requested_by_user_id as requestedByUserId",
        "approved_by_user_id as approvedByUserId",
        "status"
      ])
      .where("uuid", "=", uuid)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
  }

  findSale(uuid: string) {
    return this.database
      .selectFrom("billing_sales")
      .select(["id", "invoice_number as invoiceNumber", "status", "deleted_at as deletedAt"])
      .where("uuid", "=", uuid)
      .executeTakeFirst();
  }

  findBrand(id: number) {
    return this.database
      .selectFrom("core_brands")
      .select(["id", "name", "status"])
      .where("id", "=", id)
      .executeTakeFirst();
  }

  findUser(id: number) {
    return this.database
      .selectFrom("app_users")
      .select(["id", "name", "status"])
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async lookups(): Promise<LogicxErpSchemeLookups> {
    const [brands, users] = await Promise.all([
      this.database
        .selectFrom("core_brands")
        .select(["id", "name"])
        .where("status", "=", "active")
        .orderBy("name")
        .execute(),
      this.database
        .selectFrom("app_users")
        .select(["id", "name", "email"])
        .where("status", "=", "active")
        .orderBy("name")
        .execute()
    ]);
    return {
      brands: brands.map((brand) => ({ id: Number(brand.id), name: brand.name })),
      users: users.map((user) => ({ id: Number(user.id), name: user.name, email: user.email }))
    };
  }

  async invoiceOptions(search: string): Promise<LogicxErpSchemeInvoiceOption[]> {
    let query = this.database
      .selectFrom("billing_sales as sale")
      .innerJoin("core_contacts as customer", "customer.id", "sale.customer_id")
      .select([
        "sale.uuid as id",
        "sale.invoice_number as invoiceNumber",
        sql<string>`DATE_FORMAT(sale.issued_on, '%Y-%m-%d')`.as("issuedOn"),
        "customer.name as customerName",
        "sale.amount as amount"
      ])
      .where("sale.deleted_at", "is", null)
      .where("sale.status", "!=", "cancelled");
    if (search) {
      const term = likeTerm(search);
      query = query.where((expression) =>
        expression.or([
          expression("sale.invoice_number", "like", term),
          expression("customer.name", "like", term)
        ])
      );
    }
    const rows = await query
      .orderBy("sale.issued_on", "desc")
      .orderBy("sale.id", "desc")
      .limit(50)
      .execute();
    return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
  }

  create(write: LogicxErpSchemeWrite, actor: string) {
    return this.database.transaction().execute(async (transaction) => {
      const result = await transaction
        .insertInto("logicx_erp_schemes")
        .values({
          ...toRow(write),
          created_by: actor,
          scheme_no: `PENDING-${randomBytes(6).toString("hex")}`
        })
        .executeTakeFirstOrThrow();
      const id = Number(result.insertId);
      const schemeNo = `SCHEME${id}`;
      await transaction
        .updateTable("logicx_erp_schemes")
        .set({ scheme_no: schemeNo })
        .where("id", "=", id)
        .execute();
      await writeActivity(transaction, id, "created", `${schemeNo} created.`, actor);
      const created = await transaction
        .selectFrom("logicx_erp_schemes")
        .select("uuid")
        .where("id", "=", id)
        .executeTakeFirstOrThrow();
      return created.uuid;
    });
  }

  update(id: number, schemeNo: string, write: LogicxErpSchemeWrite, actor: string) {
    return this.database.transaction().execute(async (transaction) => {
      await transaction
        .updateTable("logicx_erp_schemes")
        .set(toRow(write))
        .where("id", "=", id)
        .execute();
      await writeActivity(transaction, id, "updated", `${schemeNo} updated.`, actor);
    });
  }

  setStatus(id: number, schemeNo: string, status: LogicxErpSchemeStatus, actor: string) {
    return this.database.transaction().execute(async (transaction) => {
      await transaction
        .updateTable("logicx_erp_schemes")
        .set({ status })
        .where("id", "=", id)
        .execute();
      const action = status === "active" ? "activated" : "deactivated";
      await writeActivity(transaction, id, action, `${schemeNo} ${action}.`, actor);
    });
  }

  softDelete(id: number, schemeNo: string, actor: string) {
    return this.database.transaction().execute(async (transaction) => {
      await transaction
        .updateTable("logicx_erp_schemes")
        .set({ deleted_at: sql<string>`CURRENT_TIMESTAMP` })
        .where("id", "=", id)
        .execute();
      await writeActivity(transaction, id, "deleted", `${schemeNo} deleted.`, actor);
    });
  }

  async activity(id: number): Promise<LogicxErpSchemeActivityRecord[]> {
    const rows = await this.database
      .selectFrom("logicx_erp_scheme_activity")
      .select(["uuid", "action", "summary", "created_by", "created_at"])
      .where("scheme_id", "=", id)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .execute();
    return rows.map((row) => ({
      id: row.uuid,
      action: row.action,
      summary: row.summary,
      actorEmail: row.created_by,
      createdAt: toIso(row.created_at)
    }));
  }
}

function recordQuery(database: SchemeDatabase) {
  return database
    .selectFrom("logicx_erp_schemes as scheme")
    .innerJoin("billing_sales as sale", "sale.id", "scheme.sales_id")
    .innerJoin("core_brands as brand", "brand.id", "scheme.brand_id")
    .innerJoin("app_users as requester", "requester.id", "scheme.requested_by_user_id")
    .leftJoin("app_users as approver", "approver.id", "scheme.approved_by_user_id")
    .select([
      "scheme.uuid as id",
      "scheme.scheme_no as schemeNo",
      sql<string>`DATE_FORMAT(scheme.scheme_date, '%Y-%m-%d')`.as("schemeDate"),
      "sale.uuid as salesId",
      "sale.invoice_number as invoiceNumber",
      "scheme.priority as priority",
      "scheme.support_value as supportValue",
      "scheme.brand_id as brandId",
      "brand.name as brandName",
      "scheme.description as description",
      "scheme.requested_by_user_id as requestedByUserId",
      "requester.name as requestedByName",
      "scheme.approved_by_user_id as approvedByUserId",
      "approver.name as approvedByName",
      "scheme.claim_done as claimDone",
      "scheme.amount_realized as amountRealized",
      "scheme.status as status",
      "scheme.created_by as createdBy",
      "scheme.created_at as createdAt",
      "scheme.updated_at as updatedAt"
    ])
    .where("scheme.deleted_at", "is", null);
}

type RecordRow = Awaited<ReturnType<ReturnType<typeof recordQuery>["executeTakeFirstOrThrow"]>>;

function toRecord(row: RecordRow): LogicxErpSchemeRecord {
  return {
    id: row.id,
    schemeNo: row.schemeNo,
    schemeDate: row.schemeDate,
    salesId: row.salesId,
    invoiceNumber: row.invoiceNumber,
    priority: row.priority,
    supportValue: Number(row.supportValue),
    brandId: Number(row.brandId),
    brandName: row.brandName,
    description: row.description,
    requestedByUserId: Number(row.requestedByUserId),
    requestedByName: row.requestedByName,
    approvedByUserId: row.approvedByUserId === null ? null : Number(row.approvedByUserId),
    approvedByName: row.approvedByName,
    claimDone: Boolean(Number(row.claimDone)),
    amountRealized: row.amountRealized === null ? null : Number(row.amountRealized),
    status: row.status,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt)
  };
}

function toRow(write: LogicxErpSchemeWrite) {
  return {
    scheme_date: write.schemeDate,
    sales_id: write.salesInternalId,
    priority: write.priority,
    support_value: write.supportValue,
    brand_id: write.brandId,
    description: write.description,
    requested_by_user_id: write.requestedByUserId,
    approved_by_user_id: write.approvedByUserId,
    claim_done: write.claimDone,
    amount_realized: write.amountRealized,
    status: write.status
  };
}

function writeActivity(
  transaction: Transaction<LogicxErpSchemeDatabase>,
  schemeId: number,
  action: LogicxErpSchemeActivityAction,
  summary: string,
  actor: string
) {
  return transaction
    .insertInto("logicx_erp_scheme_activity")
    .values({ action, created_by: actor, scheme_id: schemeId, summary })
    .execute();
}

function likeTerm(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function toIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  const text = String(value).replace(" ", "T");
  return new Date(text.endsWith("Z") ? text : `${text}Z`).toISOString();
}
