import { AppError } from "@codexsun/framework/errors";
import { initialSitePage } from "./page.defaults.js";
import { PageRepository } from "./page.repository.js";
import { pageContentSchema, type PageContent, type PageState } from "./page.schema.js";
import type { PageOwner } from "./page.types.js";

export class PageService {
  constructor(
    private readonly repository: PageRepository,
    private readonly site: PageOwner
  ) {}
  async show(): Promise<PageState> {
    const row = await this.repository.find(this.site.id);
    return {
      content: row
        ? pageContentSchema.parse(JSON.parse(row.content_json))
        : initialSitePage(this.site),
      revision: row?.revision ?? 0,
      publishedRevision: row?.published_revision ?? 0
    };
  }
  async save(content: PageContent, revision: number, actor: string) {
    await this.repository.save(this.site.id, pageContentSchema.parse(content), revision, actor);
    return this.show();
  }
  async publish(revision: number, actor: string) {
    if (this.site.status !== "active")
      throw AppError.conflict("Activate the site before publishing.");
    await this.repository.publish(this.site.id, revision, actor);
    return this.show();
  }
  activity() {
    return this.repository.activity(this.site.id);
  }
  async published() {
    if (this.site.status !== "active") throw AppError.notFound("This site is unavailable.");
    const row = await this.repository.find(this.site.id);
    return row?.published_json ? pageContentSchema.parse(JSON.parse(row.published_json)) : null;
  }
}
