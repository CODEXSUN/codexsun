import { z } from "zod";

const hostSchema = z.string().trim().min(1);
const portSchema = z.coerce.number().int().min(1).max(65_535);
const urlSchema = z.string().url();

export const apiRuntimeConfigSchema = z.object({
  NODE_ENV: z.string().trim().min(1).default("development"),
  PLATFORM_HOST: hostSchema,
  PLATFORM_API_PORT: portSchema,
  DATABASE_URL: urlSchema,
});

export const webRuntimeConfigSchema = z.object({
  PLATFORM_HOST: hostSchema,
  PLATFORM_WEB_PORT: portSchema,
  VITE_PLATFORM_API_URL: urlSchema,
});

export const desktopRuntimeConfigSchema = z.object({
  PLATFORM_DESKTOP_API_URL: urlSchema,
});

export const mobileRuntimeConfigSchema = z.object({
  PLATFORM_MOBILE_API_URL: urlSchema,
});

export type ApiRuntimeConfig = z.infer<typeof apiRuntimeConfigSchema>;
export type WebRuntimeConfig = z.infer<typeof webRuntimeConfigSchema>;
export type DesktopRuntimeConfig = z.infer<typeof desktopRuntimeConfigSchema>;
export type MobileRuntimeConfig = z.infer<typeof mobileRuntimeConfigSchema>;

export function readApiRuntimeConfig(environment: NodeJS.ProcessEnv): ApiRuntimeConfig {
  return apiRuntimeConfigSchema.parse(environment);
}

export function readWebRuntimeConfig(environment: NodeJS.ProcessEnv): WebRuntimeConfig {
  return webRuntimeConfigSchema.parse(environment);
}

export function readDesktopRuntimeConfig(environment: NodeJS.ProcessEnv): DesktopRuntimeConfig {
  return desktopRuntimeConfigSchema.parse(environment);
}

export function readMobileRuntimeConfig(environment: NodeJS.ProcessEnv): MobileRuntimeConfig {
  return mobileRuntimeConfigSchema.parse(environment);
}
