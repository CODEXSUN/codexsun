import type { FastifyInstance } from "fastify";
import type { AuthenticateCodexsunSocket } from "./realtime.types.js";
import { CodexsunRealtimeService } from "./realtime.service.js";

export function registerCodexsunRealtime(
  app: FastifyInstance,
  authenticateSocket: AuthenticateCodexsunSocket
) {
  const service = new CodexsunRealtimeService(app.server, authenticateSocket);
  app.addHook("preClose", async () => service.close());
  return service;
}
export const realtimeModule = {
  key: "codexsun.realtime",
  register: registerCodexsunRealtime,
  exemptions: {
    crud: "Realtime transport carries signals and committed-record invalidations; it owns no CRUD entity.",
    persistence:
      "Requirements and devices retain persistence and audit ownership; realtime stores no business records.",
    routes:
      "Socket.IO owns the websocket-only /codexsun/socket.io transport with authenticated event contracts.",
    worker: "Realtime transport does not execute tasks or grant worker authority."
  }
};
