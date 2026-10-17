import { AppError } from "@codexsun/framework/errors";
import type { DeploymentRepository } from "./deployment.repository.js";
import type {
  DeploymentHost,
  DeploymentRow,
  DeploymentScope,
  DeploymentSnapshot
} from "./deployment.types.js";
export class DeploymentService {
  constructor(
    private readonly repository: DeploymentRepository,
    private readonly scope: DeploymentScope,
    private readonly host?: DeploymentHost
  ) {}
  enabled() {
    return (
      this.scope.siteSlug === "tirupurconnect" &&
      this.scope.domain === "tirupurconnect.com" &&
      this.scope.siteUuid === process.env.CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID &&
      this.scope.tenantId === process.env.CODEXSUN_SITES_TIRUPURCONNECT_TENANT_ID &&
      Boolean(process.env.CODEXSUN_SITES_PUBLISH_SECRET) &&
      Boolean(this.host)
    );
  }
  async state() {
    if(!this.enabled())return {enabled:false,target:"https://tirupurconnect.com",latest:null,lastLive:null,history:[]};
    const rows = await this.repository.list(this.scope.siteId);
    const lastLive = await this.repository.lastLive(this.scope.siteId);
    return {
      enabled: this.enabled(),
      target: "https://tirupurconnect.com",
      latest: rows[0] ? this.publicRecord(rows[0]) : null,
      lastLive: lastLive ? this.publicRecord(lastLive) : null,
      history: rows.map((row) => this.publicRecord(row))
    };
  }
  async schedule(
    revision: number,
    createSnapshot: () => Promise<DeploymentSnapshot>,
    correlationId: string
  ) {
    if (!this.enabled()) return;
    let row = await this.repository.revision(this.scope.siteId, revision);
    if (!row)
      row = await this.repository.create(
        this.scope.siteId,
        revision,
        await createSnapshot(),
        this.scope.actor
      );
    if (["live", "superseded", "running"].includes(row.status)) return;
    await this.enqueue(row, correlationId);
  }
  async retry(uuid: string, correlationId: string) {
    if (!this.enabled())
      throw AppError.conflict("Direct publishing is not configured for this client.");
    const row = await this.repository.find(uuid, this.scope.siteId);
    if (!row) throw AppError.notFound("Deployment not found.");
    if (row.status !== "failed") throw AppError.conflict("Only failed deployments can be retried.");
    await this.repository.mark(row.uuid, "queued");
    await this.enqueue({ ...row, status: "queued" }, correlationId);
    return this.state();
  }
  private async enqueue(row: DeploymentRow, correlationId: string) {
    try {
      await this.host!.enqueue({
        tenantId: this.scope.tenantId,
        deploymentUuid: row.uuid,
        siteUuid: this.scope.siteUuid,
        actor: this.scope.actor,
        correlationId,
        attempt: row.attempts
      });
    } catch {
      await this.repository.mark(
        row.uuid,
        "failed",
        "Could not queue delivery. Retry this deployment."
      );
    }
  }
  private publicRecord(row: DeploymentRow) {
    return {
      uuid: row.uuid,
      revision: row.page_revision,
      version: row.sequence,
      checksum: row.checksum,
      status: row.status,
      actor: row.actor,
      attempts: row.attempts,
      error: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deployedAt: row.deployed_at
    };
  }
}
