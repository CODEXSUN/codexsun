import { registerLeadRoutes } from "./lead.routes.js";
export const leadModule = {
  key: "crm.lead",
  capabilities: { events: false, worker: false, sync: false },
  register: registerLeadRoutes
};
