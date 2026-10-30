import { registerProductRoutes } from "./product.routes.js";
export const productModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.product",
  register: registerProductRoutes
};
export { registerProductRoutes };
