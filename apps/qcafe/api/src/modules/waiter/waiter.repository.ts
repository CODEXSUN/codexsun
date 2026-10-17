import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import type { Waiter, WaiterSave } from "./waiter.types.js";
export class WaiterRepository {
  constructor(private readonly db: Kysely<QCafeDatabase>) {}
  async list() {
    return (
      await sql<Waiter>`SELECT uuid,code,name,status FROM qcafe_waiter ORDER BY code`.execute(
        this.db
      )
    ).rows;
  }
  async save(input: WaiterSave, actor: string, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    if (uuid)
      await sql`UPDATE qcafe_waiter SET code=${input.code},name=${input.name},status=${input.status},updated_by=${actor} WHERE uuid=${uuid}`.execute(
        this.db
      );
    else
      await sql`INSERT INTO qcafe_waiter(uuid,code,name,status,updated_by) VALUES(${key},${input.code},${input.name},${input.status},${actor})`.execute(
        this.db
      );
    return (
      await sql<Waiter>`SELECT uuid,code,name,status FROM qcafe_waiter WHERE uuid=${key}`.execute(
        this.db
      )
    ).rows[0];
  }
}
export async function activeQCafeWaiter(db: Kysely<QCafeDatabase>, uuid: string) {
  return (
    (
      await sql<Waiter>`SELECT uuid,code,name,status FROM qcafe_waiter WHERE uuid=${uuid} AND status='active' LOCK IN SHARE MODE`.execute(
        db
      )
    ).rows[0] ?? null
  );
}
