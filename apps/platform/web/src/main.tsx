import { createRoot } from "react-dom/client";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { loadRuntimeConfig } from "./startup-config";

const root = createRoot(document.getElementById("root") as HTMLElement);
const hasPublicHomeShell = window.location.pathname === "/";

async function start() {
  if (!hasPublicHomeShell) {
    root.render(<GlobalLoader message="Connecting to Platform…" />);
  }
  try {
    const [config, { PlatformWebApp }] = await Promise.all([
      loadRuntimeConfig(),
      import("./app/PlatformWebApp"),
      hasPublicHomeShell ? import("./public/tenant-home") : Promise.resolve()
    ]);
    window.__CODEXSUN_RUNTIME_CONFIG__ = Object.freeze(config);
    root.render(<PlatformWebApp />);
  } catch {
    root.render(
      <main className="simple-page" role="alert">
        <h1>Unable to connect to the application</h1>
        <p>Check that the Platform API is running, then try again.</p>
        <button type="button" onClick={() => void start()}>
          Retry connection
        </button>
      </main>
    );
  }
}

void start();
