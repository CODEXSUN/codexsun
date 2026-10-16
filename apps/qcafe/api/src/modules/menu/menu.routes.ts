import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { MenuService } from "./menu.service.js";

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
    imageUrl: z.union([z.literal(""), z.url().max(2000).startsWith("https://")]).optional(),
    price: z.number().int().positive().max(100_000_000),
    status: z.enum(["active", "inactive"])
  })
  .strict();
const item = save.extend({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) });

export function registerMenuRoutes(app: FastifyInstance, dependencies: QCafeDependencies) {
  const service = new MenuService(dependencies);
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
