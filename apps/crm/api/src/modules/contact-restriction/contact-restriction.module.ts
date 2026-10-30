import { registerContactRestrictionRoutes } from "./contact-restriction.routes.js";
export const contactRestrictionModule = {
  key: "crm.contact-restriction",
  capabilities: { events: false, worker: false, sync: false },
  register: registerContactRestrictionRoutes
};
