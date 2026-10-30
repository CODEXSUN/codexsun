import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { blogContentSchema, type BlogContent } from "./blog.schema.js";
import type { BlogDatabase } from "./blog.types.js";
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
export class BlogRepository {
  constructor(private readonly db: Kysely<BlogDatabase>) {}
  list(siteId: number) {
    return this.db
      .selectFrom("sites_blog_posts")
      .selectAll()
      .where("site_id", "=", siteId)
      .orderBy("id", "desc")
      .execute();
  }
  find(siteId: number, uuid: string) {
    return this.db
      .selectFrom("sites_blog_posts")
      .selectAll()
      .where("site_id", "=", siteId)
      .where("uuid", "=", uuid)
      .executeTakeFirst();
  }
  async save(
    siteId: number,
    uuid: string | null,
    content: BlogContent,
    revision: number,
    actor: string
  ) {
    const id = uuid ?? randomBytes(4).toString("hex");
    await this.db.transaction().execute(async (tx) => {
      const duplicate = await tx
        .selectFrom("sites_blog_posts")
        .select("uuid")
        .where("site_id", "=", siteId)
        .where("slug", "=", content.slug)
        .executeTakeFirst();
      if (duplicate && duplicate.uuid !== id)
        throw AppError.conflict("A blog post already uses this slug.");
      if (uuid) {
        const current = await new BlogRepository(tx).find(siteId, uuid);
        if (!current) throw AppError.notFound("Blog post was not found in this site.");
        if (
          current.published_json &&
          blogContentSchema.parse(JSON.parse(current.published_json)).slug !== content.slug
        )
          throw AppError.conflict("Unpublish this post before changing its URL slug.");
        const result = await tx
          .updateTable("sites_blog_posts")
          .set({
            slug: content.slug,
            content_json: JSON.stringify(content),
            revision: revision + 1,
            updated_at: now()
          })
          .where("site_id", "=", siteId)
          .where("uuid", "=", uuid)
          .where("revision", "=", revision)
          .executeTakeFirst();
        if (!Number(result.numUpdatedRows))
          throw AppError.conflict("The blog post changed. Reload before saving.");
      } else {
        if (revision !== 0) throw AppError.conflict("A new blog post must start at revision zero.");
        await tx
          .insertInto("sites_blog_posts")
          .values({
            uuid: id,
            site_id: siteId,
            slug: content.slug,
            content_json: JSON.stringify(content),
            published_json: null,
            revision: 1,
            published_revision: 0,
            updated_at: now()
          })
          .execute();
      }
      await tx
        .insertInto("sites_blog_activity")
        .values({
          post_uuid: id,
          site_id: siteId,
          actor,
          action: "save",
          revision: revision + 1,
          created_at: now()
        })
        .execute();
    });
    return this.find(siteId, id);
  }
  async changePublication(
    siteId: number,
    uuid: string,
    revision: number,
    actor: string,
    publish: boolean
  ) {
    await this.db.transaction().execute(async (tx) => {
      const current = await new BlogRepository(tx).find(siteId, uuid);
      if (!current) throw AppError.notFound("Blog post was not found in this site.");
      if (current.revision !== revision)
        throw AppError.conflict("The blog changed. Reload before publishing.");
      if (publish) blogContentSchema.parse(JSON.parse(current.content_json));
      const result = await tx
        .updateTable("sites_blog_posts")
        .set({
          published_json: publish ? current.content_json : null,
          published_revision: publish ? revision + 1 : 0,
          revision: revision + 1
        })
        .where("site_id", "=", siteId)
        .where("uuid", "=", uuid)
        .where("revision", "=", revision)
        .executeTakeFirst();
      if (!Number(result.numUpdatedRows)) throw AppError.conflict("The blog post changed.");
      await tx
        .insertInto("sites_blog_activity")
        .values({
          post_uuid: uuid,
          site_id: siteId,
          actor,
          action: publish ? "publish" : "unpublish",
          revision: revision + 1,
          created_at: now()
        })
        .execute();
    });
    return this.find(siteId, uuid);
  }
  async delete(siteId: number, uuid: string, revision: number, actor: string) {
    await this.db.transaction().execute(async (tx) => {
      const row = await new BlogRepository(tx).find(siteId, uuid);
      if (!row) throw AppError.notFound("Blog post was not found in this site.");
      if (row.published_json)
        throw AppError.conflict("Unpublish the blog post before deleting it.");
      const result = await tx
        .deleteFrom("sites_blog_posts")
        .where("site_id", "=", siteId)
        .where("uuid", "=", uuid)
        .where("revision", "=", revision)
        .executeTakeFirst();
      if (!Number(result.numDeletedRows))
        throw AppError.conflict("The blog post changed. Reload before deleting.");
      await tx
        .insertInto("sites_blog_activity")
        .values({
          post_uuid: uuid,
          site_id: siteId,
          actor,
          action: "delete",
          revision,
          created_at: now()
        })
        .execute();
    });
    return { deleted: true };
  }
}
