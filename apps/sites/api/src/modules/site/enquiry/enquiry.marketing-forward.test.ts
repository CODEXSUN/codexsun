import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { migrateEnquiry } from "./enquiry.migration.js";
import { EnquiryRepository } from "./enquiry.repository.js";
import { EnquiryService } from "./enquiry.service.js";
import { forwardSiteEnquiries } from "./enquiry.marketing-forward.js";

const destination =
  "https://codexsun.com/api/platform/public/marketing/captures?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const input = {
  name: "Fixture prospect",
  email: "prospect@example.test",
  company: "",
  phone: "",
  message: "Please respond to this enquiry.",
  consent: true as const,
  website: ""
};

test("Sites saves an outbox atomically and retains enquiry/identity across failed and repeated forwarding", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec("PRAGMA foreign_keys=ON");
    migrateEnquiry(database);
    const repository = new EnquiryRepository(database),
      service = new EnquiryService(repository);
    const key = randomUUID();
    const receipt = service.receive(input, key, "192.0.2.1");
    assert.deepEqual(service.receive(input, key, "192.0.2.1"), receipt);
    assert.equal(repository.marketingPending(Date.now()).length, 1);
    let sentBody: Record<string, unknown> | null = null;
    const failed = await forwardSiteEnquiries(
      repository,
      destination,
      "https://site.example",
      "a1b2c3d4",
      async () => {
        throw new Error("offline");
      }
    );
    assert.equal(failed.failed, 1);
    assert.ok(repository.find(key));
    database.prepare("UPDATE sites_marketing_outbox SET available_at=0").run();
    const send: typeof fetch = async (_url, init) => {
      sentBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ success: true, data: { reference: "aabbccdd", received: true } })
      );
    };
    const result = await forwardSiteEnquiries(
      repository,
      destination,
      "https://site.example",
      "a1b2c3d4",
      send
    );
    assert.equal(result.sent, 1);
    assert.match(String(sentBody!["sourceKey"]), /^sites:a1b2c3d4:/);
    assert.equal(sentBody!["sourceNoticeVersion"], "unknown");
    assert.equal(sentBody!["privacyConsent"], true);
    assert.equal(repository.marketingPending(Date.now()).length, 0);
    assert.ok(repository.find(key));
    assert.deepEqual(
      await forwardSiteEnquiries(repository, destination, "https://site.example", "a1b2c3d4", send),
      { sent: 0, failed: 0 }
    );
    await assert.rejects(
      forwardSiteEnquiries(
        repository,
        "https://attacker.example/collect",
        "https://site.example",
        "a1b2c3d4",
        send
      )
    );
  } finally {
    database.close();
  }
});

test("D1 outbox trigger shares the source insert transaction and does not duplicate retries", () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec("PRAGMA foreign_keys=ON");
    database.exec(readFileSync(new URL("./enquiry.d1.sql", import.meta.url), "utf8"));
    const insert = database.prepare(
      "INSERT INTO sites_enquiries(reference,request_key,payload_hash,rate_key,name,email,company,phone,message,consented_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    insert.run(
      "source-1",
      "key-1",
      "hash",
      "rate",
      input.name,
      input.email,
      "",
      "",
      input.message,
      new Date().toISOString(),
      Date.now(),
      new Date().toISOString()
    );
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM sites_marketing_outbox").get()!.count,
      1
    );
    database.exec("BEGIN");
    insert.run(
      "source-2",
      "key-2",
      "hash",
      "rate",
      input.name,
      input.email,
      "",
      "",
      input.message,
      new Date().toISOString(),
      Date.now(),
      new Date().toISOString()
    );
    database.exec("ROLLBACK");
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM sites_marketing_outbox").get()!.count,
      1
    );
    database.prepare("DELETE FROM sites_enquiries WHERE reference=?").run("source-1");
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM sites_marketing_outbox").get()!.count,
      0
    );
  } finally {
    database.close();
  }
});
