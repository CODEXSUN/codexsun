import assert from "node:assert/strict";
import test from "node:test";
import { failure, type ModuleProvider, type ProviderManifest, success } from "../src/index.js";
import { createProviderFixture } from "../src/test-harness.js";

function manifest(id: string, dependencies: readonly string[] = []): ProviderManifest {
  return {
    id,
    owner: "packages/framework/test",
    version: "1.0.2",
    dependencies,
    contracts: [],
    events: { published: [], consumed: [] },
  };
}

test("runs provider lifecycle hooks with the normalized manifest", () => {
  const fixture = createProviderFixture();
  const provider = fixture.provider(manifest("foundation"), {
    register: (context) => fixture.events.push(`register:${context.manifest.id}`),
    start: (context) => fixture.events.push(`start:${context.manifest.id}`),
    stop: (context) => fixture.events.push(`stop:${context.manifest.id}`),
  });

  fixture.engine.register(provider);
  fixture.engine.start();
  fixture.engine.stop();

  assert.deepEqual(fixture.events, ["register:foundation", "start:foundation", "stop:foundation"]);
});

test("orders starts by provider dependency rather than registration order", () => {
  const fixture = createProviderFixture();
  fixture.engine.register(
    fixture.provider(manifest("dependent", ["foundation"]), {
      start: () => fixture.events.push("dependent"),
    }),
  );
  fixture.engine.register(
    fixture.provider(manifest("foundation"), {
      start: () => fixture.events.push("foundation"),
    }),
  );

  fixture.engine.start();

  assert.deepEqual(fixture.events, ["foundation", "dependent"]);
});

test("rejects unavailable provider dependencies and dependency cycles", () => {
  const missing = createProviderFixture();
  missing.engine.register(missing.provider(manifest("dependent", ["missing"])));
  assert.throws(() => missing.engine.start(), /requires unavailable provider: missing/u);

  const cycle = createProviderFixture();
  cycle.engine.register(cycle.provider(manifest("first", ["second"])));
  cycle.engine.register(cycle.provider(manifest("second", ["first"])));
  assert.throws(() => cycle.engine.start(), /Provider dependency cycle: first -> second -> first/u);
});

test("wraps lifecycle failures with provider and stage context", () => {
  const fixture = createProviderFixture();
  const failing: ModuleProvider = fixture.provider(manifest("failing"), {
    register: () => {
      throw new Error("expected");
    },
  });

  assert.throws(() => fixture.engine.register(failing), /Provider failing failed during register/u);
});

test("cleans up started providers when a later provider cannot start", () => {
  const fixture = createProviderFixture();
  fixture.engine.register(
    fixture.provider(manifest("foundation"), {
      start: () => fixture.events.push("start:foundation"),
      stop: () => fixture.events.push("stop:foundation"),
    }),
  );
  fixture.engine.register(
    fixture.provider(manifest("failing", ["foundation"]), {
      start: () => {
        throw new Error("expected");
      },
    }),
  );

  assert.throws(() => fixture.engine.start(), /Provider failing failed during start/u);
  assert.deepEqual(fixture.events, ["start:foundation", "stop:foundation"]);
});

test("uses stable result contracts", () => {
  assert.deepEqual(success({ id: "one" }), { ok: true, data: { id: "one" } });
  assert.deepEqual(failure({ code: "invalid", message: "Invalid", retryable: false }), {
    ok: false,
    error: { code: "invalid", message: "Invalid", retryable: false },
  });
});

test("reports provider readiness without provider values", () => {
  const fixture = createProviderFixture();
  fixture.engine.register(fixture.provider(manifest("foundation")));

  assert.deepEqual(fixture.engine.readiness(), [{ id: "foundation", state: "registered" }]);
  assert.equal(fixture.engine.isReady(), false);

  fixture.engine.start();
  assert.deepEqual(fixture.engine.readiness(), [{ id: "foundation", state: "started" }]);
  assert.equal(fixture.engine.isReady(), true);

  fixture.engine.stop();
  assert.deepEqual(fixture.engine.readiness(), [{ id: "foundation", state: "stopped" }]);
});
