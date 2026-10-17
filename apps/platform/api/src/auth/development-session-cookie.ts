import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";
import { verifyAuthToken } from "./jwt.js";
import {
  authCookieName,
  decryptSessionCookie,
  writeEncryptedSessionCookie
} from "./session-cookie.js";

export function writeDevelopmentSessionCookie(
  reply: FastifyReply,
  request: FastifyRequest,
  token: string
) {
  if (env.NODE_ENV !== "development" || env.DEV_AUTO_TENANT_LOGIN !== "1") {
    throw new Error("Development login is disabled.");
  }
  const principal = verifyAuthToken(token);
  if (!principal || principal.userType !== "tenant") {
    throw new Error("Invalid development tenant session.");
  }
  const tenantIdentity = principal.tenantUuid ?? principal.tenantId;
  if (!tenantIdentity) throw new Error("Development session has no tenant identity.");
  // A slot selects an encrypted cookie; it is not an authentication credential.
  const slot = createHash("sha256")
    .update(JSON.stringify(["development", principal.sub, tenantIdentity, principal.loginHost]))
    .digest("hex")
    .slice(0, 32);
  const name = authCookieName(slot);
  for (const [cookieName, value] of Object.entries(request.cookies ?? {})) {
    if (cookieName === name || !/^(?:__Host-)?codexsun_session_[0-9a-f]{32}$/u.test(cookieName)) {
      continue;
    }
    const previous = verifyAuthToken(decryptSessionCookie(value ?? ""));
    const samePrincipal =
      previous?.sub === principal.sub &&
      (previous.tenantUuid ?? previous.tenantId) === tenantIdentity &&
      previous.loginHost === principal.loginHost;
    if (!previous || samePrincipal) {
      reply.clearCookie(cookieName, {
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        secure: cookieName.startsWith("__Host-")
      });
    }
  }
  return writeEncryptedSessionCookie(reply, token, slot);
}
