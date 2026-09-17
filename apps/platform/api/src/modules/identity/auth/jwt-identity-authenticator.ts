import { jwtVerify } from "jose";
import type { Actor } from "@codexsun/platform-core";
import type { IdentityService } from "../service/identity.service.js";

export interface JwtIdentityAuthenticationConfig {
  readonly secret: string;
  readonly issuer: string;
  readonly audience: string;
}

export class JwtIdentityAuthenticator {
  private readonly signingKey: Uint8Array;

  constructor(
    private readonly config: JwtIdentityAuthenticationConfig,
    private readonly identityService: IdentityService,
  ) {
    this.signingKey = new TextEncoder().encode(config.secret);
  }

  async authenticate(authorizationHeader: string | undefined): Promise<Actor | undefined> {
    const token = readBearerToken(authorizationHeader);
    if (!token) return undefined;

    try {
      const verified = await jwtVerify(token, this.signingKey, {
        algorithms: ["HS256"],
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      return verified.payload.sub ? this.identityService.findActor(verified.payload.sub) : undefined;
    } catch {
      return undefined;
    }
  }
}

function readBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined;
  const match = /^Bearer ([^\s]+)$/.exec(authorizationHeader);
  return match?.[1];
}
