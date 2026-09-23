import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BarChart3Icon,
  BotIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  PhoneCallIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import { MainWorkspace, type MdiNavigationSection } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";

type Health = { status: "ok"; providers: string[] };
type WorkspaceView = "overview" | "campaigns" | "leads" | "customers" | "enquiries" | "estimates" | "quotations" | "work" | "collections" | "verification" | "quality" | "assistant" | "hr" | "reports";
type Overview = { counts: { campaigns: number; leads: number; openEnquiries: number; activeWork: number; pendingCollection: number; pendingVerification: number }; recentEnquiries: { id: string; subject: string; priority: string; status: string; createdAt: string }[] };
type ModuleConfig = { label: string; singular: string; description: string; path: string; field: "name" | "subject"; placeholder: string };

const nav: { label: string; view: WorkspaceView; icon: typeof LayoutDashboardIcon }[] = [
  { icon: LayoutDashboardIcon, label: "Overview", view: "overview" },
  { icon: MegaphoneIcon, label: "Campaigns", view: "campaigns" },
  { icon: UsersIcon, label: "Leads", view: "leads" },
  { icon: Building2Icon, label: "Customers", view: "customers" },
  { icon: MessageSquareIcon, label: "Enquiries", view: "enquiries" },
  { icon: ReceiptTextIcon, label: "Estimates", view: "estimates" },
  { icon: FileTextIcon, label: "Quotations", view: "quotations" },
  { icon: BriefcaseBusinessIcon, label: "Work", view: "work" },
  { icon: PhoneCallIcon, label: "Collections", view: "collections" },
  { icon: ShieldCheckIcon, label: "Verification", view: "verification" },
  { icon: CheckCircle2Icon, label: "Quality", view: "quality" },
  { icon: BotIcon, label: "AI Assistant", view: "assistant" },
  { icon: UserRoundIcon, label: "HR Duty", view: "hr" },
  { icon: BarChart3Icon, label: "Reports", view: "reports" },
];

export function App() {
  return <SessionBoundary applicationId="crm" applicationName="CRM" autoLoginPath="/api/v1/crm/auth/development-login" loginPath="/api/v1/crm/auth/login">{(session) => session.portal === "user" ? <CrmDesk request={session.fetch} logout={session.logout} /> : session.portal === "super-admin" ? <IdentityManagementDesk applicationId="crm" applicationName="CRM" logout={session.logout} request={session.fetch} /> : <PrivilegedDesk applicationId="crm" applicationName="CRM" logout={session.logout} portal={session.portal} />}</SessionBoundary>;
}

function CrmDesk({ request, logout }: { request: typeof fetch; logout: () => void }) {
  const [view, setView] = useState<WorkspaceView>("overview");
  const health = useQuery({ queryKey: ["crm", "health"], queryFn: () => readJson<Health>(request, "/api/v1/crm/health") });
  const overview = useQuery({ queryKey: ["crm", "overview"], queryFn: () => readJson<Overview>(request, "/api/v1/crm/overview") });
  const navigation = useMemo<MdiNavigationSection[]>(() => [{ label: "CRM", items: nav.map((item) => ({ active: item.view === view, icon: item.icon, label: item.label, onSelect: () => setView(item.view) })) }], [view]);
  return <MainWorkspace applicationId="crm" applicationName="CRM" navigation={navigation} primaryAction={{ icon: LayoutDashboardIcon, label: "Overview", onSelect: () => setView("overview") }} statusLabel={statusLabel(health)} workspaceTitle={nav.find((item) => item.view === view)?.label ?? "Overview"} user={{ initials: "C", name: "CRM user", onSignOut: logout }}>{view === "overview" ? <OverviewPage overview={overview} /> : <ModulePage request={request} view={view} />}</MainWorkspace>;
}

