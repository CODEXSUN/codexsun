import { ContentSection, DashboardPage, MdiMain, ProviderOverviewPage, ThemeProvider } from "@codexsun/ui";
import { platformHealthSchema, platformModulesSchema, type PlatformHealth } from "@codexsun/contracts";
import { useEffect, useState } from "react";
import { HttpIdentitySessionGateway } from "./modules/identity/session/identity-session-gateway";
import { IdentitySessionProvider, useIdentitySession } from "./modules/identity/provider";

const apiUrl = import.meta.env.VITE_PLATFORM_API_URL;
type HealthView = PlatformHealth | { status: string; providers: string[] };
export function App() {
  return (
    <ThemeProvider>
      <IdentitySessionProvider gateway={new HttpIdentitySessionGateway(apiUrl)}>
        <PlatformWorkspace />
      </IdentitySessionProvider>
    </ThemeProvider>
  );
}

function PlatformWorkspace() {
  const [health, setHealth] = useState<HealthView | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const session = useIdentitySession();
  useEffect(() => {
    if (!apiUrl) {
      setHealth({ status: "configuration error", providers: [] });
      return;
    }
    void Promise.all([fetch(`${apiUrl}/api/v1/platform/health`), fetch(`${apiUrl}/api/v1/platform/modules`)])
      .then(async ([healthResponse, modulesResponse]) => {
        if (!healthResponse.ok || !modulesResponse.ok) throw new Error("Platform API is unavailable.");
        setHealth(platformHealthSchema.parse(await healthResponse.json()));
        setModules(platformModulesSchema.parse(await modulesResponse.json()).providers);
      })
      .catch(() => setHealth({ status: "offline", providers: [] }));
  }, []);
  return (
    <MdiMain
      title="CODEXSUN Platform"
      menu={["Workspace", "Apps", "Settings"]}
      status={`${health?.status ?? "loading"} · ${session.state}`}
      rail={<p className="text-sm text-muted-foreground">Platform modules are composed through declared providers.</p>}
    >
      <DashboardPage title="Workspace" description="Provider health and enabled platform capabilities.">
        <ContentSection title="Runtime" description="The active provider engine controls this deployable.">
          <ProviderOverviewPage providerCount={health?.providers.length ?? 0} />
        </ContentSection>
        <ContentSection title="Enabled modules" description="This deployable exposes only selected Platform providers.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <li key={module} className="rounded-md bg-surface-raised px-3 py-2 text-sm">
                {module}
              </li>
            ))}
          </ul>
        </ContentSection>
      </DashboardPage>
    </MdiMain>
  );
}
