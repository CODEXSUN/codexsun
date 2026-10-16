import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { z } from "zod";
import type {
  AuthenticateCodexsunSocket,
  CodexsunSocketCredentials,
  CodexsunSocketIdentity,
  CodexsunChange
} from "./realtime.types.js";

const nonce = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const handshake = z
  .object({
    sessionSlot: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
    portal: z.enum(["web", "desktop", "mobile"])
  })
  .strict();
const ping = z.object({ nonce }).strict();
const signal = z.object({ nonce, text: z.string().trim().min(1).max(240) }).strict();
const changeSchema = z
  .object({
    tenantUuid: z.string().min(1).max(128),
    actorEmail: z.string().min(1).max(191),
    resource: z.enum(["requirements", "devices"]),
    uuid: z.string().regex(/^[a-f0-9]{8}$/),
    revision: z.number().int().positive().optional(),
    action: z.string().regex(/^[a-z_]{1,64}$/)
  })
  .strict();
type Session = {
  credentials: CodexsunSocketCredentials;
  identity: CodexsunSocketIdentity;
  portal: "web" | "desktop" | "mobile";
  windowStart: number;
  count: number;
};

export class CodexsunRealtimeService {
  private readonly io: Server;
  private readonly sessions = new Map<Socket, Session>();
  private readonly revalidation: ReturnType<typeof setInterval>;
  constructor(
    server: HttpServer,
    private readonly authenticate: AuthenticateCodexsunSocket
  ) {
    this.io = new Server(server, {
      path: "/codexsun/socket.io",
      transports: ["websocket"],
      maxHttpBufferSize: 32 * 1024,
      serveClient: false
    });
    this.io.use((socket, next) => {
      void this.admit(socket).then(
        () => next(),
        () => next(new Error("Session is unavailable or realtime access is denied."))
      );
    });
    this.io.on("connection", (socket) => this.connect(socket));
    this.revalidation = setInterval(() => {
      for (const socket of this.sessions.keys()) void this.validate(socket);
    }, 30_000);
    this.revalidation.unref();
  }
  async publishChange(input: CodexsunChange) {
    const change = changeSchema.parse(input);
    for (const [socket, session] of this.sessions) {
      if (session.identity.tenantUuid !== change.tenantUuid) continue;
      const identity = await this.validate(socket);
      if (!identity) continue;
      const own = identity.actorEmail === change.actorEmail;
      const visible =
        change.resource === "requirements"
          ? identity.permissions["codexsun.requirements.view"] &&
            (own || identity.permissions["codexsun.requirements.approve"])
          : own && identity.permissions["codexsun.devices.view"];
      if (visible)
        socket.emit("codexsun:changed", {
          resource: change.resource,
          uuid: change.uuid,
          ...(change.revision ? { revision: change.revision } : {}),
          action: change.action,
          serverTime: new Date().toISOString()
        });
    }
  }
  close() {
    clearInterval(this.revalidation);
    this.io.disconnectSockets(true);
    this.io.engine.close();
    this.io.removeAllListeners();
    this.sessions.clear();
  }
  private async admit(socket: Socket) {
    const auth = handshake.parse(socket.handshake.auth);
    const cookie = socket.handshake.headers.cookie ?? "";
    const authorization = socket.handshake.headers.authorization;
    if (cookie.length > 16384 || (authorization && authorization.length > 8192))
      throw new Error("Invalid credentials.");
    const host = socket.handshake.headers.host ?? "";
    const origin = socket.handshake.headers.origin;
    if (origin && new URL(origin).host !== host)
      throw new Error("Cross-origin realtime is denied.");
    const credentials: CodexsunSocketCredentials = {
      cookie,
      sessionSlot: auth.sessionSlot,
      host,
      ...(origin ? { origin } : {}),
      ...(authorization ? { bearer: authorization } : {})
    };
    const identity = await this.authenticate(credentials);
    if (!identity.permissions["codexsun.overview.view"]) throw new Error("Access denied.");
    if (socket.conn.readyState !== "open") throw new Error("Connection closed.");
    const count = [...this.sessions.values()].filter(
      (value) =>
        value.identity.tenantUuid === identity.tenantUuid &&
        value.identity.actorEmail === identity.actorEmail
    ).length;
    if (count >= 8) throw new Error("Connection limit reached.");
    socket.conn.once("close", () => this.sessions.delete(socket));
    this.sessions.set(socket, {
      credentials,
      identity,
      portal: auth.portal,
      windowStart: Date.now(),
      count: 0
    });
  }
  private connect(socket: Socket) {
    socket.on("disconnect", () => this.sessions.delete(socket));
    socket.on("codexsun:ping", (input: unknown, ack: unknown) => {
      void this.receive(socket, input, ack, false);
    });
    socket.on("codexsun:signal", (input: unknown, ack: unknown) => {
      void this.receive(socket, input, ack, true);
    });
  }
  private async receive(socket: Socket, input: unknown, ack: unknown, broadcast: boolean) {
    try {
      const session = this.sessions.get(socket);
      if (!session) throw new Error("Session unavailable.");
      this.rateLimit(session);
      const payload = broadcast ? signal.parse(input) : ping.parse(input);
      const identity = await this.validate(socket);
      if (!identity) throw new Error("Session unavailable.");
      const serverTime = new Date().toISOString();
      if (broadcast) {
        for (const [target, targetSession] of this.sessions) {
          if (
            targetSession.identity.tenantUuid !== identity.tenantUuid ||
            targetSession.identity.actorEmail !== identity.actorEmail
          )
            continue;
          if (await this.validate(target))
            target.emit("codexsun:signal", {
              ...payload,
              sourcePortal: session.portal,
              serverTime
            });
        }
      }
      if (await this.validate(socket)) respond(ack, { nonce: payload.nonce, serverTime });
    } catch {
      respond(ack, { error: "Invalid request, rate limit reached, or session unavailable." });
    }
  }
  private rateLimit(session: Session) {
    const now = Date.now();
    if (now - session.windowStart >= 60000) {
      session.windowStart = now;
      session.count = 0;
    }
    session.count++;
    if (session.count > 30) throw new Error("Rate limit reached.");
  }
  private async validate(socket: Socket) {
    const session = this.sessions.get(socket);
    if (!session || !socket.connected) return undefined;
    try {
      const identity = await this.authenticate(session.credentials);
      if (
        identity.tenantUuid !== session.identity.tenantUuid ||
        identity.actorEmail !== session.identity.actorEmail ||
        !identity.permissions["codexsun.overview.view"] ||
        permissionKey(identity.permissions) !== permissionKey(session.identity.permissions)
      )
        throw new Error("Session changed.");
      return identity;
    } catch {
      socket.disconnect(true);
      this.sessions.delete(socket);
      return undefined;
    }
  }
}
function respond(ack: unknown, payload: object) {
  if (typeof ack === "function") ack(payload);
}
function permissionKey(permissions: Record<string, boolean>) {
  return JSON.stringify(Object.entries(permissions).sort(([a], [b]) => a.localeCompare(b)));
}
