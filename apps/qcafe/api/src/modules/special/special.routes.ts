import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { SpecialService } from "./special.service.js";
const prefix = z
  .string()
  .trim()
  .toUpperCase()
  .min(1)
  .max(20)
  .regex(/^[A-Z0-9_-]+$/u);
const settings = z
  .object({
    revision: z.number().int().nonnegative(),
    enabled: z.boolean(),
    selectedPrefix: z.union([z.literal(""), prefix]),
    definitions: z
      .array(
        z
          .object({ prefix, name: z.string().trim().min(1).max(100), isEnabled: z.boolean() })
          .strict()
      )
      .max(50)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.definitions.map((item) => item.prefix)).size !== value.definitions.length)
      ctx.addIssue({
        code: "custom",
        message: "Special prefixes must be unique.",
        path: ["definitions"]
      });
    if (
      value.selectedPrefix &&
      !value.definitions.some((item) => item.prefix === value.selectedPrefix && item.isEnabled)
    )
      ctx.addIssue({
        code: "custom",
        message: "Choose an enabled Today Special.",
        path: ["selectedPrefix"]
      });
    if (value.enabled && !value.selectedPrefix)
      ctx.addIssue({
        code: "custom",
        message: "Select a Today Special before enabling it.",
        path: ["selectedPrefix"]
      });
  });
export function registerSpecialRoutes(app: FastifyInstance, dependencies: QCafeDependencies) {
  const service = new SpecialService(dependencies);
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/specials",
    schemas: { response: settings },
    handler: ({ request }) => service.get(request)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/qcafe/specials",
    schemas: { body: settings, response: settings },
    handler: ({ request, body }) => service.save(request, body)
  });
}
