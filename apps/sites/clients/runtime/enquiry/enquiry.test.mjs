import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ClientContentStore } from "../content/content-store.mjs";
import { enquiryModule, EnquiryRepository } from "./index.mjs";
import { initialRamuTexPage } from "@codexsun/sites-api/page-content";
import { deliveryPayloadSchema } from "@codexsun/sites-api/delivery-contract";
import { publicationChecksum, verifyPublication } from "@codexsun/sites-api/delivery-integrity";
const input = {
  name: "Test sender",
  email: "sender@example.test",
  company: "Test company",
  phone: "",
  message: "Please discuss our requirements.",
  consent: true,
  website: ""
};
test("enquiries persist, retries are idempotent, and separate client files stay isolated", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "codexsun-site-enquiries-"));
  const first = new ClientContentStore(resolve(directory, "first.sqlite"), "c0de0004");
  const second = new ClientContentStore(resolve(directory, "second.sqlite"), "c0de0002");
  try {
    const service = enquiryModule(first.database);
    enquiryModule(second.database);
    const key = randomUUID();
    const received = service.receive(input, key, "127.0.0.1");
    assert.deepEqual(service.receive(input, key, "127.0.0.1"), received);
    assert.throws(
      () => service.receive({ ...input, message: "A different requirement." }, key, "127.0.0.1"),
      /different enquiry/
    );
    assert.equal(new EnquiryRepository(first.database).list().length, 1);
    assert.equal(new EnquiryRepository(second.database).list().length, 0);
    assert.throws(
      () => service.receive({ ...input, email: "invalid" }, randomUUID(), "127.0.0.1"),
      /Check/
    );
    assert.throws(
      () => service.receive({ ...input, consent: false }, randomUUID(), "127.0.0.1"),
      /Check/
    );
    service.receive({ ...input, website: "spam" }, randomUUID(), "127.0.0.1");
    assert.equal(new EnquiryRepository(first.database).list().length, 1);
  } finally {
    first.close();
    second.close();
  }
  const reopened = new ClientContentStore(resolve(directory, "first.sqlite"), "c0de0004");
  try {
    assert.equal(new EnquiryRepository(reopened.database).list().length, 1);
  } finally {
    reopened.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
test("contact rate limits survive service recreation and old enquiries are removed", () => {
  const store = new ClientContentStore(":memory:", "c0de0004");
  try {
    let service = enquiryModule(store.database);
    const now = Date.now();
    for (let i = 0; i < 10; i++) service.receive(input, randomUUID(), "one-client", now);
    service = enquiryModule(store.database);
    assert.throws(
      () => service.receive(input, randomUUID(), "one-client", now),
      (error) => error.status === 429
    );
    service.receive(input, randomUUID(), "one-client", now + 91 * 86400000);
    assert.equal(
      store.database.prepare("SELECT COUNT(*) AS count FROM sites_enquiries").get().count,
      1
    );
  } finally {
    store.close();
  }
});
test("SQLite publications validate identity, checksum, sequence, retry and replacement", () => {
  const store = new ClientContentStore(":memory:", "c0de0004");
  try {
    const payload = deliveryPayloadSchema.parse({
      schemaVersion: 1,
      siteKey: "a".repeat(64),
      siteUuid: "c0de0004",
      siteSlug: "ramutex",
      content: initialRamuTexPage,
      blogs: []
    });
    const first = {
      ...payload,
      sequence: 1,
      publishedAt: new Date().toISOString(),
      checksum: publicationChecksum(payload)
    };
    store.apply(verifyPublication(first));
    store.apply(verifyPublication(first));
    assert.equal(store.snapshot().sequence, 1);
    const wrongTenant = { ...payload, siteKey: "b".repeat(64) };
    assert.throws(
      () =>
        store.apply({
          ...wrongTenant,
          sequence: 2,
          publishedAt: new Date().toISOString(),
          checksum: publicationChecksum(wrongTenant)
        }),
      /another tenant or deployment/
    );
    const nextPayload = {
      ...payload,
      blogs: [
        {
          title: "Published note",
          slug: "published-note",
          summary: "A note.",
          body: "Published text."
        }
      ]
    };
    const next = {
      ...nextPayload,
      sequence: 2,
      publishedAt: new Date().toISOString(),
      checksum: publicationChecksum(nextPayload)
    };
    store.apply(verifyPublication(next));
    assert.equal(store.snapshot().blogs.length, 1);
    assert.throws(() => store.apply(first), /stale/);
    assert.throws(() => verifyPublication({ ...next, checksum: "0".repeat(64) }), /checksum/);
    assert.throws(() => store.apply({ ...next, siteUuid: "c0de0002" }), /another site/);
    const withdrawn = { ...first, sequence: 3 };
    store.apply(verifyPublication(withdrawn));
    assert.equal(store.snapshot().blogs.length, 0);
  } finally {
    store.close();
  }
});
