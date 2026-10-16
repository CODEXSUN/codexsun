import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { PageDatabase } from "./page.types.js";
import { pageContentSchema, type PageContent } from "./page.schema.js";

export class PageRepository {
  constructor(private readonly db: Kysely<PageDatabase>) {}
  find(siteId: number) {
    return this.db
      .selectFrom("sites_pages")
      .selectAll()
      .where("site_id", "=", siteId)
      .executeTakeFirst();
  }
  async save(siteId: number, content: PageContent, revision: number, actor: string) {
    const write = async (tx: Kysely<PageDatabase>) => {
      const current = await new PageRepository(tx).find(siteId);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const uuid = current?.uuid ?? randomBytes(4).toString("hex");
      if (current) {
        const result = await tx
          .updateTable("sites_pages")
          .set({ content_json: JSON.stringify(content), revision: revision + 1, updated_at: now })
          .where("site_id", "=", siteId)
          .where("revision", "=", revision)
          .executeTakeFirst();
        if (!Number(result.numUpdatedRows))
          throw AppError.conflict("The page changed. Reload before saving.");
      } else {
        if (revision !== 0) throw AppError.conflict("Reload the page before saving.");
        await tx
          .insertInto("sites_pages")
          .values({
            uuid,
            site_id: siteId,
            content_json: JSON.stringify(content),
            published_json: null,
            revision: 1,
            published_revision: 0,
            updated_at: now
          })
          .execute();
      }
      await tx
        .insertInto("sites_page_activity")
        .values({ page_uuid: uuid, actor, action: "save", revision: revision + 1, created_at: now })
        .execute();
    };
    if (this.db.isTransaction) await write(this.db);
    else await this.db.transaction().execute(write);
    return this.find(siteId);
  }
  async publish(siteId: number, revision: number, actor: string) {
    await this.db.transaction().execute(async (tx) => {
      const current = await new PageRepository(tx).find(siteId);
      if (!current || current.revision !== revision)
        throw AppError.conflict("Save and reload the current page before publishing.");
      pageContentSchema.parse(JSON.parse(current.content_json));
      if (
        current.published_revision === revision &&
        current.published_json === current.content_json
      )
        return;
      const result = await tx
        .updateTable("sites_pages")
        .set({ published_json: current.content_json, published_revision: revision })
        .where("site_id", "=", siteId)
        .where("revision", "=", revision)
        .executeTakeFirst();
      if (!Number(result.numUpdatedRows))
        throw AppError.conflict("The page changed before publishing.");
      await tx
        .insertInto("sites_page_activity")
        .values({
          page_uuid: current.uuid,
          actor,
          action: "publish",
          revision,
          created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
        })
        .execute();
    });
    return this.find(siteId);
  }
  activity(siteId: number) {
    return this.db
      .selectFrom("sites_page_activity as activity")
      .innerJoin("sites_pages as page", "page.uuid", "activity.page_uuid")
      .select(["activity.actor", "activity.action", "activity.revision", "activity.created_at"])
      .where("page.site_id", "=", siteId)
      .orderBy("activity.id", "desc")
      .limit(30)
      .execute();
  }
}
