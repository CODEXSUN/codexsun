import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MenuDependencies, MenuSave } from "./menu.types.js";
import { MenuRepository } from "./menu.repository.js";
import { demoFoodImage } from "./menu.demo-images.js";
const breakfast = "Breakfast · காலை உணவு",
  meals = "Meals & Rice · மதிய உணவு",
  snacks = "Snacks · சிற்றுண்டி",
  drinks = "Beverages · பானங்கள்",
  sweets = "Sweets · இனிப்புகள்";
const entries = [
  ["IDLI", "Idli (2 pcs) · இட்லி", breakfast, 40, "idli"],
  ["DOSA", "Plain dosa · சாதா தோசை", breakfast, 50, "dosa"],
  ["MASALA-DOSA", "Masala dosa · மசாலா தோசை", breakfast, 80, "dosa"],
  ["PONGAL", "Ven pongal · வெண் பொங்கல்", breakfast, 60, "rice"],
  ["POORI", "Poori masala (2 pcs) · பூரி", breakfast, 70, "poori"],
  ["RAVA-DOSA", "Rava dosa · ரவா தோசை", breakfast, 90, "dosa"],
  ["MEALS", "South Indian meals · சாப்பாடு", meals, 140, "rice"],
  ["SAMBAR-RICE", "Sambar rice · சாம்பார் சாதம்", meals, 70, "rice"],
  ["LEMON-RICE", "Lemon rice · எலுமிச்சை சாதம்", meals, 60, "lemon"],
  ["CURD-RICE", "Curd rice · தயிர் சாதம்", meals, 60, "curd"],
  ["VADA", "Medu vada · மெது வடை", snacks, 20, "vada"],
  ["BAJJI", "Bajji (3 pcs) · பஜ்ஜி", snacks, 30, "vada"],
  ["BONDA", "Potato bonda (2 pcs) · போண்டா", snacks, 35, "poori"],
  ["COFFEE", "Filter coffee · ஃபில்டர் காபி", drinks, 25, "coffee"],
  ["TEA", "Milk tea · தேநீர்", drinks, 20, "tea"],
  ["BUTTERMILK", "Buttermilk · மோர்", drinks, 20, "milk"],
  ["KESARI", "Rava kesari · ரவா கேசரி", sweets, 35, "sweet"],
  ["PAYASAM", "Payasam · பாயசம்", sweets, 40, "curd"]
] as const;
export const demoMenu = entries.map(([code, name, category, price, family], index) => ({
  code: `DEMO-${code}`,
  name,
  category,
  price: price * 100,
  status: "active" as const,
  family,
  tint: ["#f0ddc4", "#d8e5cd", "#e9dccb", "#e2dfef"][index % 4]!
}));
const preview = z
  .object({
    code: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    imageUrl: z.string()
  })
  .strict();
export function registerMenuDemoRoutes(app: FastifyInstance, deps: MenuDependencies) {
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/menu/demo",
    schemas: {
      response: z
        .object({
          version: z.literal("south-indian-v1"),
          categories: z.array(z.string()),
          items: z.array(preview)
        })
        .strict()
    },
    handler: async ({ request }) => {
      const ctx = await deps.resolveContext(request);
      await ctx.authorize("qcafe.menu.view");
      return {
        version: "south-indian-v1" as const,
        categories: [...new Set(demoMenu.map((item) => item.category))],
        items: demoMenu.map(({ code, name, category, price }) => ({
          code,
          name,
          category,
          price,
          imageUrl: `/api/app/qcafe/menu/demo/images/${code}`
        }))
      };
    }
  });
  app.get("/qcafe/menu/demo/images/:code", async (request, reply) => {
    const ctx = await deps.resolveContext(request);
    await ctx.authorize("qcafe.menu.view");
    const { code } = z.object({ code: z.string().max(40) }).parse(request.params);
    const item = demoMenu.find((item) => item.code === code);
    if (!item) throw AppError.notFound("Demo image was not found.");
    return reply
      .header("Cache-Control", "private, no-store")
      .header("X-Content-Type-Options", "nosniff")
      .type("image/webp")
      .send(await demoFoodImage(item.family, item.tint));
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/menu/demo",
    schemas: {
      body: z.object({ version: z.literal("south-indian-v1") }).strict(),
      response: z
        .object({ added: z.number(), skipped: z.number(), categories: z.number() })
        .strict()
    },
    handler: async ({ request }) => {
      const ctx = await deps.resolveContext(request);
      await ctx.authorize("qcafe.menu.manage");
      if ((await deps.settingsPolicy(ctx.database)).imageWriteProtection)
        throw AppError.forbidden("Turn off image write protection before importing demo content.");
      const directory = deps.masterImageDirectory?.(ctx.tenantId);
      if (!directory) throw AppError.validation("Menu image storage is not configured.");
      await mkdir(directory, { recursive: true });
      const items: MenuSave[] = [];
      for (const item of demoMenu) {
        const name =
          createHash("sha256")
            .update(`codexsun:south-indian-v1:${ctx.tenantId}:${item.code}`)
            .digest("hex")
            .slice(0, 32) + ".webp";
        try {
          await writeFile(join(directory, name), await demoFoodImage(item.family, item.tint), {
            flag: "wx"
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        }
        items.push({
          code: item.code,
          name: item.name,
          category: item.category,
          price: item.price,
          status: item.status,
          imageUrl: `/api/app/qcafe/menu/images/${name}`,
          specialPrices: []
        });
      }
      const added = await new MenuRepository(ctx.database).importDemo(items, ctx.actorEmail);
      return {
        added,
        skipped: items.length - added,
        categories: new Set(items.map((item) => item.category)).size
      };
    }
  });
}
