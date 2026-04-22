import { promises as fs } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import http from "http";
import { createOrexsoClient } from "./orexso-client.js";
import { attachLsp } from "./lsp-proxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ZETRO_ROOT = resolve(__dirname, "..");
const WORKSPACE_ROOT = resolve(ZETRO_ROOT, "..", "..");
const AI_ROOT = join(ZETRO_ROOT, ".ai");
const MONACO_ROOT = resolve(WORKSPACE_ROOT, "node_modules", "monaco-editor", "min");

function safeResolve(p: string) {
  if (!p) p = ".";
  // Allow special token "workspace" to browse root
  if (p === "workspace" || p === "/workspace") return WORKSPACE_ROOT;
  if (p.startsWith("workspace/")) return resolve(WORKSPACE_ROOT, p.slice("workspace/".length));
  const resolved = resolve(ZETRO_ROOT, p);
  if (resolved.startsWith(ZETRO_ROOT) || resolved.startsWith(WORKSPACE_ROOT)) return resolved;
  throw new Error("Invalid path");
}

function contentTypeFor(file: string) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  return "text/plain; charset=utf-8";
}

async function handleApiFiles(url: URL, res: http.ServerResponse) {
  const base = url.searchParams.get("base") || ".";
  try {
    const dir = safeResolve(base);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: joinBase(base, e.name),
      fullPath: resolve(dir, e.name),
    }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ base, fullPath: dir, files }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

async function handleApiFile(url: URL, res: http.ServerResponse) {
  const p = url.searchParams.get("path");
  if (!p) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "missing path" }));
    return;
  }
  try {
    const full = safeResolve(p);
    const content = await fs.readFile(full, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ path: p, fullPath: full, content }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

function joinBase(base: string, name: string) {
  if (!base || base === ".") {
    return name;
  }
  return `${base.replace(/\/$/, "")}/${name}`;
}

async function collectFileMatches(
  currentDir: string,
  rootDir: string,
  base: string,
  query: string,
  matches: Array<{ path: string; fullPath: string; name: string }>,
  limit: number,
) {
  if (matches.length >= limit) {
    return;
  }

  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (matches.length >= limit) {
      return;
    }

    const fullPath = resolve(currentDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "build") {
        continue;
      }
      await collectFileMatches(fullPath, rootDir, base, query, matches, limit);
      continue;
    }

    if (!entry.name.toLowerCase().includes(query)) {
      continue;
    }

    const relative = fullPath.slice(rootDir.length).replace(/^[\\/]+/, "").replace(/\\/g, "/");
    matches.push({
      path: joinBase(base, relative || basename(fullPath)),
      fullPath,
      name: entry.name,
    });
  }
}

async function handleApiSearchFiles(url: URL, res: http.ServerResponse) {
  const base = url.searchParams.get("base") || "workspace";
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || "60"), 200);

  if (!query) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ base, files: [] }));
    return;
  }

  try {
    const rootDir = safeResolve(base);
    const files: Array<{ path: string; fullPath: string; name: string }> = [];
    await collectFileMatches(rootDir, rootDir, base, query, files, limit);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ base, fullPath: rootDir, files }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

