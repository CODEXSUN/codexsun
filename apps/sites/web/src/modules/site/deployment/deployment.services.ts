import { deploymentStateSchema } from "@codexsun/sites-api/deployment-contract";
import type { DeploymentGateway } from "./deployment.types.js";
export function createDeploymentGateway(client: {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
}): DeploymentGateway {
  return {
    get: async (uuid) => deploymentStateSchema.parse(await client.get(`/sites/${uuid}/deployment`)),
    retry: async (uuid, deploymentUuid) =>
      deploymentStateSchema.parse(
        await client.post(`/sites/${uuid}/deployment/${deploymentUuid}/retry`, {})
      )
  };
}
