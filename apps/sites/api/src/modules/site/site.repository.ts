import { sitePublicPaths } from "./page/page.public-routes.js";
import { pageContentSchema } from "./page/page.schema.js";
import type { Kysely, Selectable } from "kysely";
import { PageRepository } from "./page/index.js";
import { BlogRepository } from "./blog/index.js";
import type {
  CmsSite,
  SiteCreatePayload,
  SiteStatus,
  SitesDatabase,
  SitesPortfolioTable,
  SiteUpdatePayload
} from "./site.types.js";

export class SiteRepository {
  constructor(private readonly database: Kysely<SitesDatabase>) {}

  async hasManagedContent(siteId: number) {
    return (
      Boolean(await new PageRepository(this.database).find(siteId)) ||
      (await new BlogRepository(this.database).list(siteId)).length > 0
    );
  }

  async list(): Promise<CmsSite[]> {
    const rows = await this.database
      .selectFrom("sites_portfolio_sites")
      .selectAll()
      .orderBy("name", "asc")
      .execute();
    return Promise.all(rows.map((row) => this.mapSite(row)));
  }

  async findByUuid(uuid: string): Promise<CmsSite | null> {
    const row = await this.database
      .selectFrom("sites_portfolio_sites")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? this.mapSite(row) : null;
  }

  async findBySlug(slug: string): Promise<CmsSite | null> {
    const row = await this.database
      .selectFrom("sites_portfolio_sites")
      .selectAll()
      .where("slug", "=", slug)
      .executeTakeFirst();
    return row ? this.mapSite(row) : null;
  }

  async findByDomain(domain: string): Promise<CmsSite | null> {
    const row = await this.database
      .selectFrom("sites_portfolio_sites")
      .selectAll()
      .where("primary_domain", "=", domain)
      .executeTakeFirst();
    return row ? this.mapSite(row) : null;
  }

  async findByPort(port: number): Promise<CmsSite | null> {
    const row = await this.database
      .selectFrom("sites_portfolio_sites")
      .selectAll()
      .where("port", "=", port)
      .executeTakeFirst();
    return row ? this.mapSite(row) : null;
  }

  private async mapSite(row: Selectable<SitesPortfolioTable>): Promise<CmsSite> {
    const page = await new PageRepository(this.database).find(Number(row.id));
    const content = page?.published_json
      ? pageContentSchema.parse(JSON.parse(page.published_json))
      : null;
    const posts = await new BlogRepository(this.database).list(Number(row.id));
    const blogs = posts
      .filter((post) => post.published_json)
      .map((post) => JSON.parse(post.published_json!) as { slug: string });
    return {
      ...mapRowToSite(row),
      publishedPages: content ? sitePublicPaths(row.slug, content, blogs).length : 0
    };
  }

  async create(payload: SiteCreatePayload & { uuid: string }): Promise<CmsSite> {
    await this.database
      .insertInto("sites_portfolio_sites")
      .values({
        description: payload.description ?? "",
        name: payload.name,
        port: payload.port ?? 0,
        primary_domain: payload.primaryDomain,
        published_pages: 0,
        slug: payload.slug,
        status: "active",
        theme_key: payload.themeKey,
        uuid: payload.uuid
      })
      .execute();

    const created = await this.findByUuid(payload.uuid);
    if (!created) throw new Error("Failed to retrieve created portfolio site.");
    return created;
  }

  async update(uuid: string, payload: SiteUpdatePayload): Promise<CmsSite | null> {
    await this.database
      .updateTable("sites_portfolio_sites")
      .set({
        description: payload.description ?? "",
        name: payload.name,
        port: payload.port ?? 0,
        primary_domain: payload.primaryDomain,
        slug: payload.slug,
        theme_key: payload.themeKey
      })
      .where("uuid", "=", uuid)
      .execute();
    return this.findByUuid(uuid);
  }

  async setStatus(uuid: string, status: SiteStatus): Promise<CmsSite | null> {
    await this.database
      .updateTable("sites_portfolio_sites")
      .set({ status })
      .where("uuid", "=", uuid)
      .execute();
    return this.findByUuid(uuid);
  }

  async delete(uuid: string): Promise<boolean> {
    const result = await this.database
      .deleteFrom("sites_portfolio_sites")
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}

function mapRowToSite(row: Selectable<SitesPortfolioTable>): CmsSite {
  return {
    createdAt: String(row.created_at),
    description: row.description,
    id: Number(row.id),
    name: row.name,
    port: Number(row.port),
    primaryDomain: row.primary_domain,
    publishedPages: Number(row.published_pages),
    slug: row.slug,
    status: row.status,
    themeKey: row.theme_key,
    updatedAt: String(row.updated_at),
    uuid: row.uuid
  };
}
