import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { Kysely, Selectable, Transaction } from "kysely";
import type { DevicesDatabase, DeviceRow, DeviceRecord, DeviceInput } from "./devices.types.js";
export class DevicesRepository {
  constructor(private readonly database: Kysely<DevicesDatabase>) {}
  async list(actor: string) {
    return (
      await this.database
        .selectFrom("codexsun_devices")
        .selectAll()
        .where("created_by", "=", actor)
        .orderBy("last_seen_at", "desc")
        .limit(100)
        .execute()
    ).map(map);
  }
  async get(uuid: string, actor: string) {
    const row = await this.database
      .selectFrom("codexsun_devices")
      .selectAll()
      .where("uuid", "=", uuid)
      .where("created_by", "=", actor)
      .executeTakeFirst();
    return row ? map(row) : undefined;
  }
  async register(input: DeviceInput, actor: string, retry = true): Promise<DeviceRecord> {
    try {
      return await this.database.transaction().execute(async (transaction) => {
        const existing = await transaction
          .selectFrom("codexsun_devices")
          .selectAll()
          .where("created_by", "=", actor)
          .where("device_key", "=", input.deviceKey)
          .executeTakeFirst();
        const now = timestamp(),
          uuid = existing?.uuid ?? randomBytes(4).toString("hex");
        if (existing?.status === "inactive")
          throw AppError.conflict("Reactivate the device explicitly before registering it.");
        if (existing && existing.kind !== input.kind)
          throw AppError.conflict("A device key cannot change its device kind.");
        if (existing) {
          const updated = await transaction
            .updateTable("codexsun_devices")
            .set({
              label: input.label,
              kind: input.kind,
              last_seen_at: now,
              status: "active",
              updated_at: now
            })
            .where("uuid", "=", uuid)
            .where("created_by", "=", actor)
            .where("status", "=", "active")
            .executeTakeFirst();
          if (Number(updated.numUpdatedRows) !== 1)
            throw AppError.conflict("Device changed. Refresh before continuing.");
        } else
          await transaction
            .insertInto("codexsun_devices")
            .values({
              uuid,
              device_key: input.deviceKey,
              label: input.label,
              kind: input.kind,
              last_seen_at: now,
              status: "active",
              created_by: actor,
              created_at: now,
              updated_at: now
            })
            .execute();
        await audit(transaction, uuid, existing ? "registered" : "created", actor, now);
        return map(
          await transaction
            .selectFrom("codexsun_devices")
            .selectAll()
            .where("uuid", "=", uuid)
            .where("created_by", "=", actor)
            .executeTakeFirstOrThrow()
        );
      });
    } catch (error) {
      if (!retry || !isDuplicate(error)) throw error;
      return this.register(input, actor, false);
    }
  }
  async heartbeat(uuid: string, actor: string) {
    await this.database
      .updateTable("codexsun_devices")
      .set({ last_seen_at: timestamp(), updated_at: timestamp() })
      .where("uuid", "=", uuid)
      .where("created_by", "=", actor)
      .where("status", "=", "active")
      .execute();
  }
  async setStatus(uuid: string, actor: string, status: DeviceRecord["status"]) {
    await this.database.transaction().execute(async (transaction) => {
      const now = timestamp();
      const result = await transaction
        .updateTable("codexsun_devices")
        .set({ status, updated_at: now })
        .where("uuid", "=", uuid)
        .where("created_by", "=", actor)
        .executeTakeFirst();
      if (Number(result.numUpdatedRows) > 0) await audit(transaction, uuid, status, actor, now);
    });
  }
}
async function audit(
  database: Transaction<DevicesDatabase>,
  uuid: string,
  action: string,
  actor: string,
  now: string
) {
  await database
    .insertInto("codexsun_device_activity")
    .values({
      uuid: randomBytes(4).toString("hex"),
      device_uuid: uuid,
      action,
      actor_email: actor,
      created_by: actor,
      status: "active",
      created_at: now,
      updated_at: now
    })
    .execute();
}
function timestamp() {
  return new Date().toISOString().slice(0, 23).replace("T", " ");
}
function map(row: Selectable<DeviceRow>): DeviceRecord {
  return {
    uuid: row.uuid,
    deviceKey: row.device_key,
    label: row.label,
    kind: row.kind,
    lastSeenAt: iso(row.last_seen_at),
    status: row.status,
    createdBy: row.created_by
  };
}
function iso(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z").toISOString();
}
function isDuplicate(error: unknown) {
  return (
    error instanceof Error &&
    (("code" in error &&
      ["ER_DUP_ENTRY", "SQLITE_CONSTRAINT_UNIQUE"].includes(String(error.code))) ||
      ("errcode" in error && error.errcode === 2067))
  );
}
