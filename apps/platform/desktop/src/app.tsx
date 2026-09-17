import { MdiMain } from "@codexsun/ui";
import { Card, CardContent } from "@codexsun/ui/components/card";
import { LayoutDashboardIcon, MonitorCogIcon } from "lucide-react";
import { platformHealthSchema, type PlatformHealth } from "@codexsun/contracts";
import { useEffect, useState } from "react";
import { readDesktopRuntime, type DesktopRuntime } from "./desktop-runtime";

const apiUrl = import.meta.env.VITE_PLATFORM_DESKTOP_API_URL;

export function App() {
  const [runtime, setRuntime] = useState<DesktopRuntime | null>(null);
  const [health, setHealth] = useState<PlatformHealth | null>(null);

  useEffect(() => {
    void readDesktopRuntime()
      .then(setRuntime)
      .catch(() => setRuntime(null));
    if (!apiUrl) return;
    void fetch(`${apiUrl}/api/v1/platform/health`)
      .then(async (response) => platformHealthSchema.parse(await response.json()))
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <MdiMain
      applicationId="platform-desktop"
      applicationName="CODEXSUN Platform Desktop"
      navigation={[
        {
          items: [
            { active: true, icon: LayoutDashboardIcon, label: "Workspace" },
            { icon: MonitorCogIcon, label: "Native status" },
          ],
        },
      ]}
      primaryAction={null}
      sidebarFooter={<p className="px-2 text-xs text-muted-foreground">Native access stays in narrow Rust commands.</p>}
      statusLabel={health?.status ?? "offline"}
      workspaceTitle="Desktop workspace"
    >
      <section className="size-full overflow-y-auto p-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Desktop workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">A Tauri host that uses public contracts and shared UI.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="text-base font-medium">Native runtime</h2>
              <p className="mt-1 text-sm text-muted-foreground">The desktop command exposes safe runtime metadata only.</p>
              <p className="mt-3 text-sm">{runtime ? `${runtime.platform} · ${runtime.version}` : "Browser preview"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="text-base font-medium">Platform API</h2>
              <p className="mt-1 text-sm text-muted-foreground">The desktop host reads the same public health contract as web.</p>
              <p className="mt-3 text-sm">{health ? `${health.providers.length} providers ready` : "API unavailable"}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </MdiMain>
  );
}
