import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import type { FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";

export class EcommerceStorefrontRuntime {
  private child: ChildProcess | undefined;
  private startedAt = 0;

  async status(cookie?: string) {
    const port = Number(process.env.CODEXSUN_ECOMMERCE_WEB_PORT);
    const available =
      process.env.NODE_ENV !== "production" && Number.isInteger(port) && port > 0 && port <= 65535;
    if (!available) return { state: "unavailable" as const, port: null };
    try {
      const response = await fetch(`http://127.0.0.1:${port}/__codexsun_ecommerce_identity`, {
        headers: cookie ? { Cookie: cookie } : {},
        redirect: "error",
        signal: AbortSignal.timeout(1000)
      });
      if (response.status === 431) return { state: "unhealthy" as const, port };
      const body = response.ok ? await response.json() : null;
      if (body?.app === "ecommerce-storefront") {
        const checks = await Promise.all(
          [
            "/shop",
            "/api/platform/storefront/branding",
            "/api/platform/storefront/catalog?limit=1"
          ].map(async (path) => {
            try {
              const result = await fetch(`http://127.0.0.1:${port}${path}`, {
                headers: cookie ? { Cookie: cookie } : {},
                redirect: "error",
                signal: AbortSignal.timeout(4000)
              });
              if (!result.ok) return false;
              if (path === "/shop")
                return (
                  (result.headers.get("content-type") ?? "").includes("text/html") &&
                  (await result.text()).includes('id="root"')
                );
              const payload = await result.json();
              return (
                payload.success === true &&
                (path.includes("/branding")
                  ? typeof payload.data?.brandName === "string"
                  : Array.isArray(payload.data))
              );
            } catch {
              return false;
            }
          })
        );
        return {
          state: checks.every(Boolean) ? ("running" as const) : ("unhealthy" as const),
          port
        };
      }
    } catch {
      // A stopped server cannot answer the identity probe.
    }
    if (this.child && Date.now() - this.startedAt > 30_000) this.close();
    return { state: this.child ? ("starting" as const) : ("stopped" as const), port };
  }

  async start(request: FastifyRequest) {
    assertLocalStorefrontControl(request);
    const status = await this.status(request.headers.cookie);
    if (status.state === "unavailable")
      throw AppError.conflict("Storefront start requires a configured local development server.");
    if (status.state !== "stopped") return status;
    const root = resolve(realpathSync(import.meta.dirname), "../../../../../..");
    const vite = resolve(root, "node_modules/vite/bin/vite.js");
    const directory = resolve(root, "apps/ecommerce/storefront");
    if (!existsSync(vite) || !existsSync(resolve(directory, "vite.config.ts"))) {
      throw AppError.conflict(
        "Storefront start requires the source checkout and development dependencies."
      );
    }
    // Recheck after the asynchronous probe so simultaneous requests cannot launch duplicates.
    if (this.child) return { ...status, state: "starting" as const };
    const child = spawn(process.execPath, ["--max-http-header-size=65536", vite, "--strictPort"], {
      cwd: directory,
      env: { ...process.env },
      shell: false,
      stdio: "ignore",
      windowsHide: true
    });
    this.child = child;
    this.startedAt = Date.now();
    const clear = () => {
      if (this.child === child) this.child = undefined;
    };
    child.on("error", clear);
    child.on("exit", clear);
    return { ...status, state: "starting" as const };
  }

  close() {
    this.child?.kill();
    this.child = undefined;
  }
}

export function assertLocalStorefrontControl(request: Pick<FastifyRequest, "hostname" | "raw">) {
  const loopback = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost", "[::1]"]);
  if (
    process.env.NODE_ENV === "production" ||
    !loopback.has(request.hostname) ||
    !loopback.has(request.raw.socket.remoteAddress ?? "")
  ) {
    throw AppError.forbidden("Storefront runtime controls require a local development session.");
  }
}
