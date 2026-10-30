import { registerTransferRoutes } from "./transfer-session.routes.js";
// This technical record owner uses the preserved app-level migration ledger and Platform dispatch.
export const transferSessionModule = {
  key: "data-bridge.transfer-session",
  register: registerTransferRoutes
};
