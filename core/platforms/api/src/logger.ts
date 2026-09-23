import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import type { LoggerOptions } from "pino";

export const platformLoggerOptionsKey = "platform.logger.options";
const indianTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export class LoggerProvider implements ModuleProvider {
  constructor(private readonly nodeEnvironment: string) {}

  readonly manifest = {
    id: "platform.logger",
    owner: "core/platforms/api/logger",
    version: "1.0.2",
    dependencies: ["platform.core"],
    contracts: ["platform.logger"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide(platformLoggerOptionsKey, createApiLoggerOptions(this.nodeEnvironment));
  }
}

export function createApiLoggerOptions(nodeEnvironment: string): LoggerOptions {
  return {
    level: nodeEnvironment === "development" ? "debug" : "info",
    timestamp: indianTimestamp,
    redact: { paths: ["req.headers.authorization"], censor: "[Redacted]" },
    ...(nodeEnvironment === "development"
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: false, singleLine: true, ignore: "pid,hostname" },
          },
        }
      : {}),
  };
}

function indianTimestamp(): string {
  const parts = Object.fromEntries(indianTimeFormatter.formatToParts().map(({ type, value }) => [type, value]));
  const timestamp = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
  return `,"time":"${timestamp}"`;
}
