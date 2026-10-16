import type { DeveloperDocsRead } from "./modules/diagnostics/diagnostics.types.js";
import "@codexsun/framework/api";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { diagnosticsModule, type ZunoConfig } from "./modules/diagnostics/index.js";
import { casesModule, type ZunoCaseContext } from "./modules/cases/index.js";
import { watchModule, type RawWatchSnapshot } from "./modules/watch/index.js";
import { conversationsModule } from "./modules/conversations/index.js";

export const zunoApiModuleKeys = [
  diagnosticsModule.key,
  casesModule.key,
  watchModule.key,
  conversationsModule.key
] as const;

export async function registerZunoApi(
  app: FastifyInstance,
  options: {
    authorize(request: FastifyRequest): Promise<void> | void;
    resolveCaseContext(request: FastifyRequest): Promise<ZunoCaseContext> | ZunoCaseContext;
    loadWatchSnapshot(): Promise<RawWatchSnapshot>;
    config: ZunoConfig;
    readDocs?: DeveloperDocsRead;
  }
) {
  await app.register(
    async (zuno) => {
      zuno.addHook("preHandler", async (request) => {
        await options.authorize(request);
      });
      await diagnosticsModule.register({
        app: zuno,
        config: options.config,
        ...(options.readDocs ? { readDocs: options.readDocs } : {})
      });
      casesModule.register({ app: zuno, resolveContext: options.resolveCaseContext });
      conversationsModule.register({
        app: zuno,
        config: options.config,
        ...(options.readDocs ? { readDocs: options.readDocs } : {}),
        resolveContext: options.resolveCaseContext,
        loadWatchSnapshot: options.loadWatchSnapshot
      });
      watchModule.register({
        app: zuno,
        config: options.config,
        ...(options.readDocs ? { readDocs: options.readDocs } : {}),
        loadSnapshot: options.loadWatchSnapshot
      });
    },
    { prefix: "/zuno" }
  );
}
