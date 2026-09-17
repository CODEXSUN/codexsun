import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadComponentEnvironment(projectRoot, applicationEnvironmentPath) {
  return {
    ...process.env,
    ...readEnvironmentFile(resolve(projectRoot, ".env")),
    ...readEnvironmentFile(resolve(projectRoot, applicationEnvironmentPath)),
  };
}

export function readRequiredHost(environment, key) {
  const value = String(environment[key] ?? "").trim();
  if (!value) throw new Error(`Set ${key} in .env or the application .app.env file.`);
  return value;
}

export function readRequiredPort(environment, key) {
  const value = Number(String(environment[key] ?? "").trim());
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`Set ${key} to a valid port in .env or the application .app.env file.`);
  }
  return value;
}

function readEnvironmentFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/u))
      .filter(Boolean)
      .map((match) => [match[1].trim(), parseValue(match[2])]),
  );
}

function parseValue(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) return trimmed.slice(1, -1);
  return trimmed.replace(/\s+#.*$/u, "").trim();
}
