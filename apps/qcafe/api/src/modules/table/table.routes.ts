import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { TableService } from "./table.service.js";
const uuid = z.string().regex(/^[a-f0-9]{8}$/u);
const save = z
  .object({
    name: z.string().trim().min(1).max(40),
    seats: z.number().int().min(1).max(50),
    status: z.enum(["active", "inactive"])
  })
  .strict();
const item = save.extend({ uuid });
export function registerTableRoutes(app: FastifyInstance, deps: QCafeDependencies) {
  const service = new TableService(deps);
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/tables",
    schemas: { response: z.array(item) },
    handler: ({ request }) => service.list(request)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/tables",
    schemas: { body: save, response: item },
    handler: ({ request, body }) => service.save(request, body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/qcafe/tables/:uuid",
    schemas: { params: z.object({ uuid }).strict(), body: save, response: item },
    handler: ({ request, body, params }) => service.save(request, body, params.uuid)
  });
}
