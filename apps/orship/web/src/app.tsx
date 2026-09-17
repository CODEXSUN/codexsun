import { Alert, Badge, Button, Card, DashboardPage, MdiMain, ThemeProvider } from "@codexsun/ui";
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
  return (
    <ThemeProvider>
      <OrshipWorkspace />
    </ThemeProvider>
  );
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
    <MdiMain title="CODEXSUN Orship" menu={["Overview", "Attempts", "Telemetry"]} status={status}>
      <DashboardPage
        title="Orchestration foundation"
        description="Orship will coordinate reviewed changes from preview through live verification."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-sm text-muted-foreground">API status</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={error ? "danger" : health?.status === "ok" ? "success" : "warning"}>{status}</Badge>
              <span className="text-sm text-muted-foreground">{error ?? "Standalone Orship API"}</span>
            </div>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Loaded providers</p>
            <p className="mt-3 text-2xl font-semibold">{health?.providers.length ?? 0}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Platform Core and Orship orchestration are composed here.
            </p>
          </Card>
        </div>
        <Card>
          <p className="text-sm text-muted-foreground">Approval gate</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A required failed check blocks approval before any deployment provider can run.
          </p>
          <Button className="mt-4" onClick={() => void createFailedAttempt()}>
            Record failed verification
          </Button>
          {attempt ? (
            <Alert className="mt-4" variant="danger">
              Attempt {attempt.id} is {attempt.state}. Approval is blocked.
            </Alert>
          ) : null}
        </Card>
      </DashboardPage>
    </MdiMain>
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
