import { loadRuntimeConfig } from "./startup-config";

const hasPublicHomeShell = window.location.pathname === "/";
const renderer = import("./startup-renderer");

async function start() {
  if (!hasPublicHomeShell) void renderer.then(({ showConnecting }) => showConnecting());
  try {
    const [config, { PlatformWebApp }, { showApplication }] = await Promise.all([
      loadRuntimeConfig(),
      import("./app/PlatformWebApp"),
      renderer,
      hasPublicHomeShell ? import("./public/tenant-home") : Promise.resolve()
    ]);
    window.__CODEXSUN_RUNTIME_CONFIG__ = Object.freeze(config);
    showApplication(PlatformWebApp);
  } catch {
    const { showConnectionError } = await renderer;
    showConnectionError(() => void start());
  }
}

void start();
