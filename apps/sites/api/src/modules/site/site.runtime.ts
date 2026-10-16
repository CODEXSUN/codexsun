import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AppError } from "@codexsun/framework/errors";
import type { CmsSite } from "./site.types.js";

export type SiteRuntime = { port: number; state: "running"; url: string };
const supported = new Set(["logicx", "ramutex"]);

export class SiteRuntimeService {
  private readonly processes = new Map<string, ChildProcess>();
  private readonly pending = new Map<string, Promise<SiteRuntime>>();

  start(site: CmsSite): Promise<SiteRuntime> {
    validateRuntimeSite(site);
    const key = `${site.slug}:${site.port}`;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const task = this.launch(site).finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return task;
  }

  close() {
    for (const child of this.processes.values()) child.kill();
    this.processes.clear();
  }

  private async launch(site: CmsSite): Promise<SiteRuntime> {
    const url = `http://127.0.0.1:${site.port}`;
    if (await isSiteReady(url, site.slug)) return { port: site.port, state: "running", url };
    const root = findSitesCheckout([realpathSync(import.meta.dirname), process.cwd()]);
    const vite = resolve(root, "node_modules/vite/bin/vite.js");
    const config = resolve(root, "apps/sites/clients/vite.config.ts");
    if (this.processes.has(site.slug)) {
      throw AppError.conflict("This client is already starting or running on another port.");
    }
    const child = spawn(
      process.execPath,
      [
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
        env: { ...process.env, CODEXSUN_SITES_CLIENT_SLUG: site.slug },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      }
    );
    this.processes.set(site.slug, child);
    let failure = "";
    child.stdout?.resume();
    child.stderr?.on("data", () => {});
    child.on("error", (error) => {
      failure = error.message;
    });
    child.on("exit", () => {
      if (this.processes.get(site.slug) === child) this.processes.delete(site.slug);
    });
    for (let attempt = 0; attempt < 60; attempt++) {
      if (failure || child.exitCode !== null) break;
      if (await isSiteReady(url, site.slug)) return { port: site.port, state: "running", url };
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

async function isSiteReady(url: string, slug: string) {
  try {
    const response = await fetch(`${url}/__codexsun_sites_identity`, {
      redirect: "error",
      signal: AbortSignal.timeout(300)
    });
    if (!response.ok) return false;
    const identity = (await response.json()) as { client?: string };
    return identity.client === slug;
  } catch {
    return false;
  }
}
