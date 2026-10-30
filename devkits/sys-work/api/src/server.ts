import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, resolve } from "node:path";
import { Cleaner } from "./cleaner.js";

const cleaner = new Cleaner();
const port = Number(process.env.CODEXSUN_SYS_WORK_API_PORT ?? 7061);
const webPort = Number(process.env.CODEXSUN_SYS_WORK_WEB_PORT ?? 7060);
const webRoot = resolve(import.meta.dirname, "../web");
const allowedHosts = new Set([
  `127.0.0.1:${port}`,
  `localhost:${port}`,
  `127.0.0.1:${webPort}`,
  `localhost:${webPort}`
]);

if (process.platform !== "win32") throw new Error("Sys Work supports Windows hosts only.");
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid CODEXSUN_SYS_WORK_API_PORT.");

const server = createServer(async (request, reply) => {
  try {
    if (!allowedHosts.has(request.headers.host ?? ""))
      return send(reply, 403, { error: "Local host only." });
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    if (url.pathname === "/api/health" && request.method === "GET")
      return send(reply, 200, { status: "ready" });
    if (url.pathname.startsWith("/api/")) {
      if (request.headers.origin && !allowedHosts.has(new URL(request.headers.origin).host))
        return send(reply, 403, { error: "Local origin only." });
      if (request.method !== "POST") return send(reply, 405, { error: "Use POST." });
      const body = await readJson(request);
      if (url.pathname === "/api/scan") {
        if (typeof body.minAgeDays !== "number") throw new Error("Choose a file age.");
        return send(reply, 200, await cleaner.scan(body.minAgeDays));
      }
      if (url.pathname === "/api/clean") {
        if (body.confirm !== "DELETE")
          return send(reply, 400, { error: "Type DELETE to confirm." });
        if (
          typeof body.scanId !== "string" ||
          !Array.isArray(body.targetIds) ||
          !body.targetIds.every((id) => typeof id === "string")
        )
          throw new Error("Invalid cleanup selection.");
        return send(reply, 200, await cleaner.clean(body.scanId, body.targetIds));
      }
      return send(reply, 404, { error: "Unknown endpoint." });
    }
    if (request.method !== "GET") return send(reply, 405, { error: "Use GET." });
    await serveWeb(url.pathname, reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    send(reply, 400, { error: message });
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Sys Work: http://127.0.0.1:${port}\n`);
});

function send(reply: ServerResponse, status: number, data: unknown) {
  reply.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  reply.end(JSON.stringify(data));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk.toString();
    if (raw.length > 8192) throw new Error("Request is too large.");
  }
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a JSON object.");
  return value as Record<string, unknown>;
}

async function serveWeb(pathname: string, reply: ServerResponse) {
  const path = resolve(webRoot, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (path !== webRoot && !path.startsWith(`${webRoot}\\`) && !path.startsWith(`${webRoot}/`))
    return send(reply, 403, { error: "Invalid path." });
  let file = path;
  try {
    if (!(await stat(file)).isFile()) file = join(webRoot, "index.html");
  } catch {
    file = join(webRoot, "index.html");
  }
  try {
    await stat(file);
  } catch {
    return send(reply, 404, { error: "Build the Sys Work web app first." });
  }
  const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png"
  };
  reply.writeHead(200, {
    "Content-Type": types[extname(file)] ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  createReadStream(file).pipe(reply);
}
