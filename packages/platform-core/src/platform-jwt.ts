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
  readonly expiresInSeconds?: number;
}

export function createPlatformJwtToken(configuration: PlatformJwtConfiguration, input: PlatformJwtTokenInput): string {
  const now = Math.floor(Date.now() / 1_000);
  const payload = {
    sub: input.subject,
    iss: configuration.issuer ?? defaultPlatformJwtIssuer,
    aud: configuration.audience ?? defaultPlatformJwtAudience,
    iat: now,
    exp: now + (input.expiresInSeconds ?? 28_800),
  };
  const unsignedToken = `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url(payload)}`;
  const signature = createHmac("sha256", configuration.secret).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}

function base64Url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
