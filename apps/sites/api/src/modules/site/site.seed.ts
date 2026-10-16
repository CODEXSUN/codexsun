import type { Kysely } from "kysely";
import type { SitesDatabase } from "./site.types.js";
import { seedPageModule } from "./page/index.js";

export const siteSeed = {
  description: "Seed default client portfolios: LogicX and Ramutex.",
  name: "sites.site.seed"
};

const defaultPortfolios = [
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
    description: "Textile processing and specialty fabric finishes in Tirupur, Tamil Nadu.",
    name: "Ramu Tex Processors India Inc",
    port: 7132,
    primaryDomain: "ramumag.com",
    publishedPages: 1,
    slug: "ramutex",
    status: "active" as const,
    themeKey: "portfolio-ramutex",
    uuid: "c0de0004"
  }
];

export async function seedSiteModule(database: Kysely<SitesDatabase>) {
  await database.transaction().execute(async (transaction) => {
    // Retire only the original sample identities, never unrelated client records.
    await transaction
      .deleteFrom("sites_portfolio_sites")
      .where("uuid", "=", "c0de0001")
      .where("slug", "=", "codexsun")
      .execute();
    await transaction
      .deleteFrom("sites_portfolio_sites")
      .where("uuid", "=", "c0de0003")
      .where("slug", "=", "techmedia")
      .execute();
    await seedCurrentPortfolios(transaction);
    await transaction
      .updateTable("sites_portfolio_sites")
      .set({
        name: "Ramu Tex Processors India Inc",
        primary_domain: "ramumag.com",
        description: "Textile processing and specialty fabric finishes in Tirupur, Tamil Nadu."
      })
      .where("uuid", "=", "c0de0004")
      .where("slug", "=", "ramutex")
      .where("primary_domain", "=", "ramutex.localhost")
      .execute();
  });
  const clients = await database
    .selectFrom("sites_portfolio_sites")
    .select(["id", "slug"])
    .where("slug", "in", ["ramutex", "logicx"])
    .execute();
  for (const client of clients) await seedPageModule(database, client.id, client.slug);
}

async function seedCurrentPortfolios(database: Kysely<SitesDatabase>) {
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
