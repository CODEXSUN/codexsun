import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { registerCodexsunApi } from "../../index.js";
import type { CodexsunDatabase } from "../../context.js";
import { RequirementsRepository } from "./requirements.repository.js";
import { RequirementsService } from "./requirements.service.js";
import type { RequirementInput } from "./requirements.types.js";

function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE codexsun_requirements (id INTEGER PRIMARY KEY AUTOINCREMENT,uuid TEXT UNIQUE,client_key TEXT,request_hash TEXT,title TEXT,description TEXT,priority TEXT,origin TEXT,status TEXT,revision INTEGER,decision_note TEXT,created_by TEXT,created_at TEXT,updated_at TEXT,UNIQUE(created_by,client_key));
 CREATE TABLE codexsun_requirement_activity (id INTEGER PRIMARY KEY AUTOINCREMENT,uuid TEXT UNIQUE,requirement_uuid TEXT REFERENCES codexsun_requirements(uuid),action TEXT,revision INTEGER,note TEXT,actor_email TEXT,status TEXT DEFAULT 'active',created_by TEXT DEFAULT 'system:migration',updated_at TEXT DEFAULT CURRENT_TIMESTAMP,created_at TEXT);`);
  return new Kysely<CodexsunDatabase>({
    dialect: new SqliteDialect({
      database: {
        close: () => sqlite.close(),
        prepare: (sql) => {
          const statement = sqlite.prepare(sql);
          return {
            reader: statement.columns().length > 0,
            all: (parameters) => statement.all(...(parameters as SQLInputValue[])),
            run: (parameters) => statement.run(...(parameters as SQLInputValue[])),
            iterate: (parameters) => statement.iterate(...(parameters as SQLInputValue[]))
          };
        }
      }
    })
  });
}
const input: RequirementInput = {
  clientKey: "request_001",
  title: "Client portal",
  description: "Collect approved ideas.",
  priority: "normal",
  origin: "web"
};
const service = (db: Kysely<CodexsunDatabase>, actor = "owner@example.test", approve = false) =>
  new RequirementsService(new RequirementsRepository(db), actor, approve);

test("request retries are idempotent after edits and conflicting payloads are rejected", async () => {
  const db = database();
  try {
    const owner = service(db),
      first = await owner.create(input);
    assert.equal((await owner.create(input)).uuid, first.uuid);
    const updated = await owner.update(first.uuid, {
      revision: 1,
      title: "Updated portal",
      description: input.description,
      priority: "high"
    });
    assert.equal(updated.revision, 2);
    assert.equal((await owner.create(input)).title, "Updated portal");
    await assert.rejects(owner.create({ ...input, title: "Different request" }), {
      statusCode: 409
    });
    assert.equal((await owner.activity(first.uuid)).length, 2);
  } finally {
    await db.destroy();
  }
});
test("revision and lifecycle checks protect decisions with transactional history", async () => {
  const db = database();
  try {
    const owner = service(db),
      approver = service(db, "approver@example.test", true);
    const first = await owner.create(input);
    await assert.rejects(
      owner.update(first.uuid, {
        revision: 2,
        title: input.title,
        description: input.description,
        priority: "normal"
      }),
      { statusCode: 409 }
    );
    const pending = await owner.submit(first.uuid, 1);
    await assert.rejects(owner.decision(first.uuid, 2, "approved", ""), { statusCode: 403 });
    await assert.rejects(approver.decision(first.uuid, 1, "approved", ""), { statusCode: 409 });
    const rejected = await approver.decision(
      first.uuid,
      pending.revision,
      "rejected",
      "Clarify scope"
    );
    const revised = await owner.update(first.uuid, {
      revision: rejected.revision,
      title: input.title,
      description: "Clarified scope",
      priority: "normal"
    });
    assert.equal(revised.status, "draft");
    assert.equal(revised.decisionNote, "");
    const submitted = await owner.submit(first.uuid, revised.revision);
    const approved = await approver.decision(first.uuid, submitted.revision, "approved", "Proceed");
    await assert.rejects(
      owner.update(first.uuid, {
        revision: approved.revision,
        title: input.title,
        description: input.description,
        priority: "normal"
      }),
      { statusCode: 409 }
    );
    assert.deepEqual(
      (await owner.activity(first.uuid)).map((item) => item.action),
      ["created", "submitted", "rejected", "updated", "submitted", "approved"]
    );
  } finally {
    await db.destroy();
  }
});
test("users and isolated tenant databases cannot read another user's requirements", async () => {
  const db = database(),
    otherTenant = database();
  try {
    const first = await service(db).create(input),
      outsider = service(db, "other@example.test");
    await assert.rejects(outsider.get(first.uuid), { statusCode: 404 });
    await assert.rejects(outsider.activity(first.uuid), { statusCode: 404 });
    assert.equal((await outsider.list({ page: 1, pageSize: 20 })).total, 0);
    await assert.rejects(service(otherTenant).get(first.uuid), { statusCode: 404 });
    const admin = service(db, "admin@example.test", true);
    assert.equal((await admin.list({ page: 1, pageSize: 20 })).total, 1);
    await assert.rejects(admin.submit(first.uuid, 1), { statusCode: 403 });
  } finally {
    await db.destroy();
    await otherTenant.destroy();
  }
});
test("HTTP contracts enforce backend permissions, strict input, and trusted context", async () => {
  const db = database(),
    app = Fastify();
  let allowed = new Set([
    "codexsun.requirements.create",
    "codexsun.requirements.view",
    "codexsun.requirements.update",
    "codexsun.overview.view"
  ]);
  app.setErrorHandler((error, _request, reply) =>
    reply
      .code(error instanceof AppError ? error.statusCode : 500)
      .send({ message: error instanceof Error ? error.message : "Unexpected error" })
  );
  registerCodexsunApi(app, async () => ({
    database: db,
    actorEmail: "owner@example.test",
    tenantUuid: "aabbccdd",
    tenantName: "Trusted tenant",
    authorize: async (key) => {
      if (!allowed.has(key)) throw AppError.forbidden();
    },
    can: async (key) => allowed.has(key)
  }));
  try {
    const created = await app.inject({
      method: "POST",
      url: "/codexsun/requirements",
      payload: input
    });
    assert.equal(created.statusCode, 200);
    const uuid = created.json().data.uuid;
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/codexsun/requirements/${uuid}/submit`,
          payload: { revision: 1 }
        })
      ).statusCode,
      200
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/codexsun/requirements/${uuid}/decision`,
          payload: { revision: 2, decision: "approved", note: "" }
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/codexsun/requirements",
          payload: { ...input, tenantUuid: "attacker" }
        })
      ).statusCode,
      400
    );
    const context = await app.inject({ method: "GET", url: "/codexsun/context" });
    assert.equal(context.json().data.tenantUuid, "aabbccdd");
    allowed = new Set();
    assert.equal(
      (await app.inject({ method: "GET", url: "/codexsun/requirements" })).statusCode,
      403
    );
  } finally {
    await app.close();
    await db.destroy();
  }
});
