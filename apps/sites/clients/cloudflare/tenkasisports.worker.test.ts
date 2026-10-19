import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createHmac, createHash } from "node:crypto";
import {
  receivePublication,
  readPublication,
  publicationEnvelope
} from "./tenkasisports.content.mjs";
import worker from "./tenkasisports.mjs";
import { initialSitePage } from "../../api/src/modules/site/page/page.defaults.js";
import { publicationChecksum } from "../../api/src/modules/site/publication/publication.integrity.js";
import { verifiedSportsclubPortalClient } from "../../../platform/api/src/sportsclub-public-client.js";

class D1Test {
  db = new DatabaseSync(":memory:");
  constructor() {
    this.db.exec(readFileSync(new URL("./tenkasisports.content.sql", import.meta.url), "utf8"));
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
const siteUuid = "c0de0006";
const siteKey = createHash("sha256").update("test-tenant:c0de0006").digest("hex");
const payload = {
  schemaVersion: 1 as const,
  siteKey,
  siteUuid,
  siteSlug: "tenkasisports",
  content: initialSitePage({ id: 1, uuid: siteUuid, slug: "tenkasisports", status: "active" }),
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

function publishRequest(value: unknown, timestamp = String(Date.now()), key = secret) {
  const body = JSON.stringify(value);
  return new Request("https://tenkasisports.com/__sites-publish", {
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
    CODEXSUN_TENKASISPORTS_CONTENT: new D1Test(),
    CODEXSUN_SITES_TENKASISPORTS_SITE_UUID: siteUuid,
    CODEXSUN_SITES_TENKASISPORTS_SITE_KEY: siteKey,
    CODEXSUN_SPORTSCLUB_API_ORIGIN: "https://codexsun.com",
    CODEXSUN_SPORTSCLUB_CORPORATE_ID: "TENKASISPORTS"
  };
}

test("tenkasisports signed delivery is persistent, idempotent and rejects stale replacement", async () => {
  const env = environment();
  try {
    assert.equal((await receivePublication(publishRequest(snapshot(2)), env)).status, 200);
    assert.equal((await receivePublication(publishRequest(snapshot(2)), env)).status, 200);
    const stale = await receivePublication(publishRequest(snapshot(1)), env);
    assert.equal((await stale.json()).status, "superseded");
    const row = await readPublication(env);
    assert.equal(row.version, 2);
    assert.equal(publicationEnvelope(row).data.content.profile.name, "Tenkasi District Sports Club");
    assert.equal(
      env.CODEXSUN_TENKASISPORTS_CONTENT.db
        .prepare("SELECT COUNT(*) AS count FROM sites_publication_history")
        .get()!.count,
      2
    );
  } finally {
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports publication authentication and checksum fail closed", async () => {
  const env = environment();
  try {
    assert.equal(
      (await receivePublication(publishRequest(snapshot(), String(Date.now()), "forged"), env)).status,
      401
    );
    assert.equal(
      (await receivePublication(publishRequest(snapshot(), String(Date.now() - 360000)), env)).status,
      401
    );
    assert.equal(
      (await receivePublication(publishRequest({ ...snapshot(), siteKey: "b".repeat(64) }), env)).status,
      403
    );
    assert.equal(
      (await receivePublication(publishRequest({ ...snapshot(), checksum: "0".repeat(64) }), env)).status,
      409
    );
    assert.equal(
      (await receivePublication(publishRequest(snapshot()), { ...env, CODEXSUN_SITES_TENKASISPORTS_SITE_KEY: undefined as never })).status,
      503
    );
    assert.equal(
      (await receivePublication(publishRequest(snapshot()), { ...env, CODEXSUN_SITES_PUBLISH_SECRET: undefined as never })).status,
      503
    );
    assert.equal(await readPublication(env), undefined);
  } finally {
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports worker routes enforce same-origin on POST and reject unlisted endpoints", async () => {
  const env = environment();
  try {
    // Unlisted endpoint -> 404
    const unlisted = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/unlisted", { method: "GET" }),
      env
    );
    assert.equal(unlisted.status, 404);

    // Cross-origin POST -> 403
    const crossOrigin = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/registration", {
        method: "POST",
        headers: {
          Origin: "https://malicious-site.example",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Student" })
      }),
      env
    );
    assert.equal(crossOrigin.status, 403);
  } finally {
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports worker fails closed if tenant registration context does not match TENKASISPORTS", async () => {
  const env = environment();
  env.CODEXSUN_SPORTSCLUB_CORPORATE_ID = "WRONG_TENANT";
  try {
    const res = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/registration", {
        method: "GET"
      }),
      env
    );
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error?.code, "TENANT_SETUP_PENDING");
  } finally {
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports worker redirects www to canonical apex domain", async () => {
  const env = environment();
  try {
    const res = await worker.fetch(
      new Request("https://www.tenkasisports.com/about?lang=ta"),
      env
    );
    assert.equal(res.status, 308);
    assert.equal(res.headers.get("Location"), "https://tenkasisports.com/about?lang=ta");
  } finally {
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports worker routes forward to canonical platform endpoints with HMAC client headers", async () => {
  const env = environment();
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method: string; headers: Headers; body: string | null }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const body = init?.body ? String(init.body) : null;
    calls.push({ url, method, headers, body });

    if (url.endsWith("/health")) {
      return new Response(JSON.stringify({ status: "healthy", corporateId: "TENKASISPORTS", actor: "public:student" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.includes("/public/sportsclub/registration")) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            corporateId: "TENKASISPORTS",
            userUuid: "u1234567",
            memberUuid: "m1234567"
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (url.includes("/public/sportsclub/enquiry")) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { reference: "TS-REF-01", status: "received" }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response("Not found", { status: 404 });
  };

  try {
    // 1. GET /api/sportsclub/registration returns health verification data
    const getReg = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/registration", { method: "GET" }),
      env
    );
    assert.equal(getReg.status, 200);
    const regData = await getReg.json();
    assert.equal(regData.success, true);
    assert.equal(regData.data.corporateId, "TENKASISPORTS");

    // 2. POST /api/sportsclub/registration forwards directly to canonical /public/sportsclub/registration
    const postReg = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/registration", {
        method: "POST",
        headers: {
          Origin: "https://tenkasisports.com",
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.195"
        },
        body: JSON.stringify({
          name: "V. Selvam",
          email: "selvam@tenkasisports.com",
          phone: "+91 98765 11111",
          password: "SecurePassword123!"
        })
      }),
      env
    );
    assert.equal(postReg.status, 200);
    const regRes = await postReg.json();
    assert.equal(regRes.success, true);
    assert.equal(regRes.data.corporateId, "TENKASISPORTS");
    assert.equal(regRes.data.userUuid, "u1234567");
    assert.equal(regRes.data.memberUuid, "m1234567");

    // Verify canonical target was called (NOT legacy /student/register or /sportsclub/public/enroll)
    const forwardCall = calls.find(
      (c) => c.url.includes("/public/sportsclub/registration") && c.method === "POST"
    );
    assert.ok(forwardCall);
    assert.equal(calls.some((c) => c.url.includes("/student/register")), false);

    // Verify HMAC client verification headers on the forward call
    const clientHeader = forwardCall.headers.get("x-codexsun-public-client");
    const timeHeader = forwardCall.headers.get("x-codexsun-client-time");
    const sigHeader = forwardCall.headers.get("x-codexsun-client-signature");
    assert.ok(clientHeader);
    assert.ok(timeHeader);
    assert.ok(sigHeader);

    // Verify cryptographic signature matches verifiedSportsclubPortalClient
    const verified = verifiedSportsclubPortalClient(
      {
        "x-codexsun-public-client": clientHeader,
        "x-codexsun-client-time": timeHeader,
        "x-codexsun-client-signature": sigHeader
      },
      secret
    );
    assert.equal(verified, `cloudflare:${clientHeader}`);

    // 3. POST /api/sportsclub/enquiry forwards to canonical /public/sportsclub/enquiry
    const postEnquiry = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/enquiry", {
        method: "POST",
        headers: {
          Origin: "https://tenkasisports.com",
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.195"
        },
        body: JSON.stringify({
          name: "Enquiry Visitor",
          email: "visitor@tenkasisports.test",
          phone: "+91 98765 22222",
          message: "Looking for Silambam batch times",
          consent: true
        })
      }),
      env
    );
    assert.equal(postEnquiry.status, 200);
    const enquiryRes = await postEnquiry.json();
    assert.equal(enquiryRes.data.status, "received");
  } finally {
    globalThis.fetch = originalFetch;
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports worker fails closed on 404 without falling back to /student/register", async () => {
  const env = environment();
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method: string }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    calls.push({ url, method });

    if (url.endsWith("/health")) {
      return new Response(JSON.stringify({ status: "healthy", corporateId: "TENKASISPORTS", actor: "public:student" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.includes("/public/sportsclub/registration")) {
      return new Response("Not found", { status: 404 });
    }

    return new Response("Not found", { status: 404 });
  };

  try {
    const postReg = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/registration", {
        method: "POST",
        headers: {
          Origin: "https://tenkasisports.com",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Student", email: "student@test.com" })
      }),
      env
    );
    // Must return 404 directly, and MUST NOT have called /student/register
    assert.equal(postReg.status, 404);
    assert.equal(calls.some((c) => c.url.includes("/student/register")), false);
  } finally {
    globalThis.fetch = originalFetch;
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});

