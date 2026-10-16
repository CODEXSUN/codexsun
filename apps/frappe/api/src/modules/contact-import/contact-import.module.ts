import type { FastifyInstance, FastifyRequest } from "fastify";
import type { FrappeSettings } from "../connection/index.js";
import { registerFrappeContactImportRoutes } from "./contact-import.routes.js";
import type { FrappeContactImportContext } from "./contact-import.types.js";

export const frappeContactImportModule = {
  key: "frappe.contact-import",
  register(
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<FrappeContactImportContext>,
    defaults: FrappeSettings,
    secret: string
  ) {
    registerFrappeContactImportRoutes(app, context, defaults, secret);
  }
};
