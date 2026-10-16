import { registerDevicesRoutes } from "./devices.routes.js";
export const devicesModule = {
  key: "codexsun.devices",
  register: registerDevicesRoutes,
  exemptions: {
    delete: "Device records are deactivated to retain identity history.",
    async: "A heartbeat is presence metadata, not a worker or sync protocol."
  }
};
