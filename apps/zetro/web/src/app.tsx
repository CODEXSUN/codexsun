import { DashboardPage, MdiMain, ThemeProvider } from "@codexsun/ui";
import { useEffect, useState } from "react";
import { loadZetroHealth, type ZetroHealthState } from "./zetro-health.js";

export function App() {
  const [health, setHealth] = useState<ZetroHealthState>({ status: "loading", message: "Checking Zetro runtime." });

  useEffect(() => {
    void loadZetroHealth().then(setHealth);
  }, []);

  return (
    <ThemeProvider>
      <MdiMain menu={["Overview", "Ideas", "Plans"]} status={health.status} title="CODEXSUN Zetro">
        <DashboardPage description={health.message} title="Agentic delivery workspace">
          <p className="text-sm text-muted-foreground">
            Z-1201 connects the standalone runtime. Ideas, plans, task dispatch, and workers start in later reviewed
            tasks.
          </p>
        </DashboardPage>
      </MdiMain>
    </ThemeProvider>
  );
}
