import { AppError } from "@codexsun/framework/errors";
import { BlogRepository } from "./blog.repository.js";
import { blogContentSchema, type BlogContent, type BlogRecord } from "./blog.schema.js";
export class BlogService {
  constructor(
    private readonly repository: BlogRepository,
    private readonly site: { id: number; status: string }
  ) {}
  async list(): Promise<BlogRecord[]> {
    return (await this.repository.list(this.site.id)).map((row) => ({
      uuid: row.uuid,
      content: blogContentSchema.parse(JSON.parse(row.content_json)),
      revision: row.revision,
      publishedRevision: row.published_revision
    }));
  }
  async save(uuid: string | null, content: BlogContent, revision: number, actor: string) {
    const row = await this.repository.save(
      this.site.id,
      uuid,
      blogContentSchema.parse(content),
      revision,
      actor
    );
    if (!row) throw AppError.notFound("Blog post was not found.");
    return {
      uuid: row.uuid,
      content: blogContentSchema.parse(JSON.parse(row.content_json)),
      revision: row.revision,
      publishedRevision: row.published_revision
    };
  }
  async publication(uuid: string, revision: number, actor: string, publish: boolean) {
    if (publish && this.site.status !== "active")
      throw AppError.conflict("Activate this site before publishing.");
    await this.repository.changePublication(this.site.id, uuid, revision, actor, publish);
    return this.list();
  }
  delete(uuid: string, revision: number, actor: string) {
    return this.repository.delete(this.site.id, uuid, revision, actor);
  }
  async published() {
    if (this.site.status !== "active") return [];
    return (await this.repository.list(this.site.id))
      .filter((row) => row.published_json !== null)
      .map((row) => blogContentSchema.parse(JSON.parse(row.published_json!)));
  }
}
