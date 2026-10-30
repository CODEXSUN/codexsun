import { registerQuotationRoutes } from "./quotation.routes.js";
// Sent prices are immutable. Withdrawal replaces editing and deletion.
export const quotationModule = {
  key: "tconnect.quotation",
  capabilities: { events: false, worker: false, sync: false },
  register: registerQuotationRoutes
};
export { registerQuotationRoutes };
