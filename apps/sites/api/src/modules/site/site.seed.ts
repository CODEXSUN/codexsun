import type { Kysely } from "kysely";
import type { SitesDatabase } from "./site.types.js";

export const siteSeed = {
  description: "Seed default client portfolios: Codexsun, LogicX, and Tech Media.",
  name: "sites.site.seed"
};

const defaultPortfolios = [
  {
    description: "Flagship corporate engineering and technology portfolio site.",
    name: "CODEXSUN",
    port: 7130,
    primaryDomain: "codexsun.com",
    publishedPages: 4,
    slug: "codexsun",
    status: "active" as const,
    themeKey: "portfolio-codexsun",
    uuid: "c0de0001"
  },
  {
    description: "Enterprise operations, ERP, and integration solutions portfolio.",
    name: "LogicX ERP",
    port: 7131,
    primaryDomain: "logicx.in",
    publishedPages: 1,
    slug: "logicx",
    status: "active" as const,
    themeKey: "portfolio-logicx",
    uuid: "c0de0002"
  },
  {
    description: "Technology gear, custom computers, and retail services portfolio.",
    name: "Tech Media",
    port: 7132,
    primaryDomain: "techmedia.in",
    publishedPages: 1,
    slug: "techmedia",
    status: "active" as const,
    themeKey: "portfolio-techmedia",
    uuid: "c0de0003"
  }
];

export async function seedSiteModule(database: Kysely<SitesDatabase>) {
  for (const item of defaultPortfolios) {
    const existing = await database
      .selectFrom("sites_portfolio_sites")
      .select("id")
      .where("slug", "=", item.slug)
      .executeTakeFirst();

    if (!existing) {
      await database
        .insertInto("sites_portfolio_sites")
        .values({
          description: item.description,
          name: item.name,
          port: item.port,
          primary_domain: item.primaryDomain,
          published_pages: item.publishedPages,
          slug: item.slug,
          status: item.status,
          theme_key: item.themeKey,
          uuid: item.uuid
        })
        .execute();
    }
  }
}
