import type { FastifyInstance } from "fastify";
import { addonCatalogSnapshotSchema } from "../contracts/addons.contract.js";
import { readAddonCatalog } from "../service/addons.service.js";

export async function registerAddonRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/projex/addons", { schema: { response: { 200: addonCatalogSnapshotSchema }, tags: ["Add-ons"] } }, async () => readAddonCatalog());
}
