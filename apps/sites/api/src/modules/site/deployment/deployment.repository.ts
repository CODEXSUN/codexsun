import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type {
  DeploymentDatabase,
  DeploymentRow,
  DeploymentSnapshot,
  DeploymentStatus
} from "./deployment.types.js";
export class DeploymentRepository {
  constructor(private readonly db: Kysely<DeploymentDatabase>) {}
  list(siteId: number) {
    return this.db
      .selectFrom("sites_deployments")
      .selectAll()
      .where("site_id", "=", siteId)
      .orderBy("id", "desc")
      .limit(20)
      .execute();
  }
  lastLive(siteId: number) {
    return this.db
      .selectFrom("sites_deployments")
      .selectAll()
      .where("site_id", "=", siteId)
      .where("status", "=", "live")
      .orderBy("id", "desc")
      .executeTakeFirst();
  }
  find(uuid: string, siteId: number) {
    return this.db
      .selectFrom("sites_deployments")
      .selectAll()
      .where("uuid", "=", uuid)
      .where("site_id", "=", siteId)
      .executeTakeFirst();
  }
  revision(siteId: number, revision: number) {
    return this.db
      .selectFrom("sites_deployments")
      .selectAll()
      .where("site_id", "=", siteId)
      .where("page_revision", "=", revision)
      .executeTakeFirst();
  }
  async create(siteId: number, revision: number, snapshot: DeploymentSnapshot, actor: string) {
    const now = new Date().toISOString();
    const uuid = randomBytes(4).toString("hex");
    await this.db
      .insertInto("sites_deployments")
      .values({
        uuid,
        site_id: siteId,
        page_revision: revision,
        sequence: snapshot.sequence,
        checksum: snapshot.checksum,
        snapshot_json: JSON.stringify(snapshot),
        actor,
        status: "queued",
        attempts: 0,
        error_message: "",
        created_at: now,
        updated_at: now,
        deployed_at: null
      })
      .onDuplicateKeyUpdate({ page_revision: revision })
      .execute();
    return (await this.revision(siteId, revision))!;
  }
  async claim(row: DeploymentRow) {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable("sites_deployments")
      .set({ status: "running", attempts: sql`attempts+1`, updated_at: now, error_message: "" })
      .where("uuid", "=", row.uuid)
      .where((eb) =>
        eb.or([
          eb("status", "in", ["queued", "failed"]),
          eb.and([
            eb("status", "=", "running"),
            eb("updated_at", "<", new Date(Date.now() - 120000).toISOString())
          ])
        ])
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }
  async expire(uuid: string, siteId: number) {
    await this.db
      .updateTable("sites_deployments")
      .set({
        status: "failed",
        error_message: "Delivery worker stopped before completion. Retry delivery.",
        updated_at: new Date().toISOString()
      })
      .where("uuid", "=", uuid)
      .where("site_id", "=", siteId)
      .where("status", "=", "running")
      .where("updated_at", "<", new Date(Date.now() - 120000).toISOString())
      .execute();
  }
  async mark(uuid: string, status: DeploymentStatus, error = "") {
    await this.db
      .updateTable("sites_deployments")
      .set({
        status,
        error_message: error,
        updated_at: new Date().toISOString(),
        ...(status === "live" ? { deployed_at: new Date().toISOString() } : {})
      })
      .where("uuid", "=", uuid)
      .execute();
  }
}