function OverviewPage({ overview }: { overview: ReturnType<typeof useQuery<Overview>> }) {
  const counts = overview.data?.counts;
  const metrics = [["Campaigns", counts?.campaigns ?? 0, "Marketing intake"], ["Leads", counts?.leads ?? 0, "New opportunities"], ["Open enquiries", counts?.openEnquiries ?? 0, "Customer work"], ["Active work", counts?.activeWork ?? 0, "Assigned service"], ["Collections", counts?.pendingCollection ?? 0, "Needs follow-up"], ["Verification", counts?.pendingVerification ?? 0, "Awaiting review"]];
  return <section className="space-y-6 p-6"><header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5"><div><p className="text-sm font-medium text-muted-foreground">CRM workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">See the full path from customer acquisition to verified service completion.</p></div><div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Local SQLite workspace</div></header><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{metrics.map(([label, value, hint]) => <div className="border border-border bg-card p-4" key={label}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div>)}</div><div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><div className="border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Recent enquiries</h2><p className="mt-1 text-xs text-muted-foreground">Latest customer requests in the local CRM.</p></div><ClipboardListIcon className="size-5 text-muted-foreground" /></div>{overview.isPending ? <p className="p-5 text-sm text-muted-foreground">Loading enquiries...</p> : overview.isError ? <p className="p-5 text-sm text-destructive">Could not load enquiries.</p> : overview.data.recentEnquiries.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No enquiries yet. Create the first one from the Enquiries page.</p> : <div className="divide-y divide-border">{overview.data.recentEnquiries.map((item) => <div className="flex items-center justify-between gap-4 px-5 py-4" key={item.id}><div><p className="text-sm font-medium">{item.subject}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{item.priority} priority · {item.status.replace("_", " ")}</p></div><p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p></div>)}</div>}</div><div className="border border-border bg-card p-5"><div className="flex items-center gap-3"><div className="rounded-md bg-primary/10 p-2 text-primary"><LayoutDashboardIcon className="size-5" /></div><div><h2 className="font-semibold">Next workflow step</h2><p className="mt-1 text-xs text-muted-foreground">Build from real records as the team works.</p></div></div><ol className="mt-5 space-y-3 text-sm text-muted-foreground">{["Capture a campaign or lead", "Convert interest to an enquiry", "Assign and schedule service work", "Verify completion and follow up"].map((step, index) => <li className="flex gap-3" key={step}><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-foreground">{index + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol></div></div></section>;
}

function ModulePage({ request, view }: { request: typeof fetch; view: WorkspaceView }) {
  const queryClient = useQueryClient();
  const config = moduleConfig(view);
  const items = useQuery({ queryKey: ["crm", config.path], queryFn: () => readJson<{ items: Record<string, unknown>[] }>(request, config.path), enabled: Boolean(config.path) });
  const mutation = useMutation({ mutationFn: (body: Record<string, string>) => postJson(request, config.path, body), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["crm", config.path] }); void queryClient.invalidateQueries({ queryKey: ["crm", "overview"] }); } });
  return <section className="space-y-6 p-6"><header className="border-b border-border pb-5"><p className="text-sm font-medium text-muted-foreground">CRM module</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{config.label}</h1><p className="mt-2 text-sm text-muted-foreground">{config.description}</p></header>{config.path ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"><div className="border border-border bg-card"><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Recent records</h2></div>{items.isPending ? <p className="p-5 text-sm text-muted-foreground">Loading...</p> : items.isError ? <p className="p-5 text-sm text-destructive">Could not load records.</p> : items.data.items.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No records yet.</p> : <div className="divide-y divide-border">{items.data.items.map((item, index) => <div className="px-5 py-4" key={String(item.id ?? index)}><p className="text-sm font-medium">{String(item.name ?? item.subject ?? "CRM record")}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{String(item.status ?? "draft").replace("_", " ")}</p></div>)}</div>}</div><CreatePanel config={config} onSubmit={(body) => mutation.mutate(body)} pending={mutation.isPending} /></div> : <div className="border border-border bg-card p-6"><p className="text-sm text-muted-foreground">This workspace is ready for the next CRM phase. The navigation and ownership boundary are in place.</p></div>}</section>;
}

function CreatePanel({ config, onSubmit, pending }: { config: ModuleConfig; onSubmit: (body: Record<string, string>) => void; pending: boolean }) {
  const [value, setValue] = useState("");
  return <form className="border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); if (value.trim()) { onSubmit(config.field === "name" ? { name: value } : { subject: value }); setValue(""); } }}><h2 className="font-semibold">Add {config.singular}</h2><p className="mt-1 text-xs text-muted-foreground">Create a local record to start the workflow.</p><label className="mt-5 block text-xs font-medium" htmlFor="crm-create">{config.field === "name" ? "Name" : "Subject"}</label><input className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" id="crm-create" value={value} onChange={(event) => setValue(event.target.value)} placeholder={config.placeholder} /><button className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={pending || !value.trim()} type="submit">{pending ? "Adding..." : `Add ${config.singular}`}</button></form>;
}

function moduleConfig(view: WorkspaceView): ModuleConfig {
  if (view === "campaigns") return { description: "Track campaigns, sources, spend, and the leads they create.", field: "name", label: "Campaigns", path: "/api/v1/crm/campaigns", placeholder: "Spring service campaign", singular: "campaign" };
  if (view === "leads") return { description: "Capture and qualify new customer opportunities.", field: "name", label: "Leads", path: "/api/v1/crm/leads", placeholder: "Customer or company name", singular: "lead" };
  if (view === "enquiries") return { description: "Manage customer requests from first contact through verified completion.", field: "subject", label: "Enquiries", path: "/api/v1/crm/enquiries", placeholder: "Repair visit request", singular: "enquiry" };
  return { description: "Organize this area as the next CRM workflow phase is implemented.", field: "name", label: nav.find((item) => item.view === view)?.label ?? "CRM", path: "", placeholder: "", singular: "record" };
}

function statusLabel(health: ReturnType<typeof useQuery<Health>>): string { if (health.isPending) return "Connecting"; if (health.isError) return "API offline"; return `API ${health.data.status}`; }
async function readJson<T>(request: typeof fetch, path: string): Promise<T> { const response = await request(path, { signal: AbortSignal.timeout(5_000) }); if (!response.ok) throw new Error(`Request failed: ${response.status}`); return response.json() as Promise<T>; }
async function postJson<T>(request: typeof fetch, path: string, body: Record<string, string>): Promise<T> { const response = await request(path, { body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, method: "POST" }); if (!response.ok) throw new Error(`Request failed: ${response.status}`); return response.json() as Promise<T>; }
