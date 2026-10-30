import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { enquiryModule } from "./enquiry.module.js";
import { EnquiryRepository } from "./enquiry.repository.js";
import { enquiryQuerySchema } from "./enquiry.schema.js";
import { withClientEnquiries } from "./enquiry.connection.js";
import { registerEnquiryRoutes } from "./enquiry.routes.js";

const input = {
  name: "Inbox verification",
  email: "inbox@example.test",
  company: "Enquiry 100%",
  phone: "",
  message: "Please discuss our business workflow.",
  consent: true,
  website: ""
};
const query = enquiryQuerySchema.parse({});

test("SQLite inbox upgrades existing records and persists status, audit, trash, restore and revision conflicts", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "codexsun-inbox-"));
  const path = resolve(directory, "content.sqlite");
  let db = new DatabaseSync(path);
  try {
    // This is the previous deployed schema, with an actual stored enquiry.
    db.exec(
      "CREATE TABLE sites_enquiries(id INTEGER PRIMARY KEY AUTOINCREMENT,reference TEXT NOT NULL UNIQUE,request_key TEXT NOT NULL UNIQUE,payload_hash TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consented_at TEXT NOT NULL,created_at INTEGER NOT NULL)"
    );
    const reference = randomUUID();
    db.prepare("INSERT INTO sites_enquiries VALUES(NULL,?,?,?,?,?,?,?,?,?,?)").run(
      reference,
      randomUUID(),
      "old-checksum",
      input.name,
      input.email,
      input.company,
      "",
      input.message,
      new Date().toISOString(),
      Date.now()
    );
    let service = enquiryModule(db);
    assert.equal(service.list(query).total, 1);
    assert.equal(service.show(reference).status, "new");
    assert.equal(service.list({ ...query, q: "100%" }).total, 1);
    assert.equal(service.list({ ...query, q: "100_" }).total, 0);
    const changed = service.change(reference, 1, "status", "reviewer@example.test", "in_progress");
    assert.equal(changed.revision, 2);
    assert.equal(changed.activity[0]?.actor, "reviewer@example.test");
    assert.throws(() => service.change(reference, 1, "status", "stale", "resolved"), /changed/);
    const deleted = service.change(reference, 2, "delete", "reviewer@example.test");
    assert.ok(deleted.deletedAt);
    assert.equal(service.list(query).total, 0);
    assert.equal(service.list({ ...query, trash: "yes" }).total, 1);
    assert.throws(() => service.change(reference, 3, "status", "reviewer", "resolved"), /Restore/);
    service.change(reference, 3, "restore", "reviewer@example.test");
    db.close();
    db = new DatabaseSync(path);
    service = enquiryModule(db);
    assert.equal(service.show(reference).revision, 4);
    assert.equal(service.show(reference).status, "in_progress");
    assert.equal(service.show(reference).activity.length, 3);
    assert.equal(new EnquiryRepository(db).list().length, 1);
    db.prepare("UPDATE sites_enquiries SET created_at=0").run();
    new EnquiryRepository(db).expire();
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sites_enquiry_activity").get()!.n, 0);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("SQLite access binds the server tenant and client, never a browser database path", () => {
  const root = mkdtempSync(resolve(tmpdir(), "codexsun-inbox-scope-"));
  const tenant = "tenant-one",
    uuid = "aabbccdd";
  const key = createHash("sha256").update(`${tenant}:${uuid}`).digest("hex");
  const directory = resolve(root, key);
  mkdirSync(directory);
  const db = new DatabaseSync(resolve(directory, "content.sqlite"));
  db.exec(
    "CREATE TABLE sites_delivery_identity(id INTEGER PRIMARY KEY,site_uuid TEXT); CREATE TABLE sites_delivery_binding(id INTEGER PRIMARY KEY,site_key TEXT)"
  );
  db.prepare("INSERT INTO sites_delivery_identity VALUES(1,?)").run(uuid);
  db.prepare("INSERT INTO sites_delivery_binding VALUES(1,?)").run(key);
  enquiryModule(db).receive(input, randomUUID(), "127.0.0.1");
  db.close();
  try {
    assert.equal(
      withClientEnquiries(tenant, uuid, (service) => service.list(query).total, root),
      1
    );
    assert.throws(
      () => withClientEnquiries("tenant-two", uuid, (service) => service.list(query), root),
      /Start/
    );
    assert.throws(
      () => withClientEnquiries(tenant, "11223344", (service) => service.list(query), root),
      /Start/
    );
    const other = new DatabaseSync(resolve(directory, "content.sqlite"));
    other.prepare("UPDATE sites_delivery_identity SET site_uuid='11223344'").run();
    other.close();
    assert.throws(
      () => withClientEnquiries(tenant, uuid, (service) => service.list(query), root),
      /another client/
    );
    const mismatch = new DatabaseSync(resolve(directory, "content.sqlite"));
    mismatch.prepare("UPDATE sites_delivery_identity SET site_uuid=?").run(uuid);
    mismatch.prepare("UPDATE sites_delivery_binding SET site_key=?").run("f".repeat(64));
    mismatch.close();
    assert.throws(
      () => withClientEnquiries(tenant, uuid, (service) => service.list(query), root),
      /another tenant/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("inbox HTTP actions deny access before opening any client database", async () => {
  const app = Fastify();
  let checks = 0;
  registerEnquiryRoutes(app, async () => {
    checks++;
    throw AppError.forbidden("Inbox denied.");
  });
  const prefix = `/sites/aabbccdd/enquiries`,
    reference = randomUUID();
  try {
    for (const request of [
      { method: "GET" as const, url: prefix },
      { method: "GET" as const, url: `${prefix}/${reference}` },
      {
        method: "PUT" as const,
        url: `${prefix}/${reference}/status`,
        payload: { revision: 1, status: "resolved" }
      },
      { method: "POST" as const, url: `${prefix}/${reference}/delete`, payload: { revision: 1 } },
      { method: "POST" as const, url: `${prefix}/${reference}/restore`, payload: { revision: 1 } }
    ])
      assert.equal((await app.inject(request)).statusCode, 403);
    assert.equal(checks, 5);
  } finally {
    await app.close();
  }
});
