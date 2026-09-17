import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPlatformJwtToken } from "@codexsun/platform-core/jwt";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const values = readEnv(existing);
const secret = values.get("PLATFORM_JWT_SECRET") || randomBytes(32).toString("hex");

values.set("PLATFORM_JWT_SECRET", secret);
values.set("PLATFORM_DEPLOYMENT_MODE", "single");
values.set("PLATFORM_DEPLOYMENT_NAME", values.get("PLATFORM_DEPLOYMENT_NAME") || "aaran");
values.set("PLATFORM_BOOTSTRAP_ADMIN_EMAIL", values.get("PLATFORM_BOOTSTRAP_ADMIN_EMAIL") || "admin@admin.com");
values.delete("PLATFORM_JWT_ISSUER");
values.delete("PLATFORM_JWT_AUDIENCE");
values.set("PLATFORM_OPERATOR_TOKEN", createPlatformJwtToken({ secret }, { subject: "platform.operator" }));

writeEnv(envPath, existing, values);
console.log("Platform JWT secret and local operator token are configured in .env.");

function readEnv(content: string): Map<string, string> {
  return new Map(
    content.split(/\r?\n/u).flatMap((line) => {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
      return match ? [[match[1], match[2]] as const] : [];
    }),
  );
}

function writeEnv(path: string, existing: string, values: Map<string, string>): void {
  const used = new Set<string>();
  const retired = new Set(["PLATFORM_JWT_ISSUER", "PLATFORM_JWT_AUDIENCE"]);
  const lines = existing.split(/\r?\n/u).flatMap((line) => {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
    if (!match) return [line];
    const key = match[1];
    if (retired.has(key)) return [];
    used.add(key);
    return [`${key}=${values.get(key) ?? match[2]}`];
  });
  for (const [key, value] of values) {
    if (!used.has(key)) lines.push(`${key}=${value}`);
  }
  writeFileSync(path, `${lines.filter(Boolean).join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
}
