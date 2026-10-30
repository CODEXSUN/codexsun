import { randomBytes } from "node:crypto";
import type { Kysely, Transaction, Selectable } from "kysely";
import type {
  RequirementsDatabase,
  RequirementRow,
  RequirementRecord,
  RequirementInput,
  RequirementActivity,
  RequirementListOptions
} from "./requirements.types.js";

export class RequirementsRepository {
  constructor(
    private readonly database: Kysely<RequirementsDatabase> | Transaction<RequirementsDatabase>
  ) {}
  transaction<T>(work: (repository: RequirementsRepository) => Promise<T>) {
    return this.database
      .transaction()
      .execute((transaction) => work(new RequirementsRepository(transaction)));
  }
  async get(uuid: string) {
    const row = await this.database
      .selectFrom("codexsun_requirements")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? map(row) : undefined;
  }
  async getByClientKey(actor: string, key: string) {
    const row = await this.database
      .selectFrom("codexsun_requirements")
      .selectAll()
      .where("created_by", "=", actor)
      .where("client_key", "=", key)
      .executeTakeFirst();
    return row ? { record: map(row), requestHash: row.request_hash } : undefined;
  }
  async list(options: RequirementListOptions, actor: string, canApprove: boolean) {
    let query = this.database.selectFrom("codexsun_requirements");
    if (!canApprove) query = query.where("created_by", "=", actor);
    if (options.status) query = query.where("status", "=", options.status);
    if (options.search) query = query.where("title", "like", `%${options.search}%`);
    const count = await query
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirstOrThrow();
    const rows = await query
      .selectAll()
      .orderBy("updated_at", "desc")
      .orderBy("id", "desc")
      .offset((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .execute();
    return {
      records: rows.map(map),
      total: Number(count.total),
      page: options.page,
      pageSize: options.pageSize
    };
  }
  async insert(input: RequirementInput, actor: string, requestHash: string) {
    const uuid = randomBytes(4).toString("hex"),
      now = new Date().toISOString().slice(0, 23).replace("T", " ");
    await this.database
      .insertInto("codexsun_requirements")
      .values({
        uuid,
        client_key: input.clientKey,
        request_hash: requestHash,
        title: input.title,
        description: input.description,
        priority: input.priority,
        origin: input.origin,
        status: "draft",
        revision: 1,
        decision_note: "",
        created_by: actor,
        created_at: now,
        updated_at: now
      })
      .execute();
    return (await this.get(uuid))!;
  }
  async compareAndSet(
    record: RequirementRecord,
    change: Partial<
      Pick<RequirementRow, "title" | "description" | "priority" | "status" | "decision_note">
    >
  ) {
    const result = await this.database
      .updateTable("codexsun_requirements")
      .set({
        ...change,
        revision: record.revision + 1,
        updated_at: new Date().toISOString().slice(0, 23).replace("T", " ")
      })
      .where("uuid", "=", record.uuid)
      .where("revision", "=", record.revision)
      .where("status", "=", record.status)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) === 1;
  }
  async addActivity(
    record: RequirementRecord,
    action: RequirementActivity["action"],
    actor: string,
    note = ""
  ) {
    await this.database
      .insertInto("codexsun_requirement_activity")
      .values({
        uuid: randomBytes(4).toString("hex"),
        requirement_uuid: record.uuid,
        action,
        revision: record.revision,
        note,
        actor_email: actor,
        created_by: actor,
        status: "active",
        created_at: new Date().toISOString().slice(0, 23).replace("T", " "),
        updated_at: new Date().toISOString().slice(0, 23).replace("T", " ")
      })
      .execute();
  }
  async activity(uuid: string) {
    const rows = await this.database
      .selectFrom("codexsun_requirement_activity")
      .selectAll()
      .where("requirement_uuid", "=", uuid)
      .orderBy("id", "asc")
      .execute();
    return rows.map((row) => ({
      uuid: row.uuid,
      requirementUuid: row.requirement_uuid,
      action: row.action,
      revision: row.revision,
      note: row.note,
      actorEmail: row.actor_email,
      createdAt: iso(row.created_at)
    }));
  }
}
function map(row: Selectable<RequirementRow>): RequirementRecord {
  return {
    uuid: row.uuid,
    title: row.title,
    description: row.description,
    priority: row.priority,
    origin: row.origin,
    status: row.status,
    revision: row.revision,
    decisionNote: row.decision_note,
    createdBy: row.created_by,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function iso(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z").toISOString();
}
