import type { LocalIdentityConfiguration } from "./local-identity.js";

export function readLocalIdentityConfiguration(
  environment: NodeJS.ProcessEnv,
  options: { readonly applicationId: string; readonly databasePath: string },
): LocalIdentityConfiguration {
  const appMode = environment.APP_MODE === "production" ? "production" : "development";
  const secret = required(environment, "PLATFORM_JWT_SECRET");
  if (secret.length < 32) throw new Error("Set PLATFORM_JWT_SECRET to at least 32 characters.");

  return {
    appMode,
    applicationId: options.applicationId,
    autoLogin: appMode === "development" && environment.AUTO_LOGIN === "1",
    databasePath: options.databasePath,
    exposeDevelopmentResetToken: appMode === "development" && environment.IDENTITY_EXPOSE_DEVELOPMENT_RESET_TOKEN === "1",
    loginLockoutSeconds: positiveInteger(environment, "IDENTITY_LOGIN_LOCKOUT_SECONDS", 900),
    loginMaxFailures: positiveInteger(environment, "IDENTITY_LOGIN_MAX_FAILURES", 5),
    loginWindowSeconds: positiveInteger(environment, "IDENTITY_LOGIN_WINDOW_SECONDS", 900),
    passwordResetTokenTtlSeconds: positiveInteger(environment, "IDENTITY_PASSWORD_RESET_TOKEN_TTL_SECONDS", 900),
    refreshSeeds: appMode === "development" && environment.REFRESH_IDENTITY_SEED === "1",
    secret,
    seeds: [
      {
        login: required(environment, "SUPER_ADMIN_LOGIN"),
        name: required(environment, "SUPER_ADMIN_NAME"),
        password: required(environment, "SUPER_ADMIN_PASSWORD"),
        role: "super-admin",
        username: optional(environment, "SUPER_ADMIN_USERNAME", environment.SUPER_ADMIN_LOGIN),
      },
      {
        login: required(environment, "ADMIN_LOGIN"),
        name: required(environment, "ADMIN_NAME"),
        password: required(environment, "ADMIN_PASSWORD"),
        role: "admin",
        username: optional(environment, "ADMIN_USERNAME", environment.ADMIN_LOGIN),
      },
      ...readUserSeed(environment),
    ],
  };
}

function readUserSeed(environment: NodeJS.ProcessEnv) {
  const names = ["USER_NAME", "USER_LOGIN", "USER_PASSWORD"];
  const provided = names.filter((name) => Boolean(environment[name]?.trim()));
  if (provided.length !== names.length) return [];
  return [{
    login: required(environment, "USER_LOGIN"),
    name: required(environment, "USER_NAME"),
    password: required(environment, "USER_PASSWORD"),
    role: "user" as const,
    username: optional(environment, "USER_USERNAME", environment.USER_NAME),
  }];
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Set ${name}.`);
  return value;
}

function optional(environment: NodeJS.ProcessEnv, name: string, fallback: string | undefined): string {
  const value = environment[name]?.trim() || fallback?.trim();
  if (!value) throw new Error(`Set ${name}.`);
  return value.includes("@") ? value.split("@", 1)[0]! : value;
}

function positiveInteger(environment: NodeJS.ProcessEnv, name: string, defaultValue: number): number {
  const value = environment[name]?.trim();
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 86_400) throw new Error(`Set ${name} to a positive integer up to 86400.`);
  return parsed;
}
