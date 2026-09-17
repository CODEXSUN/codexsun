import { MdiMain, ProviderOverviewPage } from "@codexsun/ui";
import { useEffect, useState } from "react";

interface Health {
  status: string;
  providers: string[];
}
const apiUrl = import.meta.env.VITE_PLATFORM_API_URL;
export function App() {
  const [health, setHealth] = useState<Health | null>(null);
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
    <MdiMain title="CODEXSUN Platform" menu={["Workspace", "Apps", "Settings"]} status={health?.status ?? "loading"}>
      <ProviderOverviewPage providerCount={health?.providers.length ?? 0} />
    </MdiMain>
  );
}
