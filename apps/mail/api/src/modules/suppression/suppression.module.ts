import { registerMailSuppressionRoutes } from "./suppression.routes.js";
export const suppressionModule = {
  key: "mail.suppression",
  capabilities: { events: false, worker: false, sync: false },
  register: registerMailSuppressionRoutes
};
