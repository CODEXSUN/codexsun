import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifiedPortalClient } from "./tconnect-public-client.js";
test("only a fresh Worker-signed client identity can affect registration rate limits", () => {
  const secret = "test-secret",
    client = "a".repeat(64),
    timestamp = String(Date.now());
  const headers = {
    "x-codexsun-public-client": client,
    "x-codexsun-client-time": timestamp,
    "x-codexsun-client-signature": createHmac("sha256", secret)
      .update(`tconnect-client.${timestamp}.${client}`)
      .digest("hex")
  };
  assert.equal(verifiedPortalClient(headers, secret), `cloudflare:${client}`);
  assert.equal(verifiedPortalClient(headers, "forged"), null);
  assert.equal(verifiedPortalClient({ ...headers, "x-codexsun-client-time": "0" }, secret), null);
  assert.equal(verifiedPortalClient({}, secret), null);
});
