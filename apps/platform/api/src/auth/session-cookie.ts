import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";

const cookieVersion = "v1";
const cookieAad = Buffer.from("codexsun.auth.session.v1", "utf8");
export const sessionSlotHeader = "x-codexsun-session-slot";
const sessionSlotPattern = /^[0-9a-f]{32}$/u;
const legacyCookieNames = [
  "codexsun_session",
  "codexsun_session_admin",
  "codexsun_session_sa",
  "codexsun_session_tenant",
  "__Host-codexsun_session"
] as const;

// Production sessions are Secure __Host- cookies. AUTH_COOKIE_SECURE=0 is an explicit opt-out
// for plain-HTTP LAN installs, where browsers would otherwise drop the cookie after login.
function secureSessionCookies() {
  return env.NODE_ENV === "production" && env.AUTH_COOKIE_SECURE === "1";
}

export function authCookieName(slot?: string) {
  const base = secureSessionCookies() ? "__Host-codexsun_session" : "codexsun_session";
  return slot ? `${base}_${slot}` : base;
}

export function readEncryptedSessionCookie(request: FastifyRequest) {
  const slot = selectedSessionSlot(request);
  if (request.headers[sessionSlotHeader] !== undefined && !slot) return "";
  const directValue = request.cookies[authCookieName(slot ?? undefined)];
  if (directValue) return decryptSessionCookie(directValue);
  if (!slot && request.headers[sessionSlotHeader] === undefined) {
    const cookies = request.cookies ?? {};
    const sessionCookieKeys = Object.keys(cookies).filter(
      (name) => name.startsWith("codexsun_session_") || name.startsWith("__Host-codexsun_session_")
    );
    const firstKey = sessionCookieKeys[0];
    if (sessionCookieKeys.length === 1 && firstKey) {
      const singleValue = cookies[firstKey];
      if (singleValue) return decryptSessionCookie(singleValue);
    }
  }
  return "";
}

export function writeEncryptedSessionCookie(reply: FastifyReply, token: string) {
  if (env.AUTH_MODE === "jwt") return null;
  const slot = randomBytes(16).toString("hex");
  reply.setCookie(authCookieName(slot), encryptSessionCookie(token), {
    httpOnly: true,
    maxAge: env.AUTH_SESSION_TTL_HOURS * 60 * 60,
    path: "/",
    sameSite: "strict",
    secure: secureSessionCookies()
  });
  return slot;
}

export function clearSelectedSessionCookie(reply: FastifyReply, request: FastifyRequest) {
  const slot = selectedSessionSlot(request);
  if (slot) {
    reply.clearCookie(authCookieName(slot), {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: secureSessionCookies()
    });
  } else if (request.headers[sessionSlotHeader] === undefined) {
    clearAllSessionCookies(reply);
  }
}

export function clearAllSessionCookies(reply: FastifyReply) {
  for (const name of legacyCookieNames) {
    reply.clearCookie(name, {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: name.startsWith("__Host-") || secureSessionCookies()
    });
  }
}

function extractQuerySlot(request: FastifyRequest): string | null {
  const query = request.query as Record<string, unknown> | undefined;
  if (typeof query?.sessionSlot === "string") return query.sessionSlot;
  if (typeof query?.slot === "string") return query.slot;
  if (typeof request.url === "string" && request.url.includes("?")) {
    try {
      const search = request.url.slice(request.url.indexOf("?"));
      const params = new URLSearchParams(search);
      return params.get("sessionSlot") ?? params.get("slot");
    } catch {
      return null;
    }
  }
  return null;
}

function selectedSessionSlot(request: FastifyRequest): string | null {
  const headerValue = request.headers[sessionSlotHeader];
  if (typeof headerValue === "string" && sessionSlotPattern.test(headerValue)) {
    return headerValue;
  }
  const querySlot = extractQuerySlot(request);
  if (typeof querySlot === "string" && sessionSlotPattern.test(querySlot)) {
    return querySlot;
  }
  return null;
}

export function encryptSessionCookie(token: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cookieKey(), nonce);
  cipher.setAAD(cookieAad);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    cookieVersion,
    nonce.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url")
  ].join(".");
}

export function decryptSessionCookie(value: string) {
  const [version, nonceValue, ciphertextValue, tagValue] = value.split(".");
  if (version !== cookieVersion || !nonceValue || !ciphertextValue || !tagValue) {
    return "";
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      cookieKey(),
      Buffer.from(nonceValue, "base64url")
    );
    decipher.setAAD(cookieAad);
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return "";
  }
}

function cookieKey() {
  return createHash("sha256").update(`codexsun:auth-cookie:${env.JWT_SECRET}`, "utf8").digest();
}
