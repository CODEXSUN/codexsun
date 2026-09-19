import { MainWorkspace } from "@codexsun/ui";
import { Card, CardContent } from "@codexsun/ui/components/card";
import { BlocksIcon, LayoutDashboardIcon, SettingsIcon } from "lucide-react";
import { useMemo } from "react";
import { HttpIdentitySessionGateway } from "./modules/identity/session/identity-session-gateway";
import { IdentitySessionProvider, useIdentitySession } from "./modules/identity/provider";
import { getPlatformApiUrl, PlatformApiError } from "./lib/platform-client";
import { usePlatformHealth, usePlatformModules } from "./hooks/use-platform";

export function App() {
  const apiUrl = usePlatformApiUrl();
  return (
    <IdentitySessionProvider gateway={new HttpIdentitySessionGateway(apiUrl ?? "")}>
      <PlatformWorkspace apiUrl={apiUrl} />
    </IdentitySessionProvider>
  );
}

function PlatformWorkspace({ apiUrl }: { apiUrl: string | undefined }) {
  const session = useIdentitySession();
  const health = usePlatformHealth(apiUrl, session.fetch);
  const modules = usePlatformModules(apiUrl, session.fetch);
  const state = platformState(apiUrl, health, modules);

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
      sidebarFooter={
        <p className="px-2 text-xs text-muted-foreground">Platform modules are composed through declared providers.</p>
      }
      statusLabel={`${state.status} · ${session.state}`}
      workspaceTitle="Platform workspace"
    >
      <PlatformDashboard providers={health.data?.providers ?? []} modules={modules.data?.providers ?? []} state={state} />
    </MainWorkspace>
  );
}

function PlatformDashboard({ providers, modules, state }: { providers: string[]; modules: string[]; state: PlatformState }) {
  return (
    <section className="size-full overflow-y-auto p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Provider health and enabled platform capabilities.</p>
      </header>
      <section aria-labelledby="platform-runtime-heading">
        <h2 className="text-base font-medium" id="platform-runtime-heading">
          Runtime
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">The active provider engine controls this deployable.</p>
        <Card className="mt-3">
          <CardContent>
            <p className="text-2xl font-semibold">{providers.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
          </CardContent>
        </Card>
      </section>
      <section className="mt-6" aria-labelledby="platform-modules-heading">
        <h2 className="text-base font-medium" id="platform-modules-heading">
          Enabled modules
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">This deployable exposes only selected Platform providers.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {modules.map((module) => (
            <li key={module} className="rounded-md bg-surface-raised px-3 py-2 text-sm">
              {module}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

interface PlatformState {
  readonly message: string;
  readonly status: string;
}

function usePlatformApiUrl(): string | undefined {
  return useMemo(() => {
    try {
      return getPlatformApiUrl();
    } catch (error) {
      if (error instanceof PlatformApiError) return undefined;
      throw error;
    }
  }, []);
}

function platformState(
  apiUrl: string | undefined,
  health: ReturnType<typeof usePlatformHealth>,
  modules: ReturnType<typeof usePlatformModules>,
): PlatformState {
  if (!apiUrl) return { status: "configuration error", message: "Set VITE_PLATFORM_API_URL to connect the workspace." };
  if (health.isPending || modules.isPending) return { status: "loading", message: "Loading provider state…" };
  if (health.isError || modules.isError) return { status: "offline", message: "Platform API is unavailable." };
  if (!health.data?.providers.length) return { status: health.data?.status ?? "ok", message: "No providers are enabled." };
  return { status: health.data.status, message: "Providers ready" };
}
