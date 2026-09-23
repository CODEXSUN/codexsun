import assert from "node:assert/strict";
import test from "node:test";
import Fastify, { LogController, type FastifyBaseLogger } from "fastify";
import pino from "pino";
import { registerRequestLogging } from "./request-logging.js";

test("logs safe request and response fields with the response duration", async () => {
  const entries: Record<string, unknown>[] = [];
  const logger = pino({}, { write: (line) => entries.push(JSON.parse(line)) });
  const app = Fastify({
    loggerInstance: logger as unknown as FastifyBaseLogger,
    logController: new LogController({ disableRequestLogging: true }),
  });
  registerRequestLogging(app);
  app.get("/health", async () => ({ status: "ok" }));

  const response = await app.inject({ method: "GET", url: "/health?token=private" });
  await app.close();

  assert.equal(response.statusCode, 200);
  const received = entries.find((entry) => entry.msg === "Request GET /health");
  const sent = entries.find((entry) => String(entry.msg).startsWith("Response GET /health 200 "));
  assert.equal(received?.msg, "Request GET /health");
  assert.match(String(sent?.msg), /^Response GET \/health 200 \d+ms$/u);
  assert.equal("reqId" in (received ?? {}), false);
  assert.equal("remoteAddress" in (received ?? {}), false);
});
