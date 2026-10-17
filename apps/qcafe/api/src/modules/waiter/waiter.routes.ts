import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { WaiterService } from "./waiter.service.js";
const uuid = z.string().regex(/^[a-f0-9]{8}$/u);
const input = z
  .object({
    code: z.string().trim().min(1).max(24),
    name: z.string().trim().min(1).max(100),
    status: z.enum(["active", "inactive"])
  })
  .strict();
const response = input.extend({ uuid });
export function registerWaiterRoutes(app: FastifyInstance, deps: QCafeDependencies) {
  const s = new WaiterService(deps);
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/waiters",
    schemas: { response: z.array(response) },
    handler: ({ request }) => s.list(request)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/waiters",
    schemas: { body: input, response },
    handler: ({ request, body }) => s.save(request, body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/qcafe/waiters/:uuid",
    schemas: { params: z.object({ uuid }).strict(), body: input, response },
    handler: ({ request, params, body }) => s.save(request, body, params.uuid)
  });
}
