import type { DeploymentState } from "@codexsun/sites-api/deployment-contract";
export type { DeploymentState };
export type DeploymentGateway = {
  get(uuid: string): Promise<DeploymentState>;
  retry(uuid: string, deploymentUuid: string): Promise<DeploymentState>;
};
