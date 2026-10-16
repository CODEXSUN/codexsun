import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type {
  KnowledgeDatabase,
  KnowledgeRecord,
  KnowledgeInput,
  KnowledgeActivity
} from "./knowledge.types.js";
const fields = sql.raw(
  "uuid,page_key AS pageKey,app_key AS appKey,app_label AS appLabel,group_key AS groupKey,group_label AS groupLabel,module_key AS moduleKey,title,summary,source_path AS sourcePath,source_hash AS sourceHash,sort_order AS sortOrder,revision,(body_override IS NOT NULL) AS hasOverride,updated_at AS updatedAt"
);
export class KnowledgeRepository {
  constructor(private readonly database: Kysely<KnowledgeDatabase>) {}
  async list() {
    const result =
      await sql<KnowledgeRecord>`SELECT ${fields} FROM docs_knowledge_pages WHERE status='active' ORDER BY app_label,sort_order,title`.execute(
        this.database
      );
    return result.rows.map((r) => ({
      ...r,
      hasOverride: Boolean(r.hasOverride),
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }
  async get(uuid: string) {
    const row = (
      await sql<
        KnowledgeRecord & { bodyOverride: string | null }
      >`SELECT ${fields},body_override AS bodyOverride FROM docs_knowledge_pages WHERE uuid=${uuid} AND status='active'`.execute(
        this.database
      )
    ).rows[0];
    if (!row) throw AppError.notFound("Documentation page was not found.");
    return {
      ...row,
      hasOverride: Boolean(row.hasOverride),
      updatedAt: new Date(row.updatedAt).toISOString()
    };
  }
  async activity(uuid: string) {
    return (
      await sql<KnowledgeActivity>`SELECT action,actor,summary,created_at AS createdAt FROM docs_knowledge_activity WHERE page_uuid=${uuid} ORDER BY id DESC LIMIT 30`.execute(
        this.database
      )
    ).rows.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() }));
  }
  async update(uuid: string, input: KnowledgeInput, actor: string) {
    await this.database.transaction().execute(async (transaction) => {
      const row = (
        await sql<{
          revision: number;
        }>`SELECT revision FROM docs_knowledge_pages WHERE uuid=${uuid} AND status='active' FOR UPDATE`.execute(
          transaction
        )
      ).rows[0];
      if (!row) throw AppError.notFound("Documentation page was not found.");
      if (row.revision !== input.expectedRevision)
        throw AppError.conflict("This page changed. Reload it before saving.");
      await sql`UPDATE docs_knowledge_pages SET body_override=${input.body},revision=revision+1 WHERE uuid=${uuid}`.execute(
        transaction
      );
      await sql`INSERT INTO docs_knowledge_activity(uuid,page_uuid,action,actor,summary) VALUES (${randomBytes(4).toString("hex")},${uuid},${input.body === null ? "override_restored" : "override_saved"},${actor},${input.body === null ? "Restored repository body" : "Saved tenant Markdown override"})`.execute(
        transaction
      );
    });
  }
}
