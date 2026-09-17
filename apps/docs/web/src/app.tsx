import { DashboardPage, MdiMain, ThemeProvider } from "@codexsun/ui";
import { useEffect, useState } from "react";
import { loadDocsHealth, type DocsHealthState } from "./docs-health.js";

const apiUrl = import.meta.env.VITE_DOCS_API_URL;

export function App() {
  const [health, setHealth] = useState<DocsHealthState>({ status: "loading", message: "Checking Docs API." });

  useEffect(() => {
    void loadDocsHealth(apiUrl).then(setHealth);
  }, []);

  return (
    <ThemeProvider>
      <MdiMain menu={["Overview", "Documents", "Graph"]} status={health.status} title="CODEXSUN Docs">
        <DashboardPage description={health.message} title="Documentation workspace">
          <p className="text-sm text-muted-foreground">
            Docs discovery, document rendering, backlinks, and graph navigation start in D-1220 through D-1250.
          </p>
        </DashboardPage>
      </MdiMain>
    </ThemeProvider>
  );
}
