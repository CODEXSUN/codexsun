import type { DependencyScope, ProviderEngine } from "@codexsun/framework";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    scope: DependencyScope;
  }
}

/** Creates one dependency scope for each request without exposing it across requests. */
export function registerRequestScope(app: FastifyInstance, engine: ProviderEngine): void {
  app.decorateRequest("scope", null as unknown as DependencyScope);
  app.addHook("onRequest", (request, _reply, done) => {
    const scope = engine.createScope();
    scope.provide("request.correlation-id", request.correlationId);
    scope.provide("request.method", request.method);
    scope.provide("request.url", request.url);
    request.scope = scope;
    done();
  });
}
