import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createPlatformJwtToken, defaultPlatformJwtAudience, defaultPlatformJwtIssuer } from "../src/platform-jwt.js";

test("creates an HS256 token with the Platform defaults", () => {
  const secret = "platform-jwt-test-secret-platform-jwt-test";
  const token = createPlatformJwtToken({ secret }, { subject: "platform.operator", expiresInSeconds: 60 });
  const [header, payload, signature] = token.split(".");
  const claims = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));

  assert.deepEqual(JSON.parse(Buffer.from(header!, "base64url").toString("utf8")), { alg: "HS256", typ: "JWT" });
  assert.equal(claims.sub, "platform.operator");
  assert.equal(claims.iss, defaultPlatformJwtIssuer);
  assert.equal(claims.aud, defaultPlatformJwtAudience);
  assert.equal(signature, createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url"));
});
