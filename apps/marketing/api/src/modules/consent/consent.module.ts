import { registerConsentRoutes } from "./consent.routes.js";
export const consentModule = {
  key: "marketing.consent",
  capabilities: { events: false, worker: false, sync: false },
  register: registerConsentRoutes
};
