import type { Generated } from "kysely";
import type { DeliverySnapshot } from "../publication/publication.schema.js";
export type DeploymentStatus = "queued" | "running" | "live" | "failed" | "superseded";
export type DeploymentDatabase = {
  sites_deployments: {
    id: Generated<number>;
    uuid: string;
    site_id: number;
    page_revision: number;
    sequence: number;
    checksum: string;
    snapshot_json: string;
    status: DeploymentStatus;
    actor: string;
    attempts: number;
    error_message: string;
    created_at: string;
    updated_at: string;
    deployed_at: string | null;
  };
};
export type DeploymentRow = {
  id: number;
  uuid: string;
  site_id: number;
  page_revision: number;
  sequence: number;
  checksum: string;
  snapshot_json: string;
  status: DeploymentStatus;
  actor: string;
  attempts: number;
  error_message: string;
  created_at: string;
  updated_at: string;
  deployed_at: string | null;
};
export type DeploymentHost = {
  enqueue(input: {
    tenantId: string;
    deploymentUuid: string;
    siteUuid: string;
    actor: string;
    correlationId: string;
    attempt: number;
  }): Promise<void>;
};
export type DeploymentScope = {
  siteId: number;
  siteUuid: string;
  siteSlug: string;
  domain: string;
  tenantId: string;
  actor: string;
};
export type DeploymentSnapshot = DeliverySnapshot;
