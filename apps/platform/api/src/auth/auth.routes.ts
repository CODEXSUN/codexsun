import type { FastifyInstance, FastifyRequest } from "fastify";
import { fail, ok } from "@codexsun/framework/http";
import { z } from "zod";
import { AuthService } from "./auth.service.js";
import { AuthSessionRepository } from "./auth-session.repository.js";
import {
  clearSelectedSessionCookie,
  writeEncryptedSessionCookie,
  sessionSlotHeader
} from "./session-cookie.js";
import { writeDevelopmentSessionCookie } from "./development-session-cookie.js";
import { enforceBrowserRequestOrigin, requestHost } from "./auth-request-context.js";
import { isSharedApplicationHost } from "../modules/tenant-domain/tenant-domain.repository.js";
import { TenantRepository } from "../modules/tenant/tenant.repository.js";
import { env } from "../env.js";
import { configuredSingleTenant, isSingleTenantMode } from "../tenancy-mode.js";
import { AuthLoginAttemptRepository } from "./auth-login-attempt.repository.js";

const authService = new AuthService();
const sessions = new AuthSessionRepository();
const tenants = new TenantRepository();
const attempts = new AuthLoginAttemptRepository();

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/auth/tenant-context", async (request) => {
    const host = requestHost(request);
    if (isSingleTenantMode()) {
      const tenant = await configuredSingleTenant(tenants);
      const domainTenant = isSharedApplicationHost(host)
        ? tenant
        : await tenants.findByDomain(host);
      return ok(
        domainTenant?.uuid === tenant.uuid
          ? {
              corporateIdRequired: false,
              host,
              mode: isSharedApplicationHost(host) ? "shared_domain" : "custom_domain",
              tenantName: tenant.tenantName
            }
          : { corporateIdRequired: false, host, mode: "unknown", tenantName: null },
        { requestId: request.id }
      );
    }
    if (isSharedApplicationHost(host)) {
      return ok(
        { corporateIdRequired: true, host, mode: "shared_domain", tenantName: null },
        { requestId: request.id }
      );
    }
    const tenant = await tenants.findByDomain(host);
    return ok(
      tenant
        ? { corporateIdRequired: false, host, mode: "custom_domain", tenantName: tenant.tenantName }
        : { corporateIdRequired: true, host, mode: "unknown", tenantName: null },
      { requestId: request.id }
    );
  });

  app.post("/auth/development/tenant-login", async (request, reply) => {
    enforceBrowserRequestOrigin(request);
    if (
      env.NODE_ENV !== "development" ||
      env.DEV_AUTO_TENANT_LOGIN !== "1" ||
      env.DEFAULT_TENANT_CORPORATE_ID.trim().toUpperCase() !== "CODEXSUN"
    ) {
      return reply
        .code(404)
        .send(
          fail(
            { code: "AUTH_DEVELOPMENT_LOGIN_DISABLED", message: "Development login is disabled." },
            { requestId: request.id }
          )
        );
    }
    const result = await authService.login({
      corporateId: "CODEXSUN",
      desk: "tenant",
      domain: requestHost(request),
      email: env.DEFAULT_TENANT_ADMIN_EMAIL,
      password: env.DEFAULT_TENANT_ADMIN_PASSWORD
    });
    if (!result || !("tenantId" in result)) {
      return reply.code(401).send(invalidCredentials(request));
    }
    const sessionSlot = writeDevelopmentSessionCookie(reply, request, result.accessToken);
    return ok(publicResult(request, result, sessionSlot), {
      requestId: request.id,
      tenantId: result.tenantId
    });
  });

  app.post("/auth/login", async (request, reply) => {
    enforceBrowserRequestOrigin(request);
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success)
      return reply
        .code(400)
        .send(
          fail(
            {
              code: "AUTH_INVALID_LOGIN_REQUEST",
              message: "Enter one username or email and a password."
            },
            { requestId: request.id }
          )
        );
    const body = parsed.data;
    const corporateId = body.corporateId ?? body.tenantCode;
    const loginInput = {
      desk: body.desk,
      domain: requestHost(request),
      identifier: body.identifier ?? body.email ?? "",
      password: body.password,
      ...(corporateId ? { corporateId } : {})
    };
    const identity = await authService.loginAttemptIdentity(loginInput);
    const key = `${request.ip}:${requestHost(request)}:${body.desk}:${identity}`;
    if (await attempts.isRateLimited(key)) {
      return reply
        .code(429)
        .send(
          fail(
            { code: "AUTH_RATE_LIMITED", message: "Too many sign-in attempts. Try again later." },
            { requestId: request.id }
          )
        );
    }
    if (
      body.desk === "tenant" &&
      !isSingleTenantMode() &&
      isSharedApplicationHost(requestHost(request)) &&
      !corporateId
    ) {
      return reply.code(400).send(
        fail(
          {
            code: "AUTH_CORPORATE_ID_REQUIRED",
            message: "Corporate ID is required to select your workspace."
          },
          { requestId: request.id }
        )
      );
    }
    const result = await authService.login(loginInput);
    if (!result) {
      await attempts.recordFailure(key);
      return reply.code(401).send(invalidCredentials(request));
    }
    await attempts.clear(key);
    if (request.headers[sessionSlotHeader] && request.authContext?.source === "cookie") {
      await replaceCurrentSession(request);
      clearSelectedSessionCookie(reply, request);
    }
    const sessionSlot = writeEncryptedSessionCookie(reply, result.accessToken);
    return ok(publicResult(request, result, sessionSlot), {
      requestId: request.id,
      ...("tenantId" in result && result.tenantId ? { tenantId: result.tenantId } : {})
    });
  });

  app.get("/auth/session", async (request, reply) => {
    const auth = request.authContext;
    if (!auth) {
      return reply
        .code(401)
        .send(
          fail(
            { code: "AUTH_SESSION_EXPIRED", message: "Session expired. Please sign in again." },
            { requestId: request.id }
          )
        );
    }
    const payload = auth.payload;
    return ok(
      {
        authenticated: true,
        context: auth.session?.context,
        email: payload.email,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        name: payload.name,
        sessionIssuedAt: payload.sessionIssuedAt,
        tenantCode: payload.tenantCode,
        tenantDbName: payload.tenantDbName,
        tenantId: payload.tenantId,
        tenantUuid: payload.tenantUuid,
        role: await authService.sessionRole(payload),
        userType: payload.userType
      },
      { requestId: request.id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) }
    );
  });

  app.post("/auth/session/reset", async (request, reply) => {
    enforceBrowserRequestOrigin(request);
    await replaceCurrentSession(request);
    clearSelectedSessionCookie(reply, request);
    return ok({ reset: true }, { requestId: request.id });
  });

  app.post("/auth/logout", async (request, reply) => {
    await replaceCurrentSession(request);
    clearSelectedSessionCookie(reply, request);
    return ok({ loggedOut: true }, { requestId: request.id });
  });
}

