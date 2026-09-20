import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import {
  ArrowLeftIcon, CheckCircle2Icon, CloudIcon, DatabaseIcon, Link2Icon, PlusIcon, RefreshCwIcon, SlidersHorizontalIcon,
} from "lucide-react";
import type { MdiFeatureKey, MdiFeatures } from "@codexsun/ui/layouts/main-workspace";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Switch } from "@codexsun/ui/components/switch";
import {
  createConnector, readCloudSyncSettings, readConnectors, readDatabaseSettings, setConnectorEnabled,
  updateCloudSyncSettings, verifyDatabaseSettings, type ConnectorKind,
} from "./settings-api";

type SettingsPage = "database" | "cloud-sync" | "connectors" | "workspace";
const settingsNavigation = [
  { description: "Provider and lifecycle health", icon: DatabaseIcon, id: "database" as const, label: "Database" },
  { description: "Local-to-cloud policy", icon: CloudIcon, id: "cloud-sync" as const, label: "Cloud sync" },
  { description: "External service registry", icon: Link2Icon, id: "connectors" as const, label: "Connectors" },
  { description: "Application interface controls", icon: SlidersHorizontalIcon, id: "workspace" as const, label: "Workspace" },
];

export function QcafeSettingsWorkspace({ features, onBack, onFeatureChange, onPageChange, request }: {
  features: MdiFeatures;
  onBack: () => void;
  onFeatureChange: (feature: MdiFeatureKey, enabled: boolean) => void;
  onPageChange: (label?: string) => void;
  request: typeof fetch;
}) {
  const [page, setPage] = useState<SettingsPage>("database");
  const active = settingsNavigation.find((item) => item.id === page)!;
  useEffect(() => {
    onPageChange(`Settings · ${active.label}`);
    return () => onPageChange(undefined);
  }, [active.label, onPageChange]);
  return (
    <div className="grid min-h-full bg-background lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b p-4 lg:border-b-0 lg:border-r lg:p-5">
        <Button aria-label="Back to workspace" className="mb-6" onClick={onBack} size="icon" variant="outline"><ArrowLeftIcon/></Button>
        <p className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">Q Cafe settings</p>
        <nav className="grid gap-1" aria-label="Q Cafe settings">
          {settingsNavigation.map((item) => <button className={`flex min-w-0 items-start gap-3 rounded-md px-3 py-3 text-left transition-colors ${page === item.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`} key={item.id} onClick={() => setPage(item.id)} type="button"><item.icon className="mt-0.5 size-4 shrink-0"/><span className="min-w-0"><span className="block text-sm font-medium">{item.label}</span><span className="block text-xs leading-5">{item.description}</span></span></button>)}
        </nav>
      </aside>
      <main className="min-w-0 p-6 lg:p-10">
        <header className="mb-8 border-b pb-6"><p className="text-sm font-medium text-muted-foreground">Settings</p><h1 className="mt-1 text-2xl font-semibold">{active.label}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{active.description}</p></header>
        {page === "database" ? <DatabaseSettingsPage request={request}/> : page === "cloud-sync" ? <CloudSyncSettingsPage request={request}/> : page === "connectors" ? <ConnectorsSettingsPage request={request}/> : <WorkspaceSettingsPage features={features} onFeatureChange={onFeatureChange}/>} 
      </main>
    </div>
  );
}

const workspaceFeatures: Array<{ description: string; key: MdiFeatureKey; label: string }> = [
  { key: "ito", label: "ITO inspection", description: "Show the interface topology inspection control." },
  { key: "topMenu", label: "Top menu", description: "Show application context, search, and account actions." },
  { key: "notifications", label: "Notifications", description: "Show notification controls in the top menu." },
  { key: "appSwitcher", label: "Application switcher", description: "Show the application grid in the top menu." },
  { key: "profileMenu", label: "Profile menu", description: "Show account and sign-out actions." },
  { key: "statusBar", label: "Workspace status bar", description: "Show connection and page state along the bottom edge." },
];

