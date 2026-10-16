import { createHash, randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { knowledgeSources, readKnowledgeSource } from "./knowledge.content.js";
import type { KnowledgeDatabase } from "./knowledge.types.js";
const stable = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 8);
export async function seedKnowledgeDatabase(database: Kysely<KnowledgeDatabase>) {
  const sources = await knowledgeSources();
  for (const source of sources) await readKnowledgeSource(source);
  await database.transaction().execute(async (transaction) => {
    for (const source of sources) {
      const uuid = stable("docs:" + source.pageKey);
      const existing = (
        await sql<{
          sourceHash: string;
        }>`SELECT source_hash AS sourceHash FROM docs_knowledge_pages WHERE page_key=${source.pageKey}`.execute(
          transaction
        )
      ).rows[0];
      await sql`INSERT INTO docs_knowledge_pages(uuid,page_key,app_key,app_label,group_key,group_label,module_key,title,summary,source_path,source_hash,sort_order) VALUES (${uuid},${source.pageKey},${source.appKey},${source.appLabel},${source.groupKey},${source.groupLabel},${source.moduleKey},${source.title},${source.summary},${source.sourcePath},${source.sourceHash},${source.sortOrder}) ON DUPLICATE KEY UPDATE app_label=VALUES(app_label),group_key=VALUES(group_key),group_label=VALUES(group_label),title=VALUES(title),summary=VALUES(summary),source_path=VALUES(source_path),sort_order=VALUES(sort_order),revision=revision+IF(source_hash<>VALUES(source_hash),1,0),source_hash=VALUES(source_hash)`.execute(
        transaction
      );
      if (!existing || existing.sourceHash !== source.sourceHash)
        await sql`INSERT INTO docs_knowledge_activity(uuid,page_uuid,action,actor,summary) VALUES (${randomBytes(4).toString("hex")},${uuid},${existing ? "source_updated" : "source_registered"},'system:docs-seed',${existing ? "Repository source hash updated; tenant override preserved" : "Registered repository source"})`.execute(
          transaction
        );
    }
  });
  for (const key of ["docs.knowledge.view", "docs.knowledge.edit"]) {
    await sql`INSERT INTO app_permissions(uuid,\`key\`,label,description,status,is_protected) VALUES (${stable(key)},${key},${key.replaceAll(".", " ")},${`Allows ${key}.`},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label),description=VALUES(description)`.execute(
      database
    );
    await sql`INSERT INTO app_role_permissions(uuid,role_id,permission_id,status,is_protected) SELECT ${stable(`admin:${key}`)},role.id,permission.id,'active',TRUE FROM app_roles role JOIN app_permissions permission ON permission.\`key\`=${key} WHERE role.\`key\`='admin' ON DUPLICATE KEY UPDATE uuid=app_role_permissions.uuid`.execute(
      database
    );
  }
}
