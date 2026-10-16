import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import { DevicesRepository } from "./devices.repository.js";
import { DevicesService } from "./devices.service.js";
import type { DevicesDatabase } from "./devices.types.js";

test("device identity and lifecycle stay actor scoped and audited", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE codexsun_devices (id INTEGER PRIMARY KEY AUTOINCREMENT,uuid TEXT UNIQUE,device_key TEXT,label TEXT,kind TEXT,last_seen_at TEXT,status TEXT,created_by TEXT,created_at TEXT,updated_at TEXT,UNIQUE(created_by,device_key));
 CREATE TABLE codexsun_device_activity (id INTEGER PRIMARY KEY AUTOINCREMENT,uuid TEXT UNIQUE,device_uuid TEXT REFERENCES codexsun_devices(uuid),action TEXT,actor_email TEXT,status TEXT DEFAULT 'active',created_by TEXT DEFAULT 'system:migration',updated_at TEXT DEFAULT CURRENT_TIMESTAMP,created_at TEXT);`);
  const database = new Kysely<DevicesDatabase>({
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
  try {
    const repository = new DevicesRepository(database),
      owner = new DevicesService(repository, "owner@example.test"),
      other = new DevicesService(repository, "other@example.test");
    const input = { deviceKey: "desktop_001", label: "Work desktop", kind: "desktop" as const };
    const first = await owner.register(input);
    assert.equal((await owner.register(input)).uuid, first.uuid);
    assert.equal((await other.list()).length, 0);
    await assert.rejects(other.heartbeat(first.uuid), { statusCode: 404 });
    await assert.rejects(other.setStatus(first.uuid, "inactive"), { statusCode: 404 });
    const otherDevice = await other.register(input);
    assert.notEqual(otherDevice.uuid, first.uuid);
    await owner.setStatus(first.uuid, "inactive");
    await assert.rejects(owner.register(input), { statusCode: 409 });
    await assert.rejects(owner.heartbeat(first.uuid), { statusCode: 409 });
    await owner.setStatus(first.uuid, "active");
    assert.equal((await owner.heartbeat(first.uuid)).status, "active");
    await assert.rejects(owner.register({ ...input, kind: "mobile" }), { statusCode: 409 });
    assert.deepEqual(
      (
        await database
          .selectFrom("codexsun_device_activity")
          .select("action")
          .where("device_uuid", "=", first.uuid)
          .orderBy("id")
          .execute()
      ).map((item) => item.action),
      ["created", "registered", "inactive", "active"]
    );
  } finally {
    await database.destroy();
  }
});
