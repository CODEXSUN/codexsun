import assert from "node:assert/strict";
import test from "node:test";
import { createApiLoggerOptions, LoggerProvider, platformLoggerOptionsKey } from "./logger.js";
import { ProviderEngine } from "@codexsun/framework";

test("uses debug logging locally and info logging outside development", () => {
  const development = createApiLoggerOptions("development");
  const production = createApiLoggerOptions("production");

  assert.equal(development.level, "debug");
  assert.equal(production.level, "info");
  assert.match(JSON.stringify(development.transport), /pino-pretty/u);
  assert.equal(production.transport, undefined);
  assert.equal(typeof development.timestamp, "function");
  assert.match(
    typeof development.timestamp === "function" ? development.timestamp() : "",
    /"time":"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"/u,
  );
  assert.match(JSON.stringify(development.transport), /singleLine/u);
});

test("provides Pino logger options through the Platform runtime", () => {
  const engine = new ProviderEngine();
  engine.register({
    manifest: {
      id: "platform.core",
      owner: "test",
      version: "1.0.2",
      dependencies: [],
      contracts: [],
      events: { published: [], consumed: [] },
    },
    register(): void {},
  });
  engine.register(new LoggerProvider("development"));

  assert.equal(engine.require<ReturnType<typeof createApiLoggerOptions>>(platformLoggerOptionsKey).level, "debug");
});