test("tenkasisports worker propagates backend validation errors and duplicate conflicts without masking as success", async () => {
  const env = environment();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    if (url.endsWith("/health")) {
      return new Response(JSON.stringify({ status: "healthy", corporateId: "TENKASISPORTS", actor: "public:student" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.includes("/public/sportsclub/registration")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "You already have a club membership." }
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.includes("/public/sportsclub/enquiry")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "You must accept the privacy policy to submit." }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not found", { status: 404 });
  };

  try {
    // 1. Registration conflict returns 409 with exact backend error message
    const regRes = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/registration", {
        method: "POST",
        headers: {
          Origin: "https://tenkasisports.com",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Duplicate Member",
          email: "existing@tenkasisports.com",
          phone: "+91 98765 00000",
          password: "SecurePassword123!"
        })
      }),
      env
    );
    assert.equal(regRes.status, 409);
    const regJson = await regRes.json();
    assert.equal(regJson.success, false);
    assert.equal(regJson.error.message, "You already have a club membership.");

    // 2. Enquiry error returns 400 with exact backend error message
    const enqRes = await worker.fetch(
      new Request("https://tenkasisports.com/api/sportsclub/enquiry", {
        method: "POST",
        headers: {
          Origin: "https://tenkasisports.com",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Visitor",
          email: "visitor@test.com",
          message: "Hi",
          consent: false
        })
      }),
      env
    );
    assert.equal(enqRes.status, 400);
    const enqJson = await enqRes.json();
    assert.equal(enqJson.success, false);
    assert.equal(enqJson.error.message, "You must accept the privacy policy to submit.");
  } finally {
    globalThis.fetch = originalFetch;
    env.CODEXSUN_TENKASISPORTS_CONTENT.db.close();
  }
});
