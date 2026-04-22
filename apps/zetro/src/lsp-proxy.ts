import type { IncomingMessage } from "http";
import { spawn } from "child_process";
import { URL } from "url";
import http from "http";
import { resolve } from "path";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { decodeLspMessage, encodeLspMessage } from "./lsp-transport.js";

function safeWorkspaceRoot(rawRoot: string | null) {
  if (!rawRoot || rawRoot === "." || rawRoot === "workspace") {
    return process.cwd();
  }

  return process.cwd();
}

function resolveLanguageServerCommand() {
  return {
    command: process.execPath,
    args: [resolve(process.cwd(), "node_modules", "typescript-language-server", "lib", "cli.mjs"), "--stdio"],
  };
}

function parseWebSocketPayload(payload: RawData) {
  if (typeof payload === "string") {
    return JSON.parse(payload);
  }
  if (Array.isArray(payload)) {
    return JSON.parse(Buffer.concat(payload).toString("utf-8"));
  }
  if (payload instanceof ArrayBuffer) {
    return JSON.parse(Buffer.from(new Uint8Array(payload)).toString("utf-8"));
  }
  return JSON.parse(Buffer.from(payload).toString("utf-8"));
}

export function attachLsp(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url || '', `http://localhost`);
      if (url.pathname === '/lsp') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    const requestUrl = new URL(_req.url || "/lsp", "http://localhost");
    const workspaceRoot = safeWorkspaceRoot(requestUrl.searchParams.get("root"));
    let stdoutBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

    console.log("LSP client connected", { workspaceRoot });
    const languageServer = resolveLanguageServerCommand();
    const child = spawn(languageServer.command, languageServer.args, {
      cwd: workspaceRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });

    child.on("error", (error) => {
      console.error("failed starting lsp server", error);
      try {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method: "window/logMessage",
            params: {
              type: 1,
              message: `Failed to start TypeScript language server: ${String(error)}`,
            },
          }),
        );
      } catch {}
    });

    child.stderr.on("data", (chunk) => {
      console.error("[lsp-server]", chunk.toString());
    });

    child.stdout.on("data", (chunk) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, Buffer.from(chunk)]);

      try {
        while (true) {
          const parsed = decodeLspMessage(stdoutBuffer);
          if (!parsed) {
            break;
          }

          stdoutBuffer = parsed.rest;
          ws.send(JSON.stringify(parsed.message));
        }
      } catch (error) {
        console.warn("failed parsing lsp server output", error);
      }
    });

    ws.on("message", (msg: RawData) => {
      try {
        const payload = parseWebSocketPayload(msg);
        child.stdin.write(encodeLspMessage(payload));
      } catch (error) {
        console.warn("failed writing to lsp server", error);
      }
    });

    ws.on("close", () => {
      try {
        child.kill();
      } catch {}
    });

    child.on("close", (code) => {
      try {
        ws.close(1000, `LSP server exited: ${code ?? "unknown"}`);
      } catch {}
    });
  });

  console.log("LSP proxy attached at /lsp");
}

export default attachLsp;
