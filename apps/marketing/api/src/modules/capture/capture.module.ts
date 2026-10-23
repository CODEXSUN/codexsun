import { registerCaptureRoutes } from "./capture.routes.js";
export const captureModule = {
  key: "marketing.capture",
  capabilities: { events: false, worker: false, sync: false },
  register: registerCaptureRoutes
};
