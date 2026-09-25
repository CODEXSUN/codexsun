import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { createServer } from "node:http";
import test from "node:test";
import { chromium } from "playwright";
import { createApp } from "../../api/src/app.js";
import { readConfig } from "../../api/src/config.js";
import { AssistantRepository } from "../../api/src/modules/assistant/repository.js";
import { Upstreams } from "../../api/src/modules/assistant/upstreams.js";
import { Retrieval } from "../../api/src/modules/assistant/retrieval.js";
import { AssistantService } from "../../api/src/modules/assistant/service.js";

test(
  "dashboard connects, runs a task, indexes a note and approves a schedule",
  { timeout: 120000 },
  async (context) => {
    context.diagnostic("Starting dashboard integration fixture");
    const root = resolve(import.meta.dirname, "../../../..");
    const config = readConfig({ AGENTCREW_TOKEN: "test-only-token-not-a-real-secret-0000" });
    const transport = (async (url: URL | RequestInfo) => {
      const path = String(url);
      if (path.endsWith("/api/tags"))
        return Response.json({ models: [{ name: "qwen3:4b" }, { name: "nomic-embed-text:latest" }] });
      if (path.endsWith("/api/chat"))
        return Response.json({ message: { content: "Review session expiry and add a regression test." } });
      if (path.endsWith("/api/embed")) return Response.json({ embeddings: [[0.1, 0.2, 0.3]] });
      return Response.json({ result: { points: [] } });
    }) as typeof fetch;
    const repository = new AssistantRepository(":memory:");
    const upstream = new Upstreams(config, transport);
    const service = new AssistantService(repository, upstream, new Retrieval(upstream));
    const api = createApp(config, service);
    const address = await api.listen({ host: "127.0.0.1", port: 0 });
    context.diagnostic("API ready");
    const web = createServer(async (req, res) => {
      try {
        if (req.url?.startsWith("/api/")) {
          const parts: Buffer[] = [];
          for await (const part of req) parts.push(Buffer.from(part));
          const response = await fetch(`${address}${req.url}`, {
            method: req.method,
            headers: { authorization: req.headers.authorization ?? "", "content-type": "application/json" },
            ...(parts.length ? { body: Buffer.concat(parts) } : {}),
          });
          res.writeHead(response.status, { "content-type": "application/json" });
          res.end(await response.text());
          return;
        }
        const path = req.url?.startsWith("/assets/") ? req.url.split("?")[0] : "/index.html";
        if (path.includes("..")) {
          res.writeHead(400);
          res.end();
          return;
        }
        const file = await readFile(resolve(root, `dist/devkits/agentcrew/web${path}`));
        res.setHeader(
          "content-type",
          extname(path) === ".js" ? "text/javascript" : extname(path) === ".css" ? "text/css" : "text/html",
        );
        res.end(file);
      } catch {
        res.writeHead(500);
        res.end();
      }
    });
    await new Promise<void>((resolve) => web.listen(0, "127.0.0.1", resolve));
    const webAddress = web.address() as { port: number };
    const browser = await chromium.launch({ headless: true });
    const errors: string[] = [];
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${webAddress.port}`);
      await page.waitForTimeout(1000);
      assert.deepEqual(errors, [], "Dashboard must render without browser exceptions");
      await page.getByLabel("Local access token").fill(config.AGENTCREW_TOKEN);
      await page.getByRole("button", { name: "Connect", exact: true }).click();
      await page.getByText("Ollama: online").waitFor();
      await page.getByLabel("Task title", { exact: true }).fill("Review login");
      await page.getByLabel("Prompt", { exact: true }).fill("Suggest a test for login expiration.");
      await page.getByRole("button", { name: "Send task", exact: true }).click();
      await page.getByText("Review session expiry and add a regression test.", { exact: true }).waitFor();
      await page.getByLabel("Note title").fill("Login policy");
      await page.getByLabel("Approved context").fill("Sessions last one day.");
      await page.getByRole("button", { name: "Index note" }).click();
      await page.getByText("Indexed 1 chunks.").waitFor();
      await page.getByLabel("Task title", { exact: true }).fill("Daily plan");
      await page.getByLabel("Prompt", { exact: true }).fill("Organize today's priorities.");
      await page.getByLabel("Repeat every 30 minutes, four runs").check();
      await page.getByRole("button", { name: "Save paused schedule" }).click();
      await page.getByRole("button", { name: "Enable schedule" }).click();
      await page.getByText("Schedule enabled within its run budget.").waitFor();
      await mkdir(resolve(root, "dist/agentcrew/verification"), { recursive: true });
      await page.getByRole("heading", { name: "Your work, with context." }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(root, "dist/agentcrew/verification/desktop.png"), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("heading", { name: "Your work, with context." }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(root, "dist/agentcrew/verification/mobile.png"), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      assert.deepEqual(errors, []);
      await page.getByRole("button", { name: "Disconnect", exact: true }).click();
      await page.getByText("No tasks yet. Connect and send your first prompt.").waitFor();
    } finally {
      await browser.close();
      web.closeAllConnections();
      await new Promise<void>((resolve) => web.close(() => resolve()));
      await service.close();
      await api.close();
      repository.close();
    }
  },
);