function WorkspaceSettingsPage({ features, onFeatureChange }: {
  features: MdiFeatures;
  onFeatureChange: (feature: MdiFeatureKey, enabled: boolean) => void;
}) {
  return <section className="grid max-w-3xl divide-y border-y">{workspaceFeatures.map((option) => <div className="flex items-center gap-6 py-5" key={option.key}><span className="min-w-0 flex-1"><span className="block text-sm font-semibold" id={`${option.key}-label`}>{option.label}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground" id={`${option.key}-description`}>{option.description}</span></span><Switch aria-describedby={`${option.key}-description`} aria-labelledby={`${option.key}-label`} checked={features[option.key]} onCheckedChange={(enabled) => onFeatureChange(option.key, enabled)}/></div>)}</section>;
}

const databaseKey = ["qcafe", "settings", "database"] as const;
function DatabaseSettingsPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const database = useQuery({ queryKey: databaseKey, queryFn: () => readDatabaseSettings(request) });
  const verify = useMutation({ mutationFn: () => verifyDatabaseSettings(request), onSuccess: (data) => client.setQueryData(databaseKey, data) });
  if (database.isPending) return <Loading text="Checking database..."/>;
  if (database.isError) return <SettingsError message={database.error.message}/>;
  const data = database.data;
  return <div className="grid max-w-4xl gap-8"><section className="grid gap-5 sm:grid-cols-2"><Metric label="Active provider" value={data.engine} detail={data.mode === "local" ? "Outlet-local data" : "Central cloud data"}/><Metric label="Connection state" value={data.status === "ready" ? "Ready" : "Unavailable"} detail={`Verified ${new Date(data.verifiedAt).toLocaleString()}`} good={data.status === "ready"}/><Metric label="Lifecycle records" value={String(data.lifecycleRecords)} detail="SHA-verified migrations and seeders"/><Metric label="Storage" value={data.storageLabel} detail="Selected from server environment"/></section><section className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Deployment-controlled provider</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Change `DB_DRIVER` and database connection values through deployment configuration, then run migration verification before restarting Q Cafe. Credentials are never sent to this page.</p></div><Button disabled={verify.isPending} onClick={() => verify.mutate()} variant="outline"><RefreshCwIcon className={verify.isPending ? "animate-spin" : ""}/>{verify.isPending ? "Verifying..." : "Verify now"}</Button></section>{verify.error ? <SettingsError message={verify.error.message}/> : null}</div>;
}

const syncKey = ["qcafe", "settings", "cloud-sync"] as const;
function CloudSyncSettingsPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const sync = useQuery({ queryKey: syncKey, queryFn: () => readCloudSyncSettings(request) });
  const update = useMutation({ mutationFn: (enabled: boolean) => updateCloudSyncSettings(request, enabled), onSuccess: (data) => client.setQueryData(syncKey, data) });
  if (sync.isPending) return <Loading text="Loading cloud-sync policy..."/>;
  if (sync.isError) return <SettingsError message={sync.error.message}/>;
  return <div className="grid max-w-3xl gap-8"><section className="flex items-center justify-between gap-6 border-y py-6"><div><div className="flex items-center gap-2"><h2 className="font-semibold">Local-to-cloud synchronization</h2><Badge variant={sync.data.enabled ? "default" : "secondary"}>{sync.data.enabled ? "Enabled" : "Disabled"}</Badge></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Queue approved local changes for the configured cloud synchronization service.</p></div><Switch aria-label="Enable cloud synchronization" checked={sync.data.enabled} disabled={!sync.data.available || update.isPending} onCheckedChange={(enabled) => update.mutate(enabled)}/></section><section className="grid gap-4 sm:grid-cols-2"><Metric label="Cloud target" value={sync.data.targetLabel ?? "Not configured"} detail="The endpoint address remains server-only."/><Metric label="Last policy update" value={sync.data.updatedAt ? new Date(sync.data.updatedAt).toLocaleString() : "Never"} detail="All changes create an activity event."/></section>{sync.data.reason ? <Alert><CloudIcon/><AlertTitle>Cloud sync is unavailable</AlertTitle><AlertDescription>{sync.data.reason}</AlertDescription></Alert> : null}{update.error ? <SettingsError message={update.error.message}/> : null}</div>;
}

