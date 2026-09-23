import { trace } from "@opentelemetry/api";
import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    correlationId: string;
  }
}

export function registerRequestObservability(app: FastifyInstance): void {
  const spans = new WeakMap<FastifyRequest, ReturnType<ReturnType<typeof trace.getTracer>["startSpan"]>>();
  app.decorateRequest("correlationId", "");
  app.addHook("onRequest", (request, reply, done) => {
    request.correlationId = correlationId(request);
    reply.header("x-correlation-id", request.correlationId);
    const span = trace.getTracer("@codexsun/platform-api").startSpan(`${request.method} ${request.url}`);
    span.setAttribute("codexsun.correlation_id", request.correlationId);
    spans.set(request, span);
    done();
  });
  app.addHook("onResponse", (request, reply, done) => {
    const span = spans.get(request);
    span?.setAttribute("http.response.status_code", reply.statusCode);
    span?.end();
    spans.delete(request);
    done();
  });
}

function correlationId(request: FastifyRequest): string {
  const header = request.headers["x-correlation-id"];
  const candidate = Array.isArray(header) ? header[0] : header;
  return candidate && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(candidate) ? candidate : crypto.randomUUID();
}
