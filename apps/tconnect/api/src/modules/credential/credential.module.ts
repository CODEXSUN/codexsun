import { registerCredentialRoutes } from "./credential.routes.js";
export const credentialModule = {
  key: "tconnect.credential",
  capabilities: { events: false, worker: false, sync: false },
  register: registerCredentialRoutes
};
export { registerCredentialRoutes };
