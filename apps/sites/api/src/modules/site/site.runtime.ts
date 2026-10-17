import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AppError } from "@codexsun/framework/errors";
import type { CmsSite } from "./site.types.js";

export type SiteRuntime = { port: number; state: "running"; url: string };
const supported = new Set(["logicx", "ramutex", "tirupurconnect"]);

export class SiteRuntimeService {
  constructor(private readonly options: { dataRoot?: string } = {}) {}
  private readonly processes = new Map<
    string,
    { child: ChildProcess; port: number; runtimeKey: string }
  >();
  private readonly pending = new Map<string, Promise<SiteRuntime>>();

  start(site: CmsSite, tenantId = "local"): Promise<SiteRuntime> {
    validateRuntimeSite(site);
    const key = `${tenantId}:${site.slug}:${site.port}`;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const task = this.launch(site, tenantId).finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return task;
  }

  close() {
    for (const { child } of this.processes.values()) child.kill();
    this.processes.clear();
  }

  private async launch(site: CmsSite, tenantId: string): Promise<SiteRuntime> {
    const runtimeKey = createHash("sha256").update(`${tenantId}:${site.uuid}`).digest("hex");
    const url = `http://127.0.0.1:${site.port}`;
    if (await isSiteReady(url, site.slug, runtimeKey))
      return { port: site.port, state: "running", url };
    const root = findSitesCheckout([realpathSync(import.meta.dirname), process.cwd()]);
    const vite = resolve(root, "node_modules/vite/bin/vite.js");
    const config = resolve(root, "apps/sites/clients/vite.config.ts");
    const existing = this.processes.get(site.slug);
    if (existing) {
      if (existing.port !== site.port || existing.runtimeKey !== runtimeKey)
        throw AppError.conflict("This client is already starting or running on another port.");
      for (let attempt = 0; attempt < 5; attempt++) {
        if (await isSiteReady(url, site.slug, runtimeKey))
          return { port: site.port, state: "running", url };
        await new Promise((done) => setTimeout(done, 250));
      }
      throw AppError.conflict(
        "This client is running but not responding. Try Start again shortly."
      );
    }
    const child = spawn(
      process.execPath,
      [
        "--max-http-header-size=262144",
        "--import",
        "tsx",
        vite,
        "--config",
        config,
        "--mode",
        site.themeKey === "portfolio-standard" ? "portfolio" : site.slug,
        "--host",
        "127.0.0.1",
        "--port",
        String(site.port),
        "--strictPort"
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          CODEXSUN_SITES_CLIENT_SLUG: site.slug,
          CODEXSUN_SITES_CLIENT_UUID: site.uuid,
          CODEXSUN_SITES_RUNTIME_KEY: runtimeKey,
          CODEXSUN_SITES_DATA_DIRECTORY: resolve(
            this.options.dataRoot ||
              process.env.CODEXSUN_SITES_DATA_ROOT ||
              resolve(root, "storage/sites-data"),
            runtimeKey
          )
        },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      }
    );
    this.processes.set(site.slug, { child, port: site.port, runtimeKey });
    let failure = "";
    child.stdout?.resume();
    child.stderr?.on("data", () => {});
    child.on("error", (error) => {
      failure = error.message;
    });
    child.on("exit", () => {
      if (this.processes.get(site.slug)?.child === child) this.processes.delete(site.slug);
    });
    for (let attempt = 0; attempt < 60; attempt++) {
      if (failure || child.exitCode !== null) break;
      if (await isSiteReady(url, site.slug, runtimeKey))
        return { port: site.port, state: "running", url };
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    }
    child.kill();
    this.processes.delete(site.slug);
    throw AppError.conflict(
      `Client could not start on port ${site.port}. Check that the port is free and the client builds.`
    );
  }
}

export function findSitesCheckout(startDirectories: string[]): string {
  for (const start of startDirectories) {
    let candidate = resolve(start);
    while (true) {
      if (
        existsSync(resolve(candidate, "apps/sites/clients/vite.config.ts")) &&
        existsSync(resolve(candidate, "node_modules/vite/bin/vite.js")) &&
        existsSync(resolve(candidate, "package.json"))
      )
        return candidate;
      const parent = dirname(candidate);
      if (parent === candidate) break;
      candidate = parent;
    }
  }
  throw AppError.validation(
    "Cannot locate the Sites checkout with its root Vite dependency. Launch the API from the repository checkout."
  );
}

export function validateRuntimeSite(site: Pick<CmsSite, "slug" | "port" | "status" | "themeKey">) {
  if (
    !/^[a-z0-9][a-z0-9_-]{0,119}$/.test(site.slug) ||
    !(
      site.themeKey === "portfolio-standard" ||
      (supported.has(site.slug) && site.themeKey === `portfolio-${site.slug}`)
    )
  ) {
    throw AppError.validation("This portfolio has no supported local client build.");
  }
  if (site.status !== "active") throw AppError.conflict("Activate the site before starting it.");
  if (!Number.isInteger(site.port) || site.port < 1024 || site.port > 65535) {
    throw AppError.validation("Set a development port between 1024 and 65535.");
  }
}

async function isSiteReady(url: string, slug: string, runtimeKey: string) {
  try {
    const response = await fetch(`${url}/__codexsun_sites_identity`, {
      redirect: "error",
      signal: AbortSignal.timeout(1500)
    });
    if (!response.ok) return false;
    const identity = (await response.json()) as { client?: string; runtimeKey?: string };
    return identity.client === slug && identity.runtimeKey === runtimeKey;
  } catch {
    return false;
  }
}