async function handleApiFileWrite(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk as Uint8Array);
    const body = Buffer.concat(chunks).toString("utf-8");
    // Log raw request body to help diagnose parsing issues
    console.log("PUT /api/file raw body:", body && body.length ? (body.length > 1000 ? body.slice(0, 1000) + '...[truncated]' : body) : '<empty>');
    let parsed: any = {};
    try {
      parsed = JSON.parse(body || "{}");
    } catch (parseErr) {
      console.error("Failed to parse JSON body for /api/file:", parseErr, "raw:", body);
      // Try a tolerant fallback parser for bodies that look like {key:val, key2:val2}
      try {
        const raw = (body || "").trim();
        if (raw.startsWith("{") && raw.endsWith("}")) {
          const inner = raw.slice(1, -1);
          const obj: any = {};
          // Split on commas not inside quotes (simple split, acceptable for basic cases)
          const parts = inner.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g);
          for (const part of parts) {
            const idx = part.indexOf(":");
            if (idx === -1) continue;
            let k = part.slice(0, idx).trim();
            let v = part.slice(idx + 1).trim();
            if (k.startsWith('"') && k.endsWith('"')) k = k.slice(1, -1);
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            // remove possible surrounding braces/spaces
            k = k.replace(/^['\"]+|['\"]+$/g, "");
            v = v.replace(/^['\"]+|['\"]+$/g, "");
            obj[k] = v;
          }
          parsed = obj;
          console.log("PUT /api/file parsed with tolerant fallback:", parsed);
        } else {
          throw parseErr;
        }
      } catch (fallbackErr) {
        console.error("Fallback parsing also failed:", fallbackErr);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid json", detail: String(parseErr) }));
        return;
      }
    }
    const { path, content } = parsed;
    if (!path || typeof content !== "string") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "missing path or content" }));
      return;
    }

    const full = safeResolve(path);
    // Ensure parent directories exist
    await fs.mkdir(dirname(full), { recursive: true }).catch(() => {});
    await fs.writeFile(full, content, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ path, fullPath: full, written: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

async function handleApiChat(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk as Uint8Array);
    const body = Buffer.concat(chunks).toString("utf-8");
    const { message } = JSON.parse(body || "{}");
    if (!message) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "missing message" }));
      return;
    }

    await fs.mkdir(join(AI_ROOT, "memory"), { recursive: true }).catch(() => {});
    const historyPath = join(AI_ROOT, "memory", "chat-history.json");
    let history: any[] = [];
    try {
      const raw = await fs.readFile(historyPath, "utf-8");
      history = JSON.parse(raw);
    } catch {}
    history.push({ role: "user", text: message, ts: new Date().toISOString() });

    // Forward to Orexso using the client ChatRequest format
    try {
      const client = createOrexsoClient();
      // quick health check
      try {
        const health = await client.getHealth();
        if (!health || !health.warmup_ready) {
          // proceed but note that model may not be warm
          console.warn("Orexso health check: model not warm or unavailable", health);
        }
      } catch (hErr) {
        console.warn("Orexso health check failed:", hErr);
      }

      // Try non-streaming chat first
      let replyText: string | null = null;
      try {
        const response = await client.chat({ message, history: [{ role: "user", content: message }] });
        replyText = (response as any).reply || (response as any).reply_text || (response as any).text || null;
      } catch (chatErr) {
        console.warn("Orexso chat() failed, will try streaming:", chatErr);
      }

      // If no reply from chat(), try streaming endpoint
      if (!replyText) {
        try {
          let acc = "";
          for await (const ev of client.stream({ message, history: [{ role: "user", content: message }] })) {
            if (ev.type === "chunk") {
              const chunk = (ev.data as any).chunk || (ev.data as any).text || "";
              acc += chunk;
            }
            if (ev.type === "done") {
              const done = ev.data as any;
              acc += done.reply || "";
              break;
            }
            if (ev.type === "error") {
              console.warn("Stream error event:", ev.data);
            }
          }
          replyText = acc || null;
        } catch (streamErr) {
          console.warn("Orexso stream() failed:", streamErr);
        }
      }

      if (!replyText) {
        throw new Error("No reply from Orexso");
      }

      const bot = { role: "assistant", text: replyText, ts: new Date().toISOString() };
      history.push(bot);
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2), "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(bot));
    } catch (err) {
      console.error("Chat forwarding error:", err);
      const bot = { role: "assistant", text: `Echo: ${message}`, ts: new Date().toISOString() };
      history.push(bot);
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2), "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(bot));
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || "", `http://localhost`);
  let pathname = decodeURIComponent(url.pathname || "/");
  if (pathname.startsWith("/vendor/monaco/")) {
    const filePath = join(MONACO_ROOT, pathname.replace("/vendor/monaco/", ""));
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  const filePath = join(ZETRO_ROOT, "web", pathname.replace(/^\//, ""));
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const PORT = process.env.ZETRO_PORT ? Number(process.env.ZETRO_PORT) : 4211;
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "", `http://localhost`);
    if (url.pathname === "/api/files" && req.method === "GET") return await handleApiFiles(url, res);
    if (url.pathname === "/api/search-files" && req.method === "GET") return await handleApiSearchFiles(url, res);
    if (url.pathname === "/api/file" && req.method === "GET") return await handleApiFile(url, res);
    if (url.pathname === "/api/chat" && req.method === "POST") return await handleApiChat(req, res);
    if (url.pathname === "/api/file" && req.method === "PUT") return await handleApiFileWrite(req, res);
    return await serveStatic(req, res);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
});

// attach LSP websocket proxy
try {
  attachLsp(server);
} catch (e) {
  console.warn('Failed to attach LSP proxy', e);
}

server.listen(PORT, () => console.log(`Zetro web server running on http://localhost:${PORT}`));

export default server;
