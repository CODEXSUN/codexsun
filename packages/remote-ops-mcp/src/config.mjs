import { resolve } from "node:path";

const defaultRoot = resolve(import.meta.dirname, "../../..");

export function loadConfig(env = process.env) {
  const apiToken = env.CODEXSUN_MCP_API_TOKEN?.trim();
  if (!apiToken || apiToken.length < 16) {
    throw new Error("CODEXSUN_MCP_API_TOKEN must be set and contain at least 16 characters.");
  }

  const repositoryRoot = resolve(env.CODEXSUN_MCP_REPOSITORY_ROOT || defaultRoot);
  return {
    apiToken,
    requireRequestToken: env.CODEXSUN_MCP_REQUIRE_REQUEST_TOKEN === "1",
    repositoryRoot,
    appMode: env.APP_MODE || "development",
    auditPath: resolve(repositoryRoot, env.CODEXSUN_MCP_AUDIT_PATH || "storage/runtime/remote-mcp-audit.jsonl"),
    sshTargets: parseJson(env.CODEXSUN_MCP_SSH_TARGETS, {}),
    sshAllowedCommands: parseJson(env.CODEXSUN_MCP_SSH_ALLOWED_COMMANDS, {}),
  };
}

export function parseJson(value, fallback) {
  if (!value?.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    throw new Error("MCP JSON configuration is invalid.");
  }
}

export function authorize(request, config) {
  if (!config.requireRequestToken) return true;
  const value = request.params?._meta?.authorization || request.params?._meta?.apiToken;
  const supplied = typeof value === "string" && value.startsWith("Bearer ") ? value.slice(7) : value;
  if (!supplied || supplied.length !== config.apiToken.length) return false;
  return timingSafeEqual(supplied, config.apiToken);
}

function timingSafeEqual(left, right) {
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}
