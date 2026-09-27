import { useState } from "react";
import { MainWorkspace } from "@codexsun/ui/layouts/main-workspace";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { request, type GeneratedToken, type Status } from "./api";

export function App() {
  const [token, setToken] = useState("");
  const [connectedToken, setConnectedToken] = useState("");
  const [status, setStatus] = useState<Status>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState("http://127.0.0.1:6411");

  async function act(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    setConnectedToken("");
    setStatus(undefined);
    const result = await request<Status>(token, "/status");
    setStatus(result);
    setConnectedToken(token);
  }

  async function generateToken() {
    const generated = await request<GeneratedToken>("", "/token/generate", {});
    setToken(generated.token);
    setConnectionUrl(generated.url);
    setTokenCopied(false);
    setMessage(`Token generated and activated. Connect CodeLoop to ${generated.url}.`);
    setError("");
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setMessage("Token copied. Keep it private and put it in AGENTCREW_TOKEN.");
  }

  return (
    <MainWorkspace
      applicationId="agentcrew"
      applicationName="AgentCrew"
      workspaceTitle="Local assistant"
      navigation={[]}
      showTopologyTools={false}
      statusLabel={connectedToken ? "API connected · local workspace" : "Disconnected"}
    >
      <main className="crew">
        <header>
          <p className="eyebrow">LOCAL INTELLIGENCE</p>
          <h1>Your work, with context.</h1>
          <p>Qwen reasoning, private notes, and repeatable prompts. You stay in control.</p>
        </header>
        <section aria-label="Connection" className="connection">
          <label>
            Local access token
            <Input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Enter your configured token"
            />
            {token && <span className="token-identification">Starts with {token.slice(0, 8)}… · Active URL: {connectionUrl}</span>}
          </label>
          <div className="connection-actions">
            <Button disabled={busy} variant="outline" onClick={() => void act(generateToken)}>Generate token</Button>
            <Button disabled={busy || !token} variant="outline" onClick={() => void copyToken()}>{tokenCopied ? "Copied" : "Copy token"}</Button>
            <Button disabled={busy || !token} onClick={() => void act(connect)}>
              {connectedToken ? "Check connection" : "Connect"}
            </Button>
          </div>
          {connectedToken && (
            <Button
              variant="outline"
              onClick={() => {
                setConnectedToken("");
                setToken("");
                setStatus(undefined);
              }}
            >
              Disconnect
            </Button>
          )}
          {error && <p role="alert" className="error">{error}</p>}
          {message && <p role="status" className="ok">{message}</p>}
        </section>
        <div className="signals" aria-live="polite">
          <span className={status?.ollama ? "ok" : ""}>
            Ollama: {status ? (status.ollama ? "online" : "offline") : "not checked"}
          </span>
          <span className={status?.qdrant ? "ok" : ""}>
            Qdrant: {status ? (status.qdrant ? "online" : "offline") : "not checked"}
          </span>
          <span>
            {status ? `${status.model}: ${status.modelReady ? "installed" : "needs download"}` : "Model not checked"}
          </span>
          <span>Embeddings: {status?.embeddingsReady ? "installed" : "not ready"}</span>
        </div>
      </main>
    </MainWorkspace>
  );
}