const loginSchema = z
  .object({
    corporateId: z.string().trim().min(1).max(120).optional(),
    desk: z.enum(["tenant", "admin", "staff", "sa", "super_admin"]),
    email: z.string().trim().email().max(180).optional(),
    identifier: z.string().trim().min(1).max(180).optional(),
    password: z.string().min(1).max(1024),
    tenantCode: z.string().trim().min(1).max(120).optional()
  })
  .strict()
  .refine((value) => Boolean(value.identifier) !== Boolean(value.email), {
    message: "Provide one username or email."
  });

function invalidCredentials(request: FastifyRequest) {
  return fail(
    { code: "AUTH_INVALID_CREDENTIALS", message: "Invalid credentials or workspace." },
    { requestId: request.id }
  );
}

function publicResult<T extends { accessToken: string }>(
  request: FastifyRequest,
  result: T,
  sessionSlot: string | null
) {
  const { accessToken, ...safe } = result;
  const data = sessionSlot ? { ...safe, sessionSlot } : safe;
  return env.AUTH_MODE === "jwt" ||
    String(request.headers["x-auth-token-delivery"] ?? "").toLowerCase() === "bearer"
    ? { ...data, accessToken }
    : data;
}

async function replaceCurrentSession(request: FastifyRequest) {
  if (request.authContext?.payload.jti) await sessions.revoke(request.authContext.payload.jti);
}
