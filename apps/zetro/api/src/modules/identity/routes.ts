import type { FastifyInstance } from "fastify";
import {
  IdentityLoginRateLimitError,
  identityBrowserSessionIdSchema,
  identityLoginSchema,
  identityPasswordResetConfirmationSchema,
  identityPasswordResetRequestSchema,
  type LocalIdentityStore,
  registerIdentityManagementRoutes,
} from "@codexsun/platform-core";

const prefix = "/api/zetro/v1";
type IdentityPortal = "admin" | "super-admin" | "user";

export function registerZetroIdentityRoutes(app: FastifyInstance, identity: LocalIdentityStore): void {
  app.post(`${prefix}/auth/login`, async (request, reply) => login(identity, request.body, request.headers["x-codexsun-browser-session"], "user", reply));
  app.post(`${prefix}/auth/admin/login`, async (request, reply) => login(identity, request.body, request.headers["x-codexsun-browser-session"], "admin", reply));
  app.post(`${prefix}/auth/super-admin/login`, async (request, reply) => login(identity, request.body, request.headers["x-codexsun-browser-session"], "super-admin", reply));
  app.post(`${prefix}/auth/password-reset/request`, async (request, reply) => {
    const body = identityPasswordResetRequestSchema.safeParse(request.body);
    if (body.success) await identity.requestPasswordReset(body.data.identifier);
    return reply.code(202).send({ message: "If the account exists, a reset request was created." });
  });
  app.post(`${prefix}/auth/password-reset/confirm`, async (request, reply) => {
    const body = identityPasswordResetConfirmationSchema.safeParse(request.body);
    if (!body.success || !(await identity.resetPassword(body.data.token, body.data.password))) return reply.code(400).send({ error: "The reset token is invalid or expired." });
    return reply.code(204).send();
  });
  app.post(`${prefix}/auth/development-login`, async (request, reply) => {
    const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
    if (!identity.autoLogin || !browserSessionId.success) return reply.code(404).send();
    return (await identity.autoLogin(browserSessionId.data)) ?? reply.code(401).send({ error: "Development login is unavailable." });
  });
  app.addHook("onRequest", async (request, reply) => {
    if (isPublicZetroPath(request.url)) return;
    if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });
  });
  app.post(`${prefix}/auth/logout`, async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());
  registerIdentityManagementRoutes({ app, identity, prefix });
}

export function isPublicZetroPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === `${prefix}/auth/login`
    || path === `${prefix}/auth/admin/login`
    || path === `${prefix}/auth/super-admin/login`
    || path === `${prefix}/auth/development-login`
    || path === `${prefix}/auth/password-reset/request`
    || path === `${prefix}/auth/password-reset/confirm`
    || path === `${prefix}/health`;
}

async function login(identity: LocalIdentityStore, requestBody: unknown, browserSession: unknown, portal: IdentityPortal, reply: { code(statusCode: number): { send(value: unknown): unknown } }): Promise<unknown> {
  const credentials = identityLoginSchema.safeParse(requestBody);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(browserSession);
  if (!credentials.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try {
    return (await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal)) ?? reply.code(401).send({ error: "Invalid login." });
  } catch (error) {
    if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
    throw error;
  }
}
