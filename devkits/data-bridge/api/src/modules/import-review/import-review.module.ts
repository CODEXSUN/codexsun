import { registerCommonTableImportRoutes } from "./import-review.routes.js";
// This technical record owner uses the preserved app-level migration ledger and Platform dispatch.
export const importReviewModule = {
  key: "data-bridge.import-review",
  register: registerCommonTableImportRoutes
};
