import { useMemo, useState } from "react";
import { ArrowLeftIcon, BracesIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";

export interface WorkspaceProvisionInput {
  requestId: string;
  name: string;
  setup: {
    requestId: string;
    title: string;
    approved: true;
    directory: string;
    repository: { name: string; repository: string; defaultBranch: string };
    environment: Record<string, string>;
    databaseDriver: "sqlite" | "mariadb" | "none";
    sqlitePath?: string;
    install: CommandStep;
    migrationStatus?: CommandStep;
    migrate?: CommandStep;
    migrationVerify?: CommandStep;
    previewCommand: string;
  };
}
export interface WorkspaceProfile {
  id: string; name: string; repositoryName: string; repositoryUrl: string; defaultBranch: string; directory: string;
  databaseDriver: "sqlite" | "mariadb" | "none"; sqlitePath?: string; installCommand: string; migrationStatusCommand: string;
  migrateCommand: string; migrationVerifyCommand: string; previewCommand: string; savedAt: string;
}
export type WorkspaceProfileInput = Omit<WorkspaceProfile, "id" | "savedAt">;

interface CommandStep { argv: string[]; directory: string; timeoutSeconds: number; }

interface WorkspaceCreatePageProps {
  busy: boolean;
  error: string;
  onBack: () => void;
  onCreate: (input: WorkspaceProvisionInput) => Promise<void>;
  onSaveProfile: (input: WorkspaceProfileInput) => Promise<WorkspaceProfile>;
  profiles: WorkspaceProfile[];
}

export function WorkspaceCreatePage({ busy, error, onBack, onCreate, onSaveProfile, profiles }: WorkspaceCreatePageProps) {
  const [form, setForm] = useState(defaultForm);
  const [environmentText, setEnvironmentText] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [requestIds] = useState(() => ({ provision: crypto.randomUUID(), setup: crypto.randomUUID() }));
  const input = useMemo(() => buildProvisionInput(form, environmentText, requestIds), [form, environmentText, requestIds]);
  const update = <Key extends keyof WorkspaceForm>(key: Key, value: WorkspaceForm[Key]) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await onCreate(input);
  }
  async function saveProfile() {
    const profile = await onSaveProfile({ ...profileInput(form), name: profileName || form.repositoryName });
    setSelectedProfile(profile.id);
    setProfileName("");
  }
  function selectProfile(id: string) {
    setSelectedProfile(id);
    const profile = profiles.find((item) => item.id === id);
    if (profile) setForm((current) => ({ ...current, ...formValues(profile) }));
  }

  return <section className="mx-auto w-full max-w-6xl">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div><Button variant="ghost" size="sm" type="button" onClick={onBack}><ArrowLeftIcon /> Workers</Button><h1 className="mt-3 text-xl font-semibold">Prepare a CXForge workspace</h1><p className="text-sm text-muted-foreground">Zuno will create one isolated worker, then run this approved setup plan.</p></div>
      <Button disabled={busy} type="submit" form="workspace-setup">{busy ? "Creating…" : "Approve and prepare worker"}</Button>
    </header>
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
      <form id="workspace-setup" onSubmit={submit} className="grid gap-5 rounded-lg border p-5">
        <fieldset className="grid gap-3"><legend className="font-semibold">Saved repository profile</legend><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><select aria-label="Saved repository profile" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedProfile} onChange={(event) => selectProfile(event.target.value)}><option value="">Custom setup</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.directory}</option>)}</select><div className="flex gap-2"><Input aria-label="Save profile as" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Profile name" /><Button disabled={busy} type="button" variant="outline" onClick={() => void saveProfile()}>Save profile</Button></div></div><p className="text-xs text-muted-foreground">Profiles store repository, app, database, and command defaults. Environment values are never saved in a profile.</p></fieldset>
        <fieldset className="grid gap-3"><legend className="font-semibold">Worker identity</legend><div className="grid gap-3 sm:grid-cols-2"><Field label="Worker name"><Input value={form.name} onChange={(event) => update("name", event.target.value)} pattern="[a-z][a-z0-9-]{1,39}" required /></Field><Field label="Short title"><Input value={form.title} onChange={(event) => update("title", event.target.value)} required /></Field></div></fieldset>
        <fieldset className="grid gap-3 border-t pt-5"><legend className="font-semibold">Repository and app</legend><div className="grid gap-3 sm:grid-cols-2"><Field label="Repository name"><Input value={form.repositoryName} onChange={(event) => update("repositoryName", event.target.value)} required /></Field><Field label="Default branch"><Input value={form.defaultBranch} onChange={(event) => update("defaultBranch", event.target.value)} required /></Field></div><Field label="Git repository URL"><Input type="url" value={form.repositoryUrl} onChange={(event) => update("repositoryUrl", event.target.value)} placeholder="https://github.com/OWNER/REPOSITORY.git" required /></Field><Field label="App directory"><Input value={form.directory} onChange={(event) => update("directory", event.target.value)} placeholder="apps/devkits/zuno" required /><span className="text-xs text-muted-foreground">Use <code>.</code> for the repository root.</span></Field></fieldset>
        <fieldset className="grid gap-3 border-t pt-5"><legend className="font-semibold">Environment and database</legend><Field label="Environment values"><Textarea className="min-h-24 font-mono text-xs" value={environmentText} onChange={(event) => setEnvironmentText(event.target.value)} placeholder={"KEY=value\nANOTHER_VALUE=value"} /><span className="text-xs text-muted-foreground">One <code>KEY=value</code> entry per line. Values are sent only to this worker setup request.</span></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Database"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.databaseDriver} onChange={(event) => update("databaseDriver", event.target.value as WorkspaceForm["databaseDriver"])}><option value="sqlite">SQLite in workspace</option><option value="mariadb">Shared MariaDB</option><option value="none">No database</option></select></Field>{form.databaseDriver === "sqlite" && <Field label="SQLite path"><Input value={form.sqlitePath} onChange={(event) => update("sqlitePath", event.target.value)} required /></Field>}</div></fieldset>
        <fieldset className="grid gap-3 border-t pt-5"><legend className="font-semibold">Approved setup commands</legend><CommandField label="Install" value={form.installCommand} onChange={(value) => update("installCommand", value)} /><CommandField label="Migration status" disabled={form.databaseDriver === "none"} value={form.migrationStatusCommand} onChange={(value) => update("migrationStatusCommand", value)} /><CommandField label="Migrate" disabled={form.databaseDriver === "none"} value={form.migrateCommand} onChange={(value) => update("migrateCommand", value)} /><CommandField label="Verify migration" disabled={form.databaseDriver === "none"} value={form.migrationVerifyCommand} onChange={(value) => update("migrationVerifyCommand", value)} /><CommandField label="Preview" value={form.previewCommand} onChange={(value) => update("previewCommand", value)} /></fieldset>
      </form>
      <aside className="h-fit rounded-lg border bg-muted/20 p-5 xl:sticky xl:top-4"><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><BracesIcon /> JSON preview</h2><Button size="sm" type="button" variant="ghost" onClick={() => setShowPreview((current) => !current)}>{showPreview ? "Hide" : "Show"}</Button></div><p className="mb-3 text-sm text-muted-foreground">This is the exact setup contract Zuno sends to the new worker.</p>{showPreview && <pre className="max-h-[60vh] overflow-auto rounded bg-background p-3 text-xs leading-relaxed">{JSON.stringify(input, null, 2)}</pre>}</aside>
    </div>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>; }
