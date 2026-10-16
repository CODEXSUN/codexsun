import type { FastifyInstance, FastifyRequest } from "fastify";
import type { FrappeSettings } from "../connection/index.js";
import { registerFrappeActivityImportRoutes } from "./activity-import.routes.js";
import type { FrappeActivityImportContext } from "./activity-import.types.js";

export const frappeActivityImportModule = {
  key: "frappe.activity-import",
  register(
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<FrappeActivityImportContext>,
    defaults: FrappeSettings,
    secret: string
  ) {
    registerFrappeActivityImportRoutes(app, context, defaults, secret);
  }
};
