import { registerBrandRoutes } from "./brand.routes.js";
export const brandModule = {
  key: "marketing.brand",
  capabilities: { events: false, worker: false, sync: false },
  register: registerBrandRoutes
};
