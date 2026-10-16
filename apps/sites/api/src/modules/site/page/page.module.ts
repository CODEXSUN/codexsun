import { registerPageRoutes } from "./page.routes.js";
export const pageModule = {
  key: "sites.page",
  // Synchronous draft/publication records. No external delivery, queue worker, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  register: registerPageRoutes
};
