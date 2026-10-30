import { createHmac } from "node:crypto";
import { verifyPublication } from "../publication/publication.integrity.js";
import { DeploymentRepository } from "./deployment.repository.js";
import type { Kysely } from "kysely";
import type { DeploymentDatabase } from "./deployment.types.js";
export async function deliverSitePublication(
  db: Kysely<DeploymentDatabase>,
  input: { deploymentUuid: string; siteId: number; siteUuid: string; tenantId: string }
) {
  if (
    input.tenantId !== process.env.CODEXSUN_SITES_TIRUPURCONNECT_TENANT_ID ||
    input.siteUuid !== process.env.CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID
  )
    throw new Error("Deployment tenant identity mismatch.");
  const repository = new DeploymentRepository(db);
  const row = await repository.find(input.deploymentUuid, input.siteId);
  if (!row) throw new Error("Deployment not found.");
  if (["live", "superseded"].includes(row.status))
    return { version: row.sequence, status: row.status };
  if (!(await repository.claim(row))) throw new Error("Deployment is already being processed.");
  try {
    const snapshot = verifyPublication(JSON.parse(row.snapshot_json));
    const body = JSON.stringify(snapshot);
    const timestamp = String(Date.now());
    const secret = process.env.CODEXSUN_SITES_PUBLISH_SECRET;
    if (!secret) throw new Error("Publishing connection is not configured.");
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const response = await fetch("https://tirupurconnect.com/__sites-publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-codexsun-timestamp": timestamp,
        "x-codexsun-signature": signature
      },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`Live delivery was rejected (${response.status}).`);
    const receipt = (await response.json()) as {
      version: number;
      checksum: string;
      siteUuid: string;
      status: string;
    };
    if (
      receipt.siteUuid !== input.siteUuid ||
      receipt.version < snapshot.sequence ||
      (receipt.version === snapshot.sequence && receipt.checksum !== snapshot.checksum)
    )
      throw new Error("The live version did not match the published content.");
    const status = receipt.version === snapshot.sequence ? "live" : "superseded";
    await repository.mark(row.uuid, status);
    return { version: receipt.version, status };
  } catch (error) {
    await repository.mark(
      row.uuid,
      "failed",
      error instanceof Error ? error.message.slice(0, 600) : "Delivery failed."
    );
    throw error;
  }
}
export function startSitesDeliveryRelay(run: () => Promise<void>) {
  let busy = false;
  const timer = setInterval(() => {
    if (busy) return;
    busy = true;
    void run()
      .catch(() => {})
      .finally(() => {
        busy = false;
      });
  }, 3000);
  timer.unref();
  return () => clearInterval(timer);
}

export async function expireSiteDelivery(
  db: Kysely<DeploymentDatabase>,
  deploymentUuid: string,
  siteId: number
) {
  await new DeploymentRepository(db).expire(deploymentUuid, siteId);
}
