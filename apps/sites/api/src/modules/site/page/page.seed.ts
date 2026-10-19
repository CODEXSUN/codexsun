import type { Kysely } from "kysely";
import type { PageDatabase } from "./page.types.js";
import { PageRepository } from "./page.repository.js";
import { initialRamuTexPage, initialLogicxPage } from "./page.content.js";
import { initialTenkasiSportsPage } from "./page.sports-content.js";
export async function seedPageModule(db: Kysely<PageDatabase>, siteId: number, slug = "ramutex") {
  const repository = new PageRepository(db);
  if (!(await repository.find(siteId)))
    await repository.save(
      siteId,
      slug === "tenkasisports" ? initialTenkasiSportsPage : slug === "logicx" ? initialLogicxPage : initialRamuTexPage,
      0,
      "sites.seed"
    );
}
