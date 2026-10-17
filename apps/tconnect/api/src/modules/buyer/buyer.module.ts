import { registerBuyerRoutes } from "./buyer.routes.js";
export const buyerModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.buyer",
  register: registerBuyerRoutes
};
export { registerBuyerRoutes };
