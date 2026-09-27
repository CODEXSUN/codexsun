import { createServer } from "node:http";
import { createStandaloneApplication } from "./standalone-app-scaffold.mjs";

const rootDir = new URL("../../../", import.meta.url).pathname.replace(/^\/(\w):/u, "$1:").replaceAll("/", "\\");
const host = process.env.APP_FACTORY_HOST ?? "127.0.0.1";
const port = Number(process.env.APP_FACTORY_PORT ?? 6280);
const token = process.env.APP_FACTORY_TOKEN?.trim();
if (!token) throw new Error("APP_FACTORY_TOKEN is required to start the app factory API.");

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (request.method === "GET" && request.url === "/api/v1/app-factory/health") return send(response, 200, { ok: true });
  if (request.method !== "POST" || request.url !== "/api/v1/app-factory/applications") return send(response, 404, { error: "Not found" });
  if (request.headers.authorization !== `Bearer ${token}`) return send(response, 401, { error: "Unauthorized" });
  try {
    const body = await readJson(request);
    const result = createStandaloneApplication(rootDir, body);
    return send(response, 201, result);
  } catch (error) {
    return send(response, 400, { error: error.message });
  }
});

server.listen(port, host, () => console.log(`CODEXSUN app factory API listening on http://${host}:${port}`));

function readJson(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => { data += chunk; if (data.length > 100_000) reject(new Error("Request body is too large.")); });
    request.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { reject(new Error("Request body must be valid JSON.")); } });
    request.on("error", reject);
  });
}

function send(response, status, payload) { response.statusCode = status; response.end(JSON.stringify(payload)); }
