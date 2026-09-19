import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import {
  defaultPlatformJwtAudience,
  defaultPlatformJwtIssuer,
  type PlatformJwtClaims,
  type PlatformJwtConfiguration,
} from "./platform-jwt.js";

const scrypt = promisify(scryptCallback);
const passwordHashSchema = z.string().regex(/^scrypt\$[a-zA-Z0-9_-]+\$[a-zA-Z0-9_-]+$/u);

export const identityLoginSchema = z.object({
  identifier: z.string().trim().min(1).max(180),
  password: z.string().min(8).max(256),
});

export const identityBrowserSessionIdSchema = z.string().uuid();

export const identityPasswordResetRequestSchema = z.object({
  identifier: z.string().trim().min(1).max(180),
});

export const identityPasswordResetConfirmationSchema = z.object({
  password: z.string().min(8).max(256),
  token: z.string().trim().min(32).max(256),
});

export const identityPasswordResetAcceptedSchema = z.object({
  developmentToken: z.string().min(32).optional(),
  message: z.string().min(1),
});

export type IdentityLogin = z.infer<typeof identityLoginSchema>;

export const identityLoginResponseSchema = z.object({
  actor: z.object({
    id: z.string(),
    kind: z.enum(["user", "service"]),
    permissions: z.array(z.string()),
    roles: z.array(z.string()),
  }),
  session: z.object({
    expiresAt: z.string().datetime(),
    id: z.string(),
  }),
  token: z.string().min(1),
});

export const identityErrorResponseSchema = z.object({
  error: z.string().min(1),
});

export type IdentityLoginResponse = z.infer<typeof identityLoginResponseSchema>;
export type IdentityPasswordResetConfirmation = z.infer<typeof identityPasswordResetConfirmationSchema>;
export type IdentityPasswordResetRequest = z.infer<typeof identityPasswordResetRequestSchema>;

export async function hashIdentityPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyIdentityPassword(password: string, encodedHash: string): Promise<boolean> {
  const parsed = passwordHashSchema.safeParse(encodedHash);
  if (!parsed.success) return false;
  const [, saltValue, hashValue] = parsed.data.split("$");
  const expected = Buffer.from(hashValue!, "base64url");
  const actual = await scrypt(password, Buffer.from(saltValue!, "base64url"), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyPlatformJwt(configuration: PlatformJwtConfiguration, token: string): string | undefined {
  return readPlatformJwtClaims(configuration, token)?.subject;
}

export function readPlatformJwtClaims(
  configuration: PlatformJwtConfiguration,
  token: string,
): PlatformJwtClaims | undefined {
  const [header, payload, signature, extra] = token.split(".");
  if (!header || !payload || !signature || extra) return undefined;
  const expected = sign(configuration.secret, `${header}.${payload}`);
  if (!safeEqual(signature, expected)) return undefined;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    const issuer = configuration.issuer ?? defaultPlatformJwtIssuer;
    const audience = configuration.audience ?? defaultPlatformJwtAudience;
    if (claims.iss !== issuer || claims.aud !== audience) return undefined;
    if (typeof claims.sub !== "string" || !claims.sub.trim()) return undefined;
    if (typeof claims.exp !== "number" || claims.exp <= Math.floor(Date.now() / 1_000)) return undefined;
    if (claims.app !== undefined && (typeof claims.app !== "string" || !claims.app.trim())) return undefined;
    if (claims.sid !== undefined && (typeof claims.sid !== "string" || !claims.sid.trim())) return undefined;
    if (typeof claims.iat !== "number") return undefined;
    return {
      applicationId: claims.app as string | undefined,
      audience,
      expiresAt: claims.exp,
      issuedAt: claims.iat,
      issuer,
      sessionId: claims.sid as string | undefined,
      subject: claims.sub,
    };
  } catch {
    return undefined;
  }
}

function sign(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftValue = Buffer.from(left);
  const rightValue = Buffer.from(right);
  return leftValue.length === rightValue.length && timingSafeEqual(leftValue, rightValue);
}
