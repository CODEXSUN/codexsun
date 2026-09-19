import { z } from "zod";

const defaultPlatformJwtIssuer = "codexsun-platform";
const defaultPlatformJwtAudience = "codexsun-platform-api";

const hostSchema = z.string().trim().min(1);
const portSchema = z.coerce.number().int().min(1).max(65_535);
const urlSchema = z.string().url();
const jwtSecretSchema = z.string().min(32);
const redisUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "redis:" || protocol === "rediss:";
    },
    { message: "REDIS_URL must use redis:// or rediss://." },
  );

export const apiRuntimeConfigSchema = z.object({
  NODE_ENV: z.string().trim().min(1).default("development"),
  PLATFORM_HOST: hostSchema,
  PLATFORM_API_PORT: portSchema,
  PLATFORM_WEB_ORIGIN: urlSchema.default("http://127.0.0.1:6101"),
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: urlSchema.optional(),
  DATABASE_URL: urlSchema,
  STORAGE_ROOT: z.string().trim().min(1).default("../../../storage/apps"),
  PLATFORM_JWT_SECRET: jwtSecretSchema,
  PLATFORM_JWT_ISSUER: z.string().trim().min(1).default(defaultPlatformJwtIssuer),
  PLATFORM_JWT_AUDIENCE: z.string().trim().min(1).default(defaultPlatformJwtAudience),
  PLATFORM_DEPLOYMENT_MODE: z.literal("single"),
  PLATFORM_DEPLOYMENT_NAME: z.string().trim().min(1).max(120),
  PLATFORM_BOOTSTRAP_ADMIN_EMAIL: z.string().trim().email(),
});

export const webRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  PLATFORM_WEB_PORT: portSchema,
  VITE_PLATFORM_API_URL: urlSchema,
});

export const docsApiRuntimeConfigSchema = z.object({
  NODE_ENV: z.string().trim().min(1).default("development"),
  PLATFORM_HOST: hostSchema,
  DOCS_API_PORT: portSchema,
  DOCS_DATABASE_URL: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === "sqlite:", {
      message: "DOCS_DATABASE_URL must use sqlite://.",
    }),
  DOCS_INDEX_PATH: z.string().trim().min(1),
  DOCS_WEB_ORIGIN: urlSchema,
});

export const docsWebRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  DOCS_WEB_PORT: portSchema,
  VITE_DOCS_API_URL: urlSchema,
});

export const garmentsApiRuntimeConfigSchema = z.object({
  NODE_ENV: z.string().trim().min(1).default("development"),
  PLATFORM_HOST: hostSchema,
  GARMENTS_API_PORT: portSchema,
  GARMENTS_DATABASE_URL: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === "sqlite:", {
      message: "GARMENTS_DATABASE_URL must use sqlite://.",
    }),
  GARMENTS_INDEX_PATH: z.string().trim().min(1),
  GARMENTS_WEB_ORIGIN: urlSchema,
  GARMENTS_FRAPPE_URL: urlSchema,
  GARMENTS_FRAPPE_TOKEN: z.string().trim().min(1).optional(),
});

export const garmentsWebRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  GARMENTS_WEB_PORT: portSchema,
  VITE_GARMENTS_API_URL: urlSchema,
});

export const zetroApiRuntimeConfigSchema = z.object({
  NODE_ENV: z.string().trim().min(1).default("development"),
  PLATFORM_HOST: hostSchema,
  ZETRO_API_PORT: portSchema,
  ZETRO_DATABASE_URL: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === "sqlite:", {
      message: "ZETRO_DATABASE_URL must use sqlite://.",
    }),
  ZETRO_DATABASE_PATH: z.string().trim().min(1),
  ZETRO_STORAGE_ROOT: z.string().trim().min(1),
});

export const zetroWebRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  ZETRO_WEB_PORT: portSchema,
  VITE_ZETRO_API_URL: urlSchema,
});

export const uiuxWebRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  UIUX_WEB_PORT: portSchema,
});

