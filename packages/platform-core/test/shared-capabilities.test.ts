import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, stringifyCsv } from "../src/csv.js";
import { EnvironmentSecretProvider } from "../src/environment-secret-provider.js";
import { signWebhookPayload, verifyWebhookPayload } from "../src/webhook-signature.js";

test("environment secret provider resolves only configured references", async () => {
  const provider = new EnvironmentSecretProvider({ mail: "MAIL_SECRET" }, { MAIL_SECRET: "private-value", OTHER: "not-exposed" });

  assert.equal(await provider.resolve("mail"), "private-value");
  assert.equal(await provider.resolve("OTHER"), undefined);
  assert.equal(await provider.resolve("toString"), undefined);
  assert.equal(await provider.resolve("missing"), undefined);
});

test("webhook signatures verify exact payload bytes and reject tampering", () => {
  const signature = signWebhookPayload("payload", "secret");

  assert.equal(verifyWebhookPayload("payload", "secret", signature), true);
  assert.equal(verifyWebhookPayload("changed", "secret", signature), false);
  assert.equal(verifyWebhookPayload("payload", "wrong", signature), false);
  assert.equal(verifyWebhookPayload("payload", "secret", "sha256=bad"), false);
});

test("CSV round-trips quoted cells and neutralizes spreadsheet formulas", () => {
  const rows = [["name", "value"], ["Jane, Doe", 'line one\nline "two"'], ["formula", "=2+2"]];
  const encoded = stringifyCsv(rows);

  assert.deepEqual(parseCsv(encoded), [["name", "value"], ["Jane, Doe", 'line one\nline "two"'], ["formula", "'=2+2"]]);
});

test("CSV parser rejects malformed quotes", () => {
  assert.throws(() => parseCsv('bad"quote,cell'), /quote must start/u);
  assert.throws(() => parseCsv('"unterminated'), /unterminated/u);
  assert.throws(() => parseCsv('"quoted"suffix'), /must end/u);
  assert.deepEqual(parseCsv('""'), [[""]]);
});
