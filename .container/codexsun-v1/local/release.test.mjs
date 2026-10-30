import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { applications } from "./config.mjs";
import {
  recordReplacement,
  recover,
  stopAfterDatabaseChange,
  verifyStorefront
} from "./release.mjs";

function replacementFixture() {
  const candidate = {
    services: Object.fromEntries(applications.map((name) => [name, { image: `image-${name}` }]))
  };
  const containers = applications.map((name) => ({
    Id: `id-${name}`,
    Name: `/${name}`,
    Image: candidate.services[name].image,
    State: { Running: true, Health: { Status: "healthy" } }
  }));
  const config = { database: { id: "db" }, redis: { id: "redis" }, relay: { id: "relay" } };
  const replacement = {
    model: structuredClone(candidate),
    database: config.database,
    redis: config.redis
  };
  const writes = [];
  return {
    candidate,
    containers,
    config,
    replacement,
    writes,
    docker: { inspect: (name) => containers.find((item) => item.Name === `/${name}`) },
    operations: {
      inspect: () => ({ containers }),
      capture: () => replacement,
      write: async (_path, value) => writes.push(value)
    }
  };
}

test("records only a complete candidate with matching configuration and image identities", async () => {
  const fixture = replacementFixture();
  await recordReplacement(
    fixture.docker,
    ".",
    fixture.config,
    fixture.candidate,
    fixture.operations
  );
  assert.equal(fixture.writes.length, 1);
  assert.deepEqual(fixture.writes[0].relay, fixture.config.relay);
});

test("does not record mismatched or partially replaced candidates", async () => {
  for (const mismatch of ["image", "configuration", "database", "partial", "changed-container"]) {
    const fixture = replacementFixture();
    if (mismatch === "image") fixture.containers[0].Image = "unexpected";
    if (mismatch === "configuration")
      fixture.replacement.model.services[applications[0]].environment = { changed: "yes" };
    if (mismatch === "database") fixture.replacement.database = { id: "other" };
    if (mismatch === "partial") fixture.containers.pop();
    if (mismatch === "changed-container")
      fixture.docker.inspect = () => ({ ...fixture.containers[0], Id: "changed" });
    await assert.rejects(
      recordReplacement(fixture.docker, ".", fixture.config, fixture.candidate, fixture.operations)
    );
    assert.equal(fixture.writes.length, 0, mismatch);
  }
});

test("an interrupted configuration write cannot report replacement success", async () => {
  const fixture = replacementFixture();
  fixture.operations.write = async () => {
    throw new Error("write interrupted");
  };
  await assert.rejects(
    recordReplacement(fixture.docker, ".", fixture.config, fixture.candidate, fixture.operations),
    /write interrupted/
  );
  assert.equal(fixture.writes.length, 0);
});

test("post-migration recovery attempts all stops even if relay or result writing fails", async () => {
  const fixture = replacementFixture();
  const stopped = [];
  fixture.docker.exists = () => true;
  fixture.docker.stop = async (name) => {
    stopped.push(name);
  };
  const relay = {
    keepStopped: async () => {
      throw new Error("relay failure");
    }
  };
  await assert.rejects(
    stopAfterDatabaseChange(fixture.docker, relay, fixture.candidate, ".", async () => {
      throw new Error("write failure");
    }),
    /database relay, recovery record/
  );
  assert.deepEqual(stopped, applications);
});

test("post-migration recovery records failure and does not stop an unrelated image", async () => {
  const fixture = replacementFixture();
  const stopped = [];
  fixture.containers[0].Image = "other-image";
  fixture.docker.exists = () => true;
  fixture.docker.stop = async (name) => {
    stopped.push(name);
  };
  let result;
  await assert.rejects(
    stopAfterDatabaseChange(fixture.docker, null, fixture.candidate, ".", async (_path, value) => {
      result = value;
    }),
    /codexsun-api/
  );
  assert.deepEqual(stopped, applications.slice(1));
  assert.equal(result.success, false);
  assert.equal(result.databaseChangesPossible, true);
  assert.equal(result.applicationRecoveryCompleted, false);
});

test("storefront check accepts only the expected unmapped-domain denial", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "The public application is not available for this domain."
          }
        }),
        { status: 404 }
      );
    await verifyStorefront("http://127.0.0.1/bootstrap");
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: false, error: { code: "OTHER" } }), { status: 404 });
    await assert.rejects(verifyStorefront("http://127.0.0.1/bootstrap"));
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });
    await verifyStorefront("http://127.0.0.1/bootstrap");
  } finally {
    globalThis.fetch = original;
  }
});

test("storefront check retries a transient proxy failure", async () => {
  let attempts = 0;
  await verifyStorefront("http://127.0.0.1/bootstrap", {
    request: async () => {
      attempts += 1;
      return attempts === 1
        ? new Response("upstream unavailable", { status: 502 })
        : new Response(JSON.stringify({ success: true }), { status: 200 });
    },
    pause: async () => {}
  });
  assert.equal(attempts, 2);
});

test("failed local update uses the saved app model without database recovery", async () => {
  const base = resolve(import.meta.dirname, "../../../dist/deployment-local-recovery-tests");
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(join(base, "case-"));
  const previousFile = join(directory, "previous.private.json");
  const calls = [];
  const docker = {
    resumeForRecovery() {
      calls.push("resume");
    },
    async logged(args, path) {
      calls.push({ args, path });
    }
  };
  await recover(
    docker,
    { project: "codexsun-local-cloud" },
    "update",
    true,
    {},
    previousFile,
    [],
    directory
  );
  assert.equal(calls[0], "resume");
  assert.deepEqual(calls[1].args.slice(-applications.length), applications);
  assert.ok(calls[1].args.includes(previousFile));
  const result = JSON.parse(await readFile(join(directory, "result.json"), "utf8"));
  assert.equal(result.applicationRecoveryCompleted, true);
  assert.equal(result.databaseRollbackAttempted, false);
});
