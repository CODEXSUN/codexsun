export interface SessionCookieOptions {
  readonly name: string;
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: "lax" | "strict" | "none";
  readonly path: "/";
  readonly maxAgeSeconds: number;
}

export function sessionCookieOptions(input: {
  readonly name?: string;
  readonly appMode: "development" | "production";
  readonly sameSite?: "lax" | "strict" | "none";
  readonly maxAgeSeconds?: number;
}): SessionCookieOptions {
  const maxAgeSeconds = input.maxAgeSeconds ?? 900;
  if (!Number.isInteger(maxAgeSeconds) || maxAgeSeconds < 1) throw new Error("Session cookie max age must be a positive integer.");
  const sameSite = input.sameSite ?? "lax";
  if (sameSite === "none" && input.appMode !== "production") throw new Error("SameSite=None requires HTTPS.");
  return {
    name: input.name ?? "codexsun_session",
    httpOnly: true,
    secure: input.appMode === "production",
    sameSite,
    path: "/",
    maxAgeSeconds,
  };
}
