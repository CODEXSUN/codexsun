import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { D1EnquiryRepository } from "./enquiry.d1.repository.mjs";
import { D1EnquiryService } from "./enquiry.d1.service.mjs";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("./enquiry.d1.sql", import.meta.url), "utf8"));
  sqlite
    .prepare("INSERT INTO sites_delivery_identity VALUES(1,?,?)")
    .run("c0de0002", "a".repeat(64));
  const database = {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) {
          values = args;
          return this;
        },
        async first() {
          return sqlite.prepare(sql).get(...values) ?? null;
        },
        async run() {
          return sqlite.prepare(sql).run(...values);
        }
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    }
  };
  const repository = new D1EnquiryRepository(database, "c0de0002", "a".repeat(64));
  return { sqlite, repository, service: new D1EnquiryService(repository) };
}
const input = {
  name: "Deployment verification",
  email: "test@example.com",
  company: "",
  phone: "",
  message: "A test enquiry for the adapter.",
  consent: true,
  website: ""
};

test("D1 enquiries preserve idempotency, conflicts, retention, and the atomic rate boundary", async () => {
  const { sqlite, repository, service } = fixture();
  try {
    const key = randomUUID();
    const first = await service.receive(input, key, "192.0.2.1");
    assert.deepEqual(await service.receive(input, key, "192.0.2.1"), first);
    await assert.rejects(
      service.receive({ ...input, message: "A changed enquiry payload." }, key, "192.0.2.1"),
      { status: 409 }
    );
    for (let index = 1; index < 10; index++)
      await service.receive(input, randomUUID(), "192.0.2.1");
    await assert.rejects(service.receive(input, randomUUID(), "192.0.2.1"), { status: 429 });
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM sites_enquiries").get().count, 10);
    assert.equal(
      sqlite.prepare("SELECT COUNT(*) AS count FROM sites_enquiry_activity").get().count,
      10
    );
    assert.deepEqual(await service.receive(input, key, "192.0.2.1"), first);
    await repository.expire(Date.now() + 91 * 86400000);
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM sites_enquiries").get().count, 0);
    assert.equal(
      sqlite.prepare("SELECT COUNT(*) AS count FROM sites_enquiry_activity").get().count,
      0
    );
  } finally {
    sqlite.close();
  }
});

test("D1 rejects invalid fields, missing consent, and another site's database without saving", async () => {
  const { sqlite, repository, service } = fixture();
  try {
    await assert.rejects(service.receive({ ...input, consent: false }, randomUUID(), "address"), {
      status: 422
    });
    await assert.rejects(service.receive(input, "bad", "address"), { status: 400 });
    repository.siteUuid = "c0de0004";
    await assert.rejects(service.receive(input, randomUUID(), "address"), /identity mismatch/);
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM sites_enquiries").get().count, 0);
  } finally {
    sqlite.close();
  }
});

test("D1 duplicate insert cannot consume rate quota or replace a prior message", async () => {
  const { sqlite, repository, service } = fixture();
  try {
    const key = randomUUID();
    const first = await service.receive(input, key, "192.0.2.2");
    const saved = sqlite.prepare("SELECT * FROM sites_enquiries").get();
    const retry = await repository.receive(
      input,
      key,
      saved.payload_hash,
      saved.rate_key,
      randomUUID(),
      Date.now()
    );
    assert.deepEqual(retry, first);
    assert.equal(sqlite.prepare("SELECT hits FROM sites_enquiry_limits").get().hits, 1);
    await assert.rejects(
      repository.receive(input, key, "different", saved.rate_key, randomUUID(), Date.now()),
      { status: 409 }
    );
  } finally {
    sqlite.close();
  }
});

test("Worker scheduled forwarding registers its work with the execution context", async () => {
  const { createSiteWorker } = await import("../../../../../clients/cloudflare/worker.mjs");
  const statements = [];
  const database = {
    prepare(text) {
      return {
        bind() {
          return this;
        },
        async first() {
          return { site_uuid: "c0de0002", site_key: "a".repeat(64) };
        },
        async run() {
          statements.push(text);
          return {};
        },
        async all() {
          return { results: [] };
        }
      };
    },
    async batch(items) {
      return Promise.all(items.map((item) => item.run()));
    }
  };
  const worker = createSiteWorker(
    {
      routes: [],
      content: { siteUuid: "c0de0002", siteSlug: "fixture" },
      siteKey: "a".repeat(64),
      sequence: 1
    },
    "https://site.example"
  );
  const work = [];
  await worker.scheduled(
    {},
    {
      CODEXSUN_SITES_DB: database,
      CODEXSUN_MARKETING_CAPTURE_URL:
        "https://app.codexsun.com/api/platform/public/marketing/captures?token=" + "a".repeat(48)
    },
    {
      waitUntil(promise) {
        work.push(promise);
      }
    }
  );
  assert.equal(work.length, 1);
  await Promise.all(work);
  assert.ok(statements.some((statement) => statement.includes("DELETE")));
});
