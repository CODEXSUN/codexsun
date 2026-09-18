import type { DatabaseProvider } from "@codexsun/platform-core-api";
import type { FastifyInstance } from "fastify";
import { resolve } from "node:path";
import type { Kysely } from "kysely";
import type { GarmentsEnvironment } from "../../config.js";
import type { GarmentsDatabase } from "./garments-library-database.js";
import { GarmentsRenderer } from "./garments-library.renderer.js";
import { GarmentsIndexRepository } from "./garments-library.repository.js";
import { registerGarmentsLibraryRoutes } from "./garments-library.routes.js";
import { GarmentsLibraryService } from "./garments-library.service.js";
import { GarmentsVault } from "./garments-library.source.js";

export const garmentsLibraryModuleManifest = {
  capabilities: [
    "documentation-health-scan",
    "obsidian-vault-reading",
    "mdx-html-rendering",
    "mariadb-document-indexing",
  ],
  dependencies: {},
  id: "garments.library.api",
  lifecycle: {
    activate: "Registers the versioned Garments HTTP contract.",
    deactivate: "Stops Garments route handling with the API runtime.",
    install: "Creates the garments_documents index when an administrator requests a sync.",
    uninstall: "Does not remove source vault files or indexed documents automatically.",
    upgrade: "Version 0.1.2 indexes repository Markdown, MDX, and text sources.",
  },
  publicContracts: [
    "GET /api/garments/v1/assets/:path",
    "GET /api/garments/v1/documents",
    "GET /api/garments/v1/scan",
    "GET /api/garments/v1/documents/:slug",
    "PUT /api/garments/v1/documents/:slug",
    "POST /api/garments/v1/index/sync",
  ],
  scope: "garments",
  version: "0.1.2",
} as const;

export async function registerGarmentsLibraryModule(
  server: FastifyInstance,
  environment: GarmentsEnvironment,
  database: DatabaseProvider<Kysely<GarmentsDatabase>>,
  projectRoot: string,
): Promise<void> {
  const vault = new GarmentsVault(resolve(projectRoot, environment.GARMENTS_VAULT_PATH), projectRoot);
  const service = new GarmentsLibraryService(
    environment,
    vault,
    new GarmentsRenderer(),
    new GarmentsIndexRepository(database.client),
  );
  await registerGarmentsLibraryRoutes(server, environment, service);
}
