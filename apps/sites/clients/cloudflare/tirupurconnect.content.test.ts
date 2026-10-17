import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createHmac, createHash } from "node:crypto";
import {
  receivePublication,
  readPublication,
  publicationEnvelope
} from "./tirupurconnect.content.mjs";
import { initialSitePage } from "../../api/src/modules/site/page/page.defaults.js";
import { publicationChecksum } from "../../api/src/modules/site/publication/publication.integrity.js";
class D1Test {
  db = new DatabaseSync(":memory:");
  constructor() {
    this.db.exec(readFileSync(new URL("./tirupurconnect.content.sql", import.meta.url), "utf8"));
  }
  prepare(sql: string) {
    const execute = (values: unknown[] = []) => ({
      bind: (...next: unknown[]) => execute(next),
      first: async () => this.db.prepare(sql).get(...(values as never[])),
      run: async () => this.db.prepare(sql).run(...(values as never[]))
    });
    return execute();
  }
  async batch(statements: Array<{ run(): Promise<unknown> }>) {
    this.db.exec("BEGIN");
    try {
      for (const statement of statements) await statement.run();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
const secret = "test-only-publish-secret";
const siteKey = createHash("sha256").update("test-tenant:e303865e").digest("hex");
const payload = {
  schemaVersion: 1 as const,
  siteKey,
  siteUuid: "e303865e",
  siteSlug: "tirupurconnect",
  content: initialSitePage({ id: 1, uuid: "e303865e", slug: "tirupurconnect", status: "active" }),
  blogs: []
};
function snapshot(version = 1) {
  return {
    ...payload,
    sequence: version,
    publishedAt: new Date().toISOString(),
    checksum: publicationChecksum(payload)
  };
}
function request(value: unknown, timestamp = String(Date.now()), key = secret) {
  const body = JSON.stringify(value);
  return new Request("https://tirupurconnect.com/__sites-publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-codexsun-timestamp": timestamp,
      "x-codexsun-signature": createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex")
    },
    body
  });
}
function environment() {
  return {
    CODEXSUN_SITES_PUBLISH_SECRET: secret,
    CODEXSUN_TCONNECT_CONTENT: new D1Test(),
    CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID: "e303865e",
    CODEXSUN_SITES_TIRUPURCONNECT_SITE_KEY: siteKey
  };
}
test("signed delivery is persistent, idempotent and rejects stale replacement", async () => {
  const env = environment();
  try {
    assert.equal((await receivePublication(request(snapshot(2)), env)).status, 200);
    assert.equal((await receivePublication(request(snapshot(2)), env)).status, 200);
    const stale = await receivePublication(request(snapshot(1)), env);
    assert.equal((await stale.json()).status, "superseded");
    const row = await readPublication(env);
    assert.equal(row.version, 2);
    assert.equal(publicationEnvelope(row).data.content.profile.brand, "Tirupur Connect");
    assert.equal(
      env.CODEXSUN_TCONNECT_CONTENT.db
        .prepare("SELECT COUNT(*) AS count FROM sites_publication_history")
        .get()!.count,
      2
    );
  } finally {
    env.CODEXSUN_TCONNECT_CONTENT.db.close();
  }
});
test("publication authentication, tenant identity and checksum fail closed", async () => {
  const env = environment();
  try {
    assert.equal(
      (await receivePublication(request(snapshot(), String(Date.now()), "forged"), env)).status,
      401
    );
    assert.equal(
      (await receivePublication(request(snapshot(), String(Date.now() - 360000)), env)).status,
      401
    );
    assert.equal(
      (await receivePublication(request({ ...snapshot(), siteKey: "b".repeat(64) }), env)).status,
      403
    );
    assert.equal(
      (await receivePublication(request({ ...snapshot(), checksum: "0".repeat(64) }), env)).status,
      409
    );
    assert.equal(await readPublication(env), undefined);
  } finally {
    env.CODEXSUN_TCONNECT_CONTENT.db.close();
  }
});
