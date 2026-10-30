import { registerDeploymentRoutes } from "./deployment.routes.js";
export const deploymentModule = {
  key: "sites.site.deployment",
  capabilities: { events: false, worker: true, sync: false },
  register: registerDeploymentRoutes
};
