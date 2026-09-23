import type { FastifyInstance, FastifyRequest } from "fastify";

export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook("onRequest", (request, _reply, done) => {
    const { method, path } = requestLogFields(request);
    app.log.info(`Request ${method} ${path}`);
    done();
  });
  app.addHook("onResponse", (request, reply, done) => {
    const { method, path } = requestLogFields(request);
    app.log.info(`Response ${method} ${path} ${reply.statusCode} ${Math.round(reply.elapsedTime)}ms`);
    done();
  });
}

function requestLogFields(request: FastifyRequest) {
  return { method: request.method, path: request.url.split("?", 1)[0] };
}
