import { MdiMain, ThemeProvider, ContentSection, DashboardPage } from "@codexsun/ui";
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
    void fetch(`${apiUrl}/api/v1/platform/health`)
      .then(async (response) => platformHealthSchema.parse(await response.json()))
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <ThemeProvider>
      <MdiMain
        title="CODEXSUN Platform Desktop"
        menu={["Workspace", "Native status"]}
        status={health?.status ?? "offline"}
        rail={<p className="text-sm text-muted-foreground">Native access stays in narrow Rust commands.</p>}
      >
        <DashboardPage title="Desktop workspace" description="A Tauri host that uses public contracts and shared UI.">
          <ContentSection title="Native runtime" description="The desktop command exposes safe runtime metadata only.">
            <p className="text-sm">{runtime ? `${runtime.platform} · ${runtime.version}` : "Browser preview"}</p>
          </ContentSection>
          <ContentSection
            title="Platform API"
            description="The desktop host reads the same public health contract as web."
          >
            <p className="text-sm">{health ? `${health.providers.length} providers ready` : "API unavailable"}</p>
          </ContentSection>
        </DashboardPage>
      </MdiMain>
    </ThemeProvider>
  );
}
