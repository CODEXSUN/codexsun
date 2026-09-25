import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  identityBrowserSessionIdSchema,
  IdentityLoginRateLimitError,
  type LocalIdentityStore,
} from "@codexsun/platform-core";

export const CASHIER_LOGIN = "cashier";
export const CASHIER_ROLE = "cashier";
export const CASHIER_PIN_PATHS = [
  "/api/v1/qcafe/auth/pin",
  "/api/v1/qcafe/auth/pin/setup",
  "/api/v1/qcafe/auth/pin/login",
];

const pinSchema = z.object({ pin: z.string().regex(/^\d{4}$/u, "Enter the four-digit cashier PIN.") });

export function findCashierUser(identity: LocalIdentityStore) {
  return identity.listUsers().find((user) => user.login.toLowerCase() === CASHIER_LOGIN);
}

export async function registerCashierPinRoutes(app: FastifyInstance, identity: LocalIdentityStore): Promise<void> {
  app.get("/api/v1/qcafe/auth/pin", async () => ({
    cashierLogin: CASHIER_LOGIN,
    pinSet: Boolean(findCashierUser(identity)),
    supported: true,
  }));

  app.post("/api/v1/qcafe/auth/pin/setup", async (request, reply) => {
    const body = pinSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "Enter the four-digit cashier PIN." });
    if (findCashierUser(identity)) {
      return reply.code(409).send({ error: "The cashier PIN is already set. Sign in with it." });
    }
    try {
      identity.createRole(CASHIER_ROLE);
    } catch {
      // The cashier role already exists; role assignment below is what matters.
    }
    let user;
    try {
      user = await identity.createManagedUser({
        login: CASHIER_LOGIN,
        name: "Cashier",
        password: body.data.pin,
        state: "active",
        username: CASHIER_LOGIN,
      });
    } catch {
      return reply.code(409).send({ error: "The cashier login is unavailable." });
    }
    identity.replaceUserRoles(user.id, [CASHIER_ROLE]);
    return reply.code(201).send({ cashierLogin: CASHIER_LOGIN });
  });

  app.post("/api/v1/qcafe/auth/pin/login", async (request, reply) => {
    const body = pinSchema.safeParse(request.body);
    const browserSessionId = identityBrowserSessionIdSchema.safeParse(
      (request.headers as Record<string, unknown>)["x-codexsun-browser-session"],
    );
    if (!body.success || !browserSessionId.success) {
      return reply.code(400).send({ error: "Enter the four-digit cashier PIN." });
    }
    if (!findCashierUser(identity)) return reply.code(404).send({ error: "First setup required." });
    try {
      const session = await identity.login(CASHIER_LOGIN, body.data.pin, browserSessionId.data, "user");
      if (!session) return reply.code(401).send({ error: "Incorrect PIN." });
      return session;
    } catch (error) {
      if (error instanceof IdentityLoginRateLimitError) {
        return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
      }
      throw error;
    }
  });
}
