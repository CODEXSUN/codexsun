import { registerMenuDemoRoutes } from "./menu.demo.js";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MenuDependencies } from "./menu.types.js";
import { MenuService } from "./menu.service.js";
import { MenuImages, menuImageName } from "./menu.images.js";
import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";

const save = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/u),
    name: z.string().trim().min(1).max(160),
    category: z.string().trim().min(1).max(100),
    imageUrl: z
      .union([
        z.literal(""),
        z.url().max(2000).startsWith("https://"),
        z.string().regex(/^\/api\/app\/qcafe\/menu\/images\/[a-f0-9]{32}\.webp$/u)
      ])
      .optional(),
    specialPrices: z
      .array(
        z
          .object({
            prefix: z
              .string()
              .trim()
              .toUpperCase()
              .min(1)
              .max(20)
              .regex(/^[A-Z0-9_-]+$/u),
            price: z.number().int().positive().max(100_000_000),
            isEnabled: z.boolean()
          })
          .strict()
      )
      .max(50)
      .optional(),
    price: z.number().int().positive().max(100_000_000),
    status: z.enum(["active", "inactive"])
  })
  .strict();
const item = save.extend({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) });

export function registerMenuRoutes(app: FastifyInstance, dependencies: MenuDependencies) {
  registerMenuDemoRoutes(app, dependencies);
  const service = new MenuService(dependencies);
  const images = new MenuImages(dependencies);
  app.post("/qcafe/menu/images", { bodyLimit: 7 * 1024 * 1024 }, async (request) => {
    const context = await dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.manage");
    if ((await dependencies.settingsPolicy(context.database)).imageWriteProtection)
      throw AppError.forbidden("Menu images are write-protected in Settings.");
    const { contentBase64 } = z
      .object({ contentBase64: z.string().min(1).max(6_990_508) })
      .strict()
      .parse(request.body);
    return ok(await images.upload(context.tenantId, contentBase64), { requestId: request.id });
  });
  app.get("/qcafe/menu/images/:name", async (request, reply) => {
    const context = await dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.view");
    const { name } = z.object({ name: z.string().regex(menuImageName) }).parse(request.params);
    const image = await images.read(context.tenantId, name);
    return reply
      .header("Cache-Control", "private, no-store")
      .header("X-Content-Type-Options", "nosniff")
      .type("image/webp")
      .send(image);
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/menu/pos",
    schemas: {
      response: z.array(
        item.extend({
          normalPrice: z.number().int().positive(),
          activeSpecial: z.object({ prefix: z.string(), name: z.string() }).nullable()
        })
      )
    },
    handler: ({ request }) => service.posMenu(request)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/menu",
    schemas: { response: z.array(item) },
    handler: ({ request }) => service.list(request)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/menu",
    schemas: { body: save, response: item },
    handler: ({ request, body }) => service.save(request, body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/qcafe/menu/:uuid",
    schemas: {
      body: save,
      params: z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) }).strict(),
      response: item
    },
    handler: ({ request, body, params }) => service.save(request, body, params.uuid)
  });
}
