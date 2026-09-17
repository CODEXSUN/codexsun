import { MdiMain, ProviderOverviewPage, ThemeProvider } from "@codexsun/ui";
import { useEffect, useState } from "react";
import { HttpIdentitySessionGateway } from "./modules/identity/session/identity-session-gateway";
import { IdentitySessionProvider, useIdentitySession } from "./modules/identity/provider";

interface Health {
  status: string;
  providers: string[];
}
const apiUrl = import.meta.env.VITE_PLATFORM_API_URL;
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
  const [health, setHealth] = useState<Health | null>(null);
  const session = useIdentitySession();
  useEffect(() => {
    if (!apiUrl) {
      setHealth({ status: "configuration error", providers: [] });
      return;
    }
    void fetch(`${apiUrl}/api/v1/platform/health`)
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "offline", providers: [] }));
  }, []);
  return (
    <MdiMain
      title="CODEXSUN Platform"
      menu={["Workspace", "Apps", "Settings"]}
      status={`${health?.status ?? "loading"} · ${session.state}`}
    >
      <ProviderOverviewPage providerCount={health?.providers.length ?? 0} />
    </MdiMain>
  );
}