const connectorsKey = ["qcafe", "settings", "connectors"] as const;
function ConnectorsSettingsPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const connectors = useQuery({ queryKey: connectorsKey, queryFn: () => readConnectors(request) });
  const save = (data: Awaited<ReturnType<typeof readConnectors>>) => client.setQueryData(connectorsKey, data);
  const create = useMutation({ mutationFn: (input: Parameters<typeof createConnector>[1]) => createConnector(request, input), onSuccess: save });
  const toggle = useMutation({ mutationFn: ({ enabled, id }: { enabled: boolean; id: string }) => setConnectorEnabled(request, id, enabled), onSuccess: save });
  if (connectors.isPending) return <Loading text="Loading connectors..."/>;
  if (connectors.isError) return <SettingsError message={connectors.error.message}/>;
  return <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]"><section className="grid content-start gap-3"><div className="flex items-center justify-between border-b pb-4"><div><h2 className="font-semibold">Registered connectors</h2><p className="mt-1 text-sm text-muted-foreground">Safe adapter metadata only</p></div><Badge variant="outline">{connectors.data.connectors.length}</Badge></div>{connectors.data.connectors.length ? <div className="divide-y border-y">{connectors.data.connectors.map((connector) => <div className="flex items-center gap-4 py-4" key={connector.id}><span className="flex size-9 shrink-0 items-center justify-center rounded-md border"><Link2Icon className="size-4"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{connector.name}</span><Badge variant="secondary">{connector.kind}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{connector.code} · {connector.endpointLabel ?? "Endpoint not registered"}</p></div><Switch aria-label={`Enable ${connector.name}`} checked={connector.enabled} disabled={connector.status !== "configured" || toggle.isPending} onCheckedChange={(enabled) => toggle.mutate({ enabled, id: connector.id })}/></div>)}</div> : <div className="grid min-h-40 place-items-center border-y text-center"><div><Link2Icon className="mx-auto mb-2 size-5 text-muted-foreground"/><p className="font-medium">No connectors registered</p><p className="mt-1 text-sm text-muted-foreground">Add the first adapter definition.</p></div></div>}{toggle.error ? <SettingsError message={toggle.error.message}/> : null}</section><ConnectorForm pending={create.isPending} submit={create.mutate}/>{create.error ? <SettingsError message={create.error.message}/> : null}</div>;
}

function ConnectorForm({ pending, submit }: { pending: boolean; submit: (input: Parameters<typeof createConnector>[1]) => void }) {
  return <form className="grid content-start gap-4 border-l-0 xl:border-l xl:pl-6" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); submit({ code: value(data, "code"), endpointLabel: value(data, "endpointLabel") || undefined, kind: value(data, "kind") as ConnectorKind, name: value(data, "name"), secretReference: value(data, "secretReference") || undefined }); form.reset(); }}><div><h2 className="font-semibold">Register connector</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Reference a deployment secret by name. Do not enter a secret value.</p></div><Field label="Name" name="name" placeholder="Swiggy orders" required/><Field label="Code" name="code" placeholder="SWIGGY" required/><div className="grid gap-2"><Label htmlFor="kind">Kind</Label><NativeSelect className="w-full" id="kind" name="kind">{(["marketplace", "delivery", "payment", "messaging", "accounting", "storage"] as ConnectorKind[]).map((kind) => <NativeSelectOption key={kind} value={kind}>{label(kind)}</NativeSelectOption>)}</NativeSelect></div><Field label="Endpoint label" name="endpointLabel" placeholder="Production order intake"/><Field label="Secret reference" name="secretReference" placeholder="QCAFE_SWIGGY_SECRET"/><Button className="w-fit" disabled={pending} type="submit" variant="outline"><PlusIcon/>{pending ? "Registering..." : "Register connector"}</Button></form>;
}

function Metric({ detail, good, label: metricLabel, value: metricValue }: { detail: string; good?: boolean; label: string; value: string }) { return <div className="border-b pb-5"><div className="flex items-center gap-2 text-sm text-muted-foreground">{good ? <CheckCircle2Icon className="size-4 text-emerald-600"/> : null}{metricLabel}</div><p className="mt-2 text-lg font-semibold">{metricValue}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }
function Field({ label: fieldLabel, name, ...props }: ComponentProps<typeof Input> & { label: string; name: string }) { return <div className="grid gap-2"><Label htmlFor={name}>{fieldLabel}</Label><Input id={name} name={name} {...props}/></div>; }
function SettingsError({ message }: { message: string }) { return <Alert variant="destructive"><AlertTitle>Settings could not be updated</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>; }
function Loading({ text }: { text: string }) { return <p className="text-sm text-muted-foreground">{text}</p>; }
function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function label(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
