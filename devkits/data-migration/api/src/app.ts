import "@codexsun/framework/api";
import type { FastifyInstance } from "fastify";
import { migrationModule } from "./modules/migration/index.js";
import type { DataMigrationHost } from "./modules/migration/index.js";

export async function registerDataMigrationApi(app: FastifyInstance, host: DataMigrationHost) {
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", async (request) => {
        await host.authorize(request);
      });
      await migrationModule.register(scope, host);
    },
    { prefix: "/api/data-migration" }
  );
}
