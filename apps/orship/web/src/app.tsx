import { MainWorkspace } from "@codexsun/ui";
import { Alert } from "@codexsun/ui/components/alert";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent } from "@codexsun/ui/components/card";
import { ActivityIcon, ClipboardCheckIcon, LayoutDashboardIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface HealthResponse {
  readonly service: string;
  readonly status: "ok" | "degraded";
  readonly providers: readonly { id: string; state: string }[];
}

interface AttemptResponse {
  readonly attempt: { readonly id: string; readonly state: string };
}

const apiUrl = import.meta.env.VITE_ORSHIP_API_URL as string | undefined;

export function App() {
  return <OrshipWorkspace />;
}

function OrshipWorkspace() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptResponse["attempt"] | null>(null);

  useEffect(() => {
    if (!apiUrl) {
      setError("The Orship API URL is not configured.");
      return;
    }

    void fetch(`${apiUrl}/api/v1/orship/health`)
      .then((response) => {
        if (!response.ok) throw new Error("The Orship API health request failed.");
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "The Orship API is offline."));
  }, []);

  const status = error ? "offline" : (health?.status ?? "checking");
  const createFailedAttempt = async () => {
    if (!apiUrl) return;
    const id = `demo-${Date.now()}`;
    try {
      await post<AttemptResponse>("/api/v1/orship/attempts", { id, revision: "3b8a6c1", targetId: "local-preview" });
      const checked = await post<AttemptResponse>(`/api/v1/orship/attempts/${id}/checks`, {
        id: "static-check",
        kind: "static",
        required: true,
        outcome: "failed",
        reference: "npm.cmd:run:check",
        evidenceReference: "evidence/demo-static-check",
        completedAt: new Date().toISOString(),
      });
      setAttempt(checked.attempt);
      setError(null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "The attempt could not be recorded.");
    }
  };

  return (
    <MainWorkspace
      applicationId="orship"
      applicationName="CODEXSUN Orship"
      navigation={[
        {
          items: [
            { active: true, icon: LayoutDashboardIcon, label: "Overview" },
            { icon: ClipboardCheckIcon, label: "Attempts" },
            { icon: ActivityIcon, label: "Telemetry" },
          ],
        },
      ]}
      primaryAction={null}
      statusLabel={status}
      workspaceTitle="Orchestration foundation"
    >
      <section className="size-full overflow-y-auto p-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Orchestration foundation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Orship coordinates reviewed changes from preview through live verification.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">API status</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={error ? "destructive" : health?.status === "ok" ? "secondary" : "outline"}>{status}</Badge>
                <span className="text-sm text-muted-foreground">{error ?? "Standalone Orship API"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Loaded providers</p>
              <p className="mt-3 text-2xl font-semibold">{health?.providers.length ?? 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">Platform Core and Orship orchestration are composed here.</p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Approval gate</p>
            <p className="mt-2 text-sm text-muted-foreground">A required failed check blocks approval before any deployment provider can run.</p>
            <Button className="mt-4" onClick={() => void createFailedAttempt()}>
              Record failed verification
            </Button>
            {attempt ? (
              <Alert className="mt-4" variant="destructive">
                Attempt {attempt.id} is {attempt.state}. Approval is blocked.
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </MainWorkspace>
  );
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!apiUrl) throw new Error("The Orship API URL is not configured.");
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = (await response.json()) as { error?: string };
    throw new Error(result.error ?? "The Orship API rejected the request.");
  }
  return response.json() as Promise<T>;
}