export const desktopRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  PLATFORM_DESKTOP_PORT: portSchema,
  PLATFORM_DESKTOP_API_URL: urlSchema,
});

export const mobileRuntimeConfigSchema = z.object({
  PLATFORM_MOBILE_API_URL: urlSchema,
});

/**
 * Reserved infrastructure configuration. No host reads this until a Redis-backed
 * provider is selected for a deployment.
 */
export const redisRuntimeConfigSchema = z.object({
  REDIS_URL: redisUrlSchema,
});

export type ApiRuntimeConfig = z.infer<typeof apiRuntimeConfigSchema>;
export type WebRuntimeConfig = z.infer<typeof webRuntimeConfigSchema>;
export type DocsApiRuntimeConfig = z.infer<typeof docsApiRuntimeConfigSchema>;
export type DocsWebRuntimeConfig = z.infer<typeof docsWebRuntimeConfigSchema>;
export type GarmentsApiRuntimeConfig = z.infer<typeof garmentsApiRuntimeConfigSchema>;
export type GarmentsWebRuntimeConfig = z.infer<typeof garmentsWebRuntimeConfigSchema>;
export type ZetroApiRuntimeConfig = z.infer<typeof zetroApiRuntimeConfigSchema>;
export type ZetroWebRuntimeConfig = z.infer<typeof zetroWebRuntimeConfigSchema>;
export type UiuxWebRuntimeConfig = z.infer<typeof uiuxWebRuntimeConfigSchema>;
export type DesktopRuntimeConfig = z.infer<typeof desktopRuntimeConfigSchema>;
export type MobileRuntimeConfig = z.infer<typeof mobileRuntimeConfigSchema>;
export type RedisRuntimeConfig = z.infer<typeof redisRuntimeConfigSchema>;

export function readApiRuntimeConfig(environment: NodeJS.ProcessEnv): ApiRuntimeConfig {
  return apiRuntimeConfigSchema.parse(environment);
}

export function readWebRuntimeConfig(environment: NodeJS.ProcessEnv): WebRuntimeConfig {
  return webRuntimeConfigSchema.parse(environment);
}

export function readDocsApiRuntimeConfig(environment: NodeJS.ProcessEnv): DocsApiRuntimeConfig {
  return docsApiRuntimeConfigSchema.parse(environment);
}

export function readDocsWebRuntimeConfig(environment: NodeJS.ProcessEnv): DocsWebRuntimeConfig {
  return docsWebRuntimeConfigSchema.parse(environment);
}

export function readGarmentsApiRuntimeConfig(environment: NodeJS.ProcessEnv): GarmentsApiRuntimeConfig {
  return garmentsApiRuntimeConfigSchema.parse(environment);
}

export function readGarmentsWebRuntimeConfig(environment: NodeJS.ProcessEnv): GarmentsWebRuntimeConfig {
  return garmentsWebRuntimeConfigSchema.parse(environment);
}

export function readZetroApiRuntimeConfig(environment: NodeJS.ProcessEnv): ZetroApiRuntimeConfig {
  return zetroApiRuntimeConfigSchema.parse(environment);
}

export function readZetroWebRuntimeConfig(environment: NodeJS.ProcessEnv): ZetroWebRuntimeConfig {
  return zetroWebRuntimeConfigSchema.parse(environment);
}

export function readUiuxWebRuntimeConfig(environment: NodeJS.ProcessEnv): UiuxWebRuntimeConfig {
  return uiuxWebRuntimeConfigSchema.parse(environment);
}

export function readDesktopRuntimeConfig(environment: NodeJS.ProcessEnv): DesktopRuntimeConfig {
  return desktopRuntimeConfigSchema.parse(environment);
}

export function readMobileRuntimeConfig(environment: NodeJS.ProcessEnv): MobileRuntimeConfig {
  return mobileRuntimeConfigSchema.parse(environment);
}

export function readRedisRuntimeConfig(environment: NodeJS.ProcessEnv): RedisRuntimeConfig {
  return redisRuntimeConfigSchema.parse(environment);
}
