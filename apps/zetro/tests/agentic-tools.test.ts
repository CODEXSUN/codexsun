/**
 * Tests for Orexso Client and Agentic Tools
 *
 * Run with: npm test or npx tsx --test apps/zetro/tests/agentic-tools.test.ts
 */

import { describe, test, before, after } from "node:test";
import { strictEqual, ok } from "node:assert";
import http, { type AddressInfo } from "node:http";

import {
  OrexsoClient,
  createOrexsoClient,
} from "../src/orexso-client.js";
import {
  AgenticTools,
  createAgenticTools,
} from "../src/agentic-tools.js";

type MockServerState = {
  server: http.Server;
  baseUrl: string;
};

async function readJsonBody(req: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}") as Record<
    string,
    unknown
  >;
}

async function startMockOrexsoServer(): Promise<MockServerState> {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          app: "orexso",
          environment: "test",
          chat_model: "mock-model",
          warmup_ready: true,
          warmup_status: "ready",
          warmup_detail: "mock",
          ide_mode: "standalone",
          qdrant_url: "http://mock-qdrant",
          ollama_url: "http://mock-ollama",
          auth_required: false,
        })
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/auth/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          enabled: false,
          authenticated: true,
          header_name: "X-API-Key",
          notes: [],
        })
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/chat") {
      const body = await readJsonBody(req);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          session_id: body.session_id ?? "mock-session",
          reply: "4",
          activities: [],
          generated_by: "mock-model",
          rollback_actions: [],
        })
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/chat/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(
        'event: metadata\ndata: {"task_id":"mock-task","discovered_files":[],"tool_calls":[],"generated_by":"mock-model","rollback_actions":[]}\n\n'
      );
      res.write('event: chunk\ndata: {"content":"TypeScript "}\n\n');
      res.write('event: chunk\ndata: {"content":"is typed."}\n\n');
      res.write(
        'event: done\ndata: {"task_id":"mock-task","reply":"TypeScript is typed.","activities":[],"generated_by":"mock-model","status":"ok","rollback_actions":[]}\n\n'
      );
      res.end();
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

describe("OrexsoClient", () => {
  let client: OrexsoClient;
  let mock: MockServerState;

  before(async () => {
    mock = await startMockOrexsoServer();
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      mock.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  test("should create a client with default config", () => {
    const defaultClient = createOrexsoClient();
    ok(defaultClient);
  });

  test("should get health status", async () => {
    client = createOrexsoClient({
      baseUrl: mock.baseUrl,
      timeout: 1000,
    });

    const health = await client.getHealth();
    strictEqual(health.status, "ok");
    ok(health.app);
    ok(health.chat_model);
    ok(health.warmup_ready !== undefined);
  });

  test("should get auth status", async () => {
    client = createOrexsoClient({
      baseUrl: mock.baseUrl,
      timeout: 1000,
    });

    const auth = await client.getAuthStatus();
    ok(auth);
    ok(typeof auth.authenticated === "boolean");
    ok(typeof auth.enabled === "boolean");
  });

  test("should handle chat request", async () => {
    client = createOrexsoClient({
      baseUrl: mock.baseUrl,
      timeout: 1000,
    });

    const response = await client.chat({
      message: "What is 2+2?",
      session_id: "test-session-1",
      use_model: false,
      history: [],
    });

    ok(response);
    ok(response.reply);
    strictEqual(response.session_id, "test-session-1");
  });

  test("should stream chat responses", async () => {
    client = createOrexsoClient({
      baseUrl: mock.baseUrl,
      timeout: 1000,
    });

    let receivedDone = false;
    const chunks: string[] = [];

    for await (const event of client.stream({
      message: "Explain TypeScript briefly",
      session_id: "test-session-stream",
      use_model: true,
      history: [],
    })) {
      if (event.type === "chunk") {
        const chunk = event.data as Record<string, string>;
        chunks.push(chunk.content || "");
      }

      if (event.type === "done") {
        receivedDone = true;
        break;
      }
    }

    strictEqual(chunks.join(""), "TypeScript is typed.");
    ok(receivedDone, "Should receive done event");
  });

  test("should handle API errors gracefully", async () => {
    const badClient = createOrexsoClient({
      baseUrl: "http://127.0.0.1:9999",
      timeout: 250,
    });

    try {
      await badClient.getHealth();
      ok(false, "Should have thrown error");
    } catch (error) {
      ok(error instanceof Error);
    }
  });
});

describe("AgenticTools", () => {
  let tools: AgenticTools;
  let mock: MockServerState;

  before(async () => {
    mock = await startMockOrexsoServer();
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      mock.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  test("should create tools with context", () => {
    tools = createAgenticTools(undefined, {
      projectId: "test",
      sessionId: `test-${Date.now()}`,
    });

    ok(tools);
    const context = tools.getContext();
    strictEqual(context.projectId, "test");
    ok(context.sessionId);
  });

  test("should set and get context", () => {
    tools = createAgenticTools(undefined, {
      projectId: "test",
      sessionId: `test-${Date.now()}`,
    });

    tools.setContext({
      activeFile: "src/test.ts",
      selection: "const x = 1;",
    });

    const context = tools.getContext();
    strictEqual(context.activeFile, "src/test.ts");
    strictEqual(context.selection, "const x = 1;");
  });

  test("should create session", () => {
    tools = createAgenticTools(undefined, {
      projectId: "test",
      sessionId: `test-${Date.now()}`,
    });

    const sessionId = "custom-session";
    tools.createSession(sessionId);

    const context = tools.getContext();
    strictEqual(context.sessionId, sessionId);
  });

  test("should perform health check", async () => {
    tools = createAgenticTools(
      createOrexsoClient({
        baseUrl: mock.baseUrl,
        timeout: 1000,
      }),
      {
        projectId: "test",
        sessionId: `test-${Date.now()}`,
      }
    );

    const isHealthy = await tools.healthCheck(1);
    ok(typeof isHealthy === "boolean");
    strictEqual(isHealthy, true);
  });
});

describe("Integration Tests", () => {
  test("should initialize Orexso client with env variables", () => {
    process.env.OREXSO_API_URL = "http://localhost:6005";
    process.env.OREXSO_API_KEY = "test-key";

    const client = createOrexsoClient();
    ok(client);

    delete process.env.OREXSO_API_URL;
    delete process.env.OREXSO_API_KEY;
  });
});

describe("Error Handling", () => {
  test("should handle timeout gracefully", async () => {
    const slowClient = createOrexsoClient({
      baseUrl: "http://127.0.0.1:9999",
      timeout: 1,
    });

    try {
      await slowClient.getHealth();
      ok(false, "Should have thrown timeout error");
    } catch (error) {
      ok(error instanceof Error);
    }
  });
});