function CommandField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) { return <Field label={label}><Input disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} required={!disabled} /></Field>; }

interface WorkspaceForm {
  name: string; title: string; repositoryName: string; repositoryUrl: string; defaultBranch: string; directory: string;
  databaseDriver: "sqlite" | "mariadb" | "none"; sqlitePath: string; installCommand: string; migrationStatusCommand: string;
  migrateCommand: string; migrationVerifyCommand: string; previewCommand: string;
}

const defaultForm: WorkspaceForm = {
  name: "cxforge", title: "Prepare development workspace", repositoryName: "My app", repositoryUrl: "", defaultBranch: "main", directory: ".", databaseDriver: "sqlite", sqlitePath: ".cxforge/workspace.sqlite",
  installCommand: "npm ci --no-audit --no-fund", migrationStatusCommand: "npm run db:status", migrateCommand: "npm run db:migrate", migrationVerifyCommand: "npm run db:verify", previewCommand: "npm run dev -- --host 0.0.0.0 --port {port}",
};

function buildProvisionInput(form: WorkspaceForm, environmentText: string, requestIds: { provision: string; setup: string }): WorkspaceProvisionInput {
  const command = (value: string): CommandStep => ({ argv: ["sh", "-lc", value], directory: form.directory, timeoutSeconds: 300 });
  const setup: WorkspaceProvisionInput["setup"] = {
    requestId: requestIds.setup, title: form.title, approved: true, directory: form.directory,
    repository: { name: form.repositoryName, repository: form.repositoryUrl, defaultBranch: form.defaultBranch }, environment: parseEnvironment(environmentText), databaseDriver: form.databaseDriver,
    install: command(form.installCommand), previewCommand: form.previewCommand,
  };
  if (form.databaseDriver === "sqlite") setup.sqlitePath = form.sqlitePath;
  if (form.databaseDriver !== "none") Object.assign(setup, { migrationStatus: command(form.migrationStatusCommand), migrate: command(form.migrateCommand), migrationVerify: command(form.migrationVerifyCommand) });
  return { requestId: requestIds.provision, name: form.name, setup };
}

function parseEnvironment(value: string): Record<string, string> {
  return Object.fromEntries(value.split(/\r?\n/u).flatMap((line) => { const index = line.indexOf("="); return index > 0 ? [[line.slice(0, index).trim(), line.slice(index + 1)]] : []; }));
}

function profileInput(form: WorkspaceForm): WorkspaceProfileInput {
  return { name: form.repositoryName, repositoryName: form.repositoryName, repositoryUrl: form.repositoryUrl, defaultBranch: form.defaultBranch, directory: form.directory, databaseDriver: form.databaseDriver, sqlitePath: form.databaseDriver === "sqlite" ? form.sqlitePath : undefined, installCommand: form.installCommand, migrationStatusCommand: form.migrationStatusCommand, migrateCommand: form.migrateCommand, migrationVerifyCommand: form.migrationVerifyCommand, previewCommand: form.previewCommand };
}

function formValues(profile: WorkspaceProfile): Partial<WorkspaceForm> {
  return { repositoryName: profile.repositoryName, repositoryUrl: profile.repositoryUrl, defaultBranch: profile.defaultBranch, directory: profile.directory, databaseDriver: profile.databaseDriver, sqlitePath: profile.sqlitePath ?? defaultForm.sqlitePath, installCommand: profile.installCommand, migrationStatusCommand: profile.migrationStatusCommand, migrateCommand: profile.migrateCommand, migrationVerifyCommand: profile.migrationVerifyCommand, previewCommand: profile.previewCommand };
}
