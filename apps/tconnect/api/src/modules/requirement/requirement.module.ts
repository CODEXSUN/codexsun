import { registerRequirementRoutes } from "./requirement.routes.js";
export const requirementModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.requirement",
  register: registerRequirementRoutes
};
export { registerRequirementRoutes };
