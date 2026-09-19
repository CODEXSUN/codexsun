import assert from "node:assert/strict";
import test from "node:test";
import { fastifyHelmetOptions } from "../src/index.js";

test("defines restrictive API security headers with Swagger-compatible sources", () => {
  const directives = fastifyHelmetOptions.contentSecurityPolicy.directives;
  assert.deepEqual(directives.defaultSrc, ["'self'"]);
  assert.deepEqual(directives.objectSrc, ["'none'"]);
  assert.deepEqual(directives.frameAncestors, ["'none'"]);
  assert.equal(fastifyHelmetOptions.referrerPolicy.policy, "no-referrer");
});
