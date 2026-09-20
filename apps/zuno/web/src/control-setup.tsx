import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import type { Connection, ControlClient, Overview, Server } from "./control-api";

export function ServerSetup({ api, onSaved, server }: { api: ControlClient; onSaved: () => void; server?: Server }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="grid gap-3 border-b py-4 sm:grid-cols-3" onSubmit={async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError("");
    const credential = String(data.get("credential"));
    (form.elements.namedItem("credential") as HTMLInputElement).value = "";
    try { await api(server ? `/${server.id}` : "", { name: data.get("name"), apiUrl: data.get("apiUrl"), credential }, server ? "PUT" : "POST"); form.reset(); onSaved(); }
    catch (err) { setError(String(err instanceof Error ? err.message : err)); } finally { setBusy(false); }
  }}>
    <Field label="Server display name"><Input defaultValue={server?.name} name="name" required maxLength={120} /></Field>
    <Field label="API URL"><Input defaultValue={server?.apiUrl} name="apiUrl" type="url" required placeholder="http://localhost:6400" /></Field>
    <Field label="Server credential"><Input name="credential" type="password" autoComplete="new-password" required minLength={16} /></Field>
    <Button disabled={busy} type="submit">{busy ? "Saving..." : server ? "Update connection" : "Register server"}</Button>
    {error && <p role="alert" className="break-words text-sm text-destructive sm:col-span-3">{error}</p>}
  </form>;
}

export function RepositorySetup({ api, serverId, overview, refresh }: { api: ControlClient; serverId: string; overview: Overview; refresh: () => void }) {
  const [connectionId, setConnectionId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const prefix = `/${serverId}`;
  async function run(work: () => Promise<unknown>, success: string) {
    setBusy(true); setMessage("Connecting to CXForge...");
    try { const result = await work(); setMessage(`${success}${result ? ` ${JSON.stringify(result)}` : ""}`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Repository operation failed."); }
    finally { setBusy(false); refresh(); }
  }
  return <section className="space-y-5">
    <h2 className="text-lg font-semibold">Repositories</h2>
    {message && <p role="status" className="break-words text-sm">{message}</p>}
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
      const token = String(data.get("token")); (form.elements.namedItem("token") as HTMLInputElement).value = "";
      void run(async () => { const saved = await api<Connection>(`${prefix}/git-connections`, { name: data.get("name"), provider: data.get("provider"), username: data.get("username"), token, repositoryPatterns: String(data.get("allowlist")).split(/\r?\n/u).map((value) => value.trim()).filter(Boolean), permissions: { clone: data.has("clone"), pull: data.has("pull"), push: data.has("push") } }); setConnectionId(saved.id); }, "Git connection saved on CXForge.");
    }}>
      <Field label="Git connection name"><Input name="name" required /></Field>
      <Field label="Git provider"><select name="provider" className="h-9 rounded-md border bg-background px-2"><option value="github">GitHub</option><option value="gitlab">GitLab</option><option value="bitbucket">Bitbucket</option><option value="generic">Other HTTPS provider</option></select></Field>
      <Field label="Git username"><Input name="username" /></Field>
      <Field label="Git token"><Input name="token" type="password" autoComplete="new-password" required /></Field>
      <Field label="Repository allowlist (one pattern per line)"><textarea className="min-h-20 rounded-md border p-2" name="allowlist" required /></Field>
      <fieldset className="flex flex-wrap items-center gap-4"><legend>Permissions</legend>{["clone", "pull", "push"].map((name) => <label key={name} className="flex items-center gap-2"><input type="checkbox" name={name} defaultChecked={name !== "push"} />{name}</label>)}</fieldset>
      <Button disabled={busy || !overview.credentialEncryptionConfigured} type="submit">Save Git connection</Button>
      {!overview.credentialEncryptionConfigured && <p role="status" className="text-sm">CXForge credential encryption requires configuration.</p>}
    </form>
    <form className="grid gap-3 border-t pt-5 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      void run(() => api(`${prefix}/repositories`, { name: data.get("appName"), repository: data.get("repository"), defaultBranch: data.get("branch"), gitConnectionId: connectionId }), "Repository registration complete.");
    }}>
      <Field label="Application name"><Input name="appName" required /></Field>
      <Field label="Repository HTTPS URL"><Input name="repository" type="url" required pattern="https://.*" /></Field>
      <Field label="Default branch"><Input name="branch" required defaultValue="main" /></Field>
      <Field label="Git connection"><select required className="h-9 min-w-0 rounded-md border bg-background px-2" value={connectionId} onChange={(event) => setConnectionId(event.target.value)}><option value="">Select connection</option>{overview.gitConnections.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
      <Button type="submit" disabled={busy || !connectionId}>Register repository</Button>
    </form>
    <div className="divide-y border-y">{overview.repositories.map((item) => <article key={item.id} className="space-y-2 py-4">
      <h3 className="font-medium">{item.name} <span className="text-sm text-muted-foreground">{item.mirrorStatus}</span></h3>
      <p className="break-all text-sm">{item.repository} · {item.defaultBranch}</p><p className="break-all font-mono text-xs">{item.commitSha ?? "Commit not fetched"}</p>
      <div className="flex flex-wrap gap-2"><Button disabled={busy} variant="outline" onClick={() => void run(() => api(`${prefix}/repositories/${item.id}/sync`, {}), "Mirror refreshed.")}>Sync mirror</Button>
        <Button disabled={busy} variant="outline" onClick={() => void run(() => api(`${prefix}/git-connections/${item.gitConnectionId}/verify`, { repository: item.repository, operation: "pull" }), "Read verification complete.")}>Verify read access</Button>
        <Button disabled={busy || !overview.controlCapabilities.includes("remote-write-verification-v1")} variant="outline" onClick={() => { if (window.confirm("Create and delete a temporary remote branch to verify write access?")) void run(() => api(`${prefix}/git-connections/${item.gitConnectionId}/verify`, { repository: item.repository, operation: "push", confirmed: true }), "Write verification result:"); }}>Verify remote write</Button></div>
    </article>)}</div>
    {!overview.controlCapabilities.includes("remote-write-verification-v1") && <p className="text-sm text-muted-foreground">Remote write verification is unavailable on this CXForge version.</p>}
  </section>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1 text-sm"><span>{label}</span>{children}</label>;
}
