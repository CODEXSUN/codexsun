import type { FastifyInstance } from "fastify";
import type { DataMigrationHost } from "./migration.types.js";
import { registerMigrationRoutes } from "./migration.routes.js";

export const migrationModule = {
  key: "data-migration.migration",
  register(app: FastifyInstance, host: DataMigrationHost) {
    return registerMigrationRoutes(app, host);
  }
};
