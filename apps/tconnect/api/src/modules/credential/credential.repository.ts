import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { CredentialInput, CredentialRecord } from "./credential.types.js";
export class CredentialRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(publicOnly = false) {
    return (
      await sql<CredentialRecord>`SELECT v.uuid,v.company_uuid AS companyUuid,c.name AS companyName,v.kind,v.standard_name AS standardName,v.issuer,v.reference,v.scope,v.public_evidence_url AS publicEvidenceUrl,DATE_FORMAT(v.expires_on,'%Y-%m-%d') AS expiresOn,v.private_notes AS privateNotes,v.status,DATE_FORMAT(v.reviewed_at,'%Y-%m-%d') AS reviewedAt,v.reviewed_by AS reviewedBy FROM tconnect_credentials v INNER JOIN tconnect_companies c ON c.uuid=v.company_uuid WHERE (${publicOnly ? 1 : 0}=0 OR (v.status='approved' AND v.expires_on>=UTC_DATE() AND v.reviewed_at IS NOT NULL AND c.status='active')) ORDER BY v.id DESC LIMIT 1000`.execute(
        this.database
      )
    ).rows;
  }
  async lock(uuid: string) {
    return (
      (
        await sql`SELECT uuid FROM tconnect_credentials WHERE uuid=${uuid} FOR UPDATE`.execute(
          this.database
        )
      ).rows.length > 0
    );
  }
  async save(input: CredentialInput, actor: string, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    const reviewed = input.status === "approved" ? new Date() : null;
    if (uuid)
      await sql`UPDATE tconnect_credentials SET company_uuid=${input.companyUuid},kind=${input.kind},standard_name=${input.standardName},issuer=${input.issuer},reference=${input.reference},scope=${input.scope},public_evidence_url=${input.publicEvidenceUrl},expires_on=${input.expiresOn},private_notes=${input.privateNotes},status=${input.status},reviewed_at=${reviewed},reviewed_by=${actor} WHERE uuid=${uuid}`.execute(
        this.database
      );
    else
      await sql`INSERT INTO tconnect_credentials(uuid,company_uuid,kind,standard_name,issuer,reference,scope,public_evidence_url,expires_on,private_notes,status,reviewed_at,reviewed_by) VALUES (${key},${input.companyUuid},${input.kind},${input.standardName},${input.issuer},${input.reference},${input.scope},${input.publicEvidenceUrl},${input.expiresOn},${input.privateNotes},${input.status},${reviewed},${actor})`.execute(
        this.database
      );
    return (await this.list()).find((row) => row.uuid === key)!;
  }
}
