import { MainWorkspace } from "@codexsun/ui";
import { Card, CardContent } from "@codexsun/ui/components/card";
import { BlocksIcon, LayoutDashboardIcon, SettingsIcon } from "lucide-react";
import { platformHealthSchema, platformModulesSchema, type PlatformHealth } from "@codexsun/contracts";
import { useEffect, useState } from "react";
import { HttpIdentitySessionGateway } from "./modules/identity/session/identity-session-gateway";
import { IdentitySessionProvider, useIdentitySession } from "./modules/identity/provider";

const apiUrl = import.meta.env.VITE_PLATFORM_API_URL;
type HealthView = PlatformHealth | { status: string; providers: string[] };

export function App() {
  return (
    <IdentitySessionProvider gateway={new HttpIdentitySessionGateway(apiUrl)}>
      <PlatformWorkspace />
    </IdentitySessionProvider>
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
    <MainWorkspace
      applicationId="platform"
      applicationName="CODEXSUN Platform"
      navigation={[
        {
          items: [
            { active: true, icon: LayoutDashboardIcon, label: "Workspace" },
            { icon: BlocksIcon, label: "Apps" },
            { icon: SettingsIcon, label: "Settings" },
          ],
        },
      ]}
      primaryAction={null}
      sidebarFooter={<p className="px-2 text-xs text-muted-foreground">Platform modules are composed through declared providers.</p>}
      statusLabel={`${health?.status ?? "loading"} · ${session.state}`}
      workspaceTitle="Platform workspace"
    >
      <section className="size-full overflow-y-auto p-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Provider health and enabled platform capabilities.</p>
        </header>
        <section aria-labelledby="platform-runtime-heading">
          <h2 className="text-base font-medium" id="platform-runtime-heading">Runtime</h2>
          <p className="mt-1 text-sm text-muted-foreground">The active provider engine controls this deployable.</p>
          <Card className="mt-3">
            <CardContent>
              <p className="text-2xl font-semibold">{health?.providers.length ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">Providers ready</p>
            </CardContent>
          </Card>
        </section>
        <section className="mt-6" aria-labelledby="platform-modules-heading">
          <h2 className="text-base font-medium" id="platform-modules-heading">Enabled modules</h2>
          <p className="mt-1 text-sm text-muted-foreground">This deployable exposes only selected Platform providers.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <li key={module} className="rounded-md bg-surface-raised px-3 py-2 text-sm">{module}</li>
            ))}
          </ul>
        </section>
      </section>
    </MainWorkspace>
  );
}
