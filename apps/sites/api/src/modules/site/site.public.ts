import { AppError } from "@codexsun/framework/errors";
import { sql, type Kysely } from "kysely";
import { PageRepository, PageService } from "./page/index.js";
import { BlogRepository, BlogService } from "./blog/index.js";
import { SiteRepository } from "./site.repository.js";
import type { CmsSite, SitesDatabase } from "./site.types.js";

// Local delivery binds only through an authorized Start. Public requests cannot choose a tenant.
export class SitePublicReader {
  private readonly bindings = new Map<
    string,
    { database: Kysely<SitesDatabase>; tenantId: string; siteUuid: string }
  >();
  bind(database: Kysely<SitesDatabase>, tenantId: string, site: CmsSite) {
    const binding = this.bindings.get(site.slug);
    if (binding && (binding.tenantId !== tenantId || binding.siteUuid !== site.uuid))
      throw AppError.conflict(
        "This client's local public runtime is already bound to another tenant or site. Restart the API to change the local delivery binding."
      );
    this.bindings.set(site.slug, { database, tenantId, siteUuid: site.uuid });
  }
  async read(slug = "ramutex") {
    const binding = this.bindings.get(slug);
    if (process.env.NODE_ENV !== "development" || !binding)
      throw AppError.notFound(
        "Start this client from its authorized Studio workspace to connect local content delivery."
      );
    const { database, siteUuid } = binding;
    const active = await sql<{
      id: number;
    }>`SELECT id FROM app_module_settings WHERE module_key='sites' AND enabled=1 AND status='active' LIMIT 1`.execute(
      database
    );
    if (!active.rows.length) throw AppError.notFound("This website is not available.");
    const site = await new SiteRepository(database).findByUuid(siteUuid);
    if (!site || site.status !== "active" || site.slug !== slug)
      throw AppError.notFound("This website is not available.");
    const content = await new PageService(new PageRepository(database), site).published();
    const blogs = await new BlogService(new BlogRepository(database), site).published();
    return { siteUuid, siteSlug: slug, content, blogs };
  }
}
