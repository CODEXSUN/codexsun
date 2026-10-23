import { lookupBrand } from "../brand/index.js";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { ConnectionService } from "./connection.service.js";
import { sealConnection, openConnection } from "./connection.secrets.js";
import type { GoogleChannelConnector, VerifiedGoogleGrant } from "./connection.google.js";

export type ConnectionAuthorization = {
  secret: string;
  sessionIdentity: string;
  google: Pick<GoogleChannelConnector, "authorizationUrl" | "exchange"> | null;
  claim(provider: string, accountId: string, connectionUuid: string): Promise<void>;
  release(provider: string, accountId: string, connectionUuid: string): Promise<void>;
};

export class ConnectionAuthorizationService {
  constructor(
    private readonly context: MarketingContext,
    private readonly authorization: ConnectionAuthorization
  ) {}
  private identity(uuid: string) {
    return this.context.tenantId + ":" + this.context.companyId + ":" + uuid;
  }
  private async record(uuid: string, requireActive = false, write = true) {
    if (write) await this.context.authorize("marketing.connection.record.update");
    const record = await new ConnectionService(this.context).get(uuid);
    if (requireActive && record.status !== "active")
      throw AppError.conflict("Restore this connection before authorizing it.");
    if (requireActive && (await lookupBrand(this.context, record.brandUuid)).status !== "active")
      throw AppError.conflict("The connection brand is inactive.");
    return record;
  }
  async begin(uuid: string) {
    const record = await this.record(uuid, true);
    if (record.provider !== "google" || !this.authorization.google)
      throw AppError.validation(
        "This provider is not configured for API authorization. Keep its setup record until its connector is enabled."
      );
    await sql`DELETE FROM marketing_connection_oauth WHERE expires_at<UTC_TIMESTAMP() LIMIT 100`.execute(
      this.context.database
    );
    const state = uuid + "." + randomBytes(32).toString("base64url"),
      verifier = randomBytes(32).toString("base64url");
    const stateHash = createHash("sha256").update(state).digest("hex");
    const encrypted = sealConnection(verifier, this.authorization.secret, this.identity(uuid));
    await sql`INSERT INTO marketing_connection_oauth(uuid,connection_uuid,company_id,actor,session_identity,state_hash,verifier_secret,expires_at)
      VALUES(${randomBytes(4).toString("hex")},${uuid},${this.context.companyId},${this.context.actorEmail},${this.authorization.sessionIdentity},${stateHash},${encrypted},DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE))`.execute(
      this.context.database
    );
    return {
      url: this.authorization.google.authorizationUrl(
        state,
        createHash("sha256").update(verifier).digest("base64url")
      )
    };
  }
  async complete(uuid: string, state: string, code: string) {
    const record = await this.record(uuid, true);
    if (record.provider !== "google" || !this.authorization.google)
      throw AppError.validation("Google authorization is unavailable.");
    const hash = createHash("sha256").update(state).digest("hex");
    const pending = await this.context.database.transaction().execute(async (database) => {
      const row = (
        await sql<{
          id: number;
          verifier_secret: string;
        }>`SELECT id,verifier_secret FROM marketing_connection_oauth WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId} AND actor=${this.context.actorEmail} AND session_identity=${this.authorization.sessionIdentity} AND state_hash=${hash} AND expires_at>UTC_TIMESTAMP() AND used_at IS NULL FOR UPDATE`.execute(
          database
        )
      ).rows[0];
      if (!row)
        throw AppError.forbidden(
          "Authorization state is expired, reused, or belongs to another session."
        );
      await sql`UPDATE marketing_connection_oauth SET used_at=UTC_TIMESTAMP() WHERE id=${row.id}`.execute(
        database
      );
      return row;
    });
    const grant = await this.authorization.google.exchange(
      code,
      openConnection(pending.verifier_secret, this.authorization.secret, this.identity(uuid))
    );
    await sql`UPDATE marketing_connection_oauth SET grant_secret=${sealConnection(JSON.stringify(grant), this.authorization.secret, this.identity(uuid))} WHERE id=${pending.id}`.execute(
      this.context.database
    );
    return { accounts: grant.accounts };
  }
  async select(uuid: string, state: string, accountId: string) {
    const connection = await this.record(uuid, true);
    const hash = createHash("sha256").update(state).digest("hex");
    const row = (
      await sql<{
        id: number;
        grant_secret: string;
      }>`SELECT id,grant_secret FROM marketing_connection_oauth WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId} AND actor=${this.context.actorEmail} AND session_identity=${this.authorization.sessionIdentity} AND state_hash=${hash} AND expires_at>UTC_TIMESTAMP() AND used_at IS NOT NULL AND grant_secret IS NOT NULL`.execute(
        this.context.database
      )
    ).rows[0];
    if (!row) throw AppError.forbidden("The verified account selection has expired.");
    const grant: VerifiedGoogleGrant = JSON.parse(
      openConnection(row.grant_secret, this.authorization.secret, this.identity(uuid))
    );
    if (!grant.accounts.some((account) => account.id === accountId))
      throw AppError.forbidden("Select a verified account returned by the provider.");
    const consumed =
      await sql`UPDATE marketing_connection_oauth SET selection_at=UTC_TIMESTAMP() WHERE id=${row.id} AND selection_at IS NULL`.execute(
        this.context.database
      );
    if (consumed.numAffectedRows !== 1n)
      throw AppError.forbidden("This account selection was already used.");
    if (connection.externalAccountId && connection.externalAccountId !== accountId)
      throw AppError.conflict(
        "Disconnect the current provider account before selecting another account."
      );
    await this.authorization.claim("google", accountId, uuid);
    await this.context.database.transaction().execute(async (database) => {
      const current = (
        await sql<{
          status: string;
          provider: string;
          accountId: string;
        }>`SELECT status,provider,external_account_id AS accountId FROM marketing_connections WHERE uuid=${uuid} AND company_id=${this.context.companyId} FOR UPDATE`.execute(
          database
        )
      ).rows[0];
      if (
        !current ||
        current.status !== "active" ||
        current.provider !== "google" ||
        (current.accountId && current.accountId !== accountId)
      )
        throw AppError.conflict("The connection changed during authorization.");
      await sql`UPDATE marketing_connections SET revision=revision+1, external_account_id=${accountId},updated_by=${this.context.actorEmail} WHERE uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
        database
      );
      await sql`INSERT INTO marketing_connection_grants(connection_uuid,company_id,provider,account_id,grant_secret,expires_at,capabilities) VALUES(${uuid},${this.context.companyId},'google',${accountId},${sealConnection(JSON.stringify(grant), this.authorization.secret, this.identity(uuid))},${new Date(grant.expiresAt)},'youtube.channel.read') ON DUPLICATE KEY UPDATE account_id=VALUES(account_id),grant_secret=VALUES(grant_secret),expires_at=VALUES(expires_at),capabilities=VALUES(capabilities)`.execute(
        database
      );
      await sql`DELETE FROM marketing_connection_oauth WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
        database
      );
      await sql`INSERT INTO marketing_connections_activity(uuid,record_uuid,company_id,action,actor) VALUES(${randomBytes(4).toString("hex")},${uuid},${this.context.companyId},'authorized',${this.context.actorEmail})`.execute(
        database
      );
    });
    return { connected: true, capabilities: ["youtube.channel.read"] };
  }
  async health(uuid: string) {
    const record = await this.record(uuid, false, false);
    const brand = await lookupBrand(this.context, record.brandUuid);
    const grant = (
      await sql<{
        accountId: string;
        expiresAt: Date;
        capabilities: string;
      }>`SELECT account_id AS accountId,expires_at AS expiresAt,capabilities FROM marketing_connection_grants WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
        this.context.database
      )
    ).rows[0];
    return {
      connected: Boolean(
        record.status === "active" &&
        brand.status === "active" &&
        grant &&
        new Date(grant.expiresAt).getTime() > Date.now()
      ),
      accountId: grant?.accountId ?? "",
      capabilities: grant?.capabilities.split(",") ?? [],
      expiresAt: grant ? new Date(grant.expiresAt).toISOString() : null
    };
  }
  async disconnect(uuid: string) {
    const record = await this.record(uuid);
    await this.context.database.transaction().execute(async (database) => {
      await sql`DELETE FROM marketing_connection_grants WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
        database
      );
      await sql`DELETE FROM marketing_connection_oauth WHERE connection_uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
        database
      );
      await sql`UPDATE marketing_connections SET revision=revision+1, external_account_id='',updated_by=${this.context.actorEmail} WHERE uuid=${uuid} AND company_id=${this.context.companyId}`.execute(
        database
      );
      await sql`INSERT INTO marketing_connections_activity(uuid,record_uuid,company_id,action,actor) VALUES(${randomBytes(4).toString("hex")},${uuid},${this.context.companyId},'disconnected',${this.context.actorEmail})`.execute(
        database
      );
    });
    if (record.externalAccountId)
      await this.authorization.release(record.provider, record.externalAccountId, uuid);
    return { disconnected: true };
  }
}
