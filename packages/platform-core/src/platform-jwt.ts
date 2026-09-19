import { createHmac } from "node:crypto";

export const defaultPlatformJwtIssuer = "codexsun-platform";
export const defaultPlatformJwtAudience = "codexsun-platform-api";

export interface PlatformJwtConfiguration {
  readonly secret: string;
  readonly issuer?: string;
  readonly audience?: string;
}

export interface PlatformJwtTokenInput {
  readonly subject: string;
  readonly applicationId?: string;
  readonly expiresInSeconds?: number;
  readonly sessionId?: string;
}

export interface PlatformJwtClaims {
  readonly applicationId?: string;
  readonly audience: string;
  readonly expiresAt: number;
  readonly issuedAt: number;
  readonly issuer: string;
  readonly sessionId?: string;
  readonly subject: string;
}

export function createPlatformJwtToken(configuration: PlatformJwtConfiguration, input: PlatformJwtTokenInput): string {
  const now = Math.floor(Date.now() / 1_000);
  const payload = {
    ...(input.applicationId ? { app: input.applicationId } : {}),
    sub: input.subject,
    iss: configuration.issuer ?? defaultPlatformJwtIssuer,
    aud: configuration.audience ?? defaultPlatformJwtAudience,
    iat: now,
    exp: now + (input.expiresInSeconds ?? 28_800),
    ...(input.sessionId ? { sid: input.sessionId } : {}),
  };
  const unsignedToken = `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url(payload)}`;
  const signature = createHmac("sha256", configuration.secret).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}

function base64Url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
