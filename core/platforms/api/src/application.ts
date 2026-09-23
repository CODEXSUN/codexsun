import type { ProviderEngine } from "@codexsun/framework";
import Fastify, { LogController } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { LoggerOptions } from "pino";
import { registerHttpSecurity } from "./http-security.js";
import { registerInternalApiReference, registerOpenApi } from "./openapi.js";
import { registerRequestLogging } from "./request-logging.js";
import { registerRequestObservability } from "./request-observability.js";
import { registerRequestScope } from "./request-scope.js";
import { registerRootRoute } from "./root-route.js";
import { registerPlatformRoutes } from "./routes.js";

export interface PlatformApiApplicationOptions {
  readonly engine: ProviderEngine;
  readonly logger: LoggerOptions;
  readonly webOrigin: string;
  readonly stopRuntime: () => void | Promise<void>;
}

export async function createPlatformApiApplication(options: PlatformApiApplicationOptions) {
  const app = Fastify({ logger: options.logger, logController: new LogController({ disableRequestLogging: true }) });
  const api = app.withTypeProvider<ZodTypeProvider>();
  await registerOpenApi(api);
  await registerHttpSecurity(app, options.webOrigin);
  registerRequestObservability(app);
  registerRequestScope(app, options.engine);
  registerRequestLogging(app);
  app.addHook("onClose", () => options.stopRuntime());
  registerRootRoute(app, options.engine, options.webOrigin);
  await registerPlatformRoutes(api, options.engine);
  await registerInternalApiReference(api, options.engine.require("identity.authenticator"));
  return app;
}
