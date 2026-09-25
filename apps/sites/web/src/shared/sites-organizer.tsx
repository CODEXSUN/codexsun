import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIcon, ArrowUpRightIcon, CheckCircle2Icon, DatabaseIcon, ExternalLinkIcon, Globe2Icon, Layers3Icon, Loader2Icon, PlayIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceEntityCard, WorkspaceHealthSummary, WorkspaceMetricCard, WorkspaceMetricGrid, WorkspacePageHeader, WorkspaceRouteChecklist, WorkspaceRuntimeStatus, WorkspaceSectionCard } from "@codexsun/ui/blocks/workspace";

type Health = { status: "ok"; providers: string[] };
type RuntimeStatus = { checkedAt: string; httpStatus: number | null; port: number; responseTimeMs: number | null; running: boolean; slug: string; state: "degraded" | "live" | "stopped" };

type ClientSummary = {
  slug: string;
  name: string;
  mark: string;
  eyebrow: string;
  description: string;
  accent: "cyan" | "orange" | "violet";
  stats: { label: string; value: string }[];
  contact?: { email: string; phone: string; label: string };
  location?: { address: string };
};

export function SitesOrganizer({ request }: { request: typeof fetch }) {
  const queryClient = useQueryClient();
  const health = useQuery({
    queryKey: ["sites", "health"],
    queryFn: () => readHealth(request),
    refetchInterval: 30_000,
  });
  const clients = useQuery({
    queryKey: ["sites", "public", "clients", "organizer"],
    queryFn: () => readClients(request),
    refetchInterval: 60_000,
  });
  const runtimes = useQuery({
    queryKey: ["sites", "runtime"],
    queryFn: () => readRuntimes(request),
    refetchInterval: 5_000,
  });
  const startRuntime = useMutation({
    mutationFn: (slug: string) => startSiteRuntime(request, slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sites", "runtime"] }),
  });
  const publicOrigin = import.meta.env.VITE_SITES_PUBLIC_URL || window.location.origin;
  const brandName = import.meta.env.VITE_SITES_BRAND_NAME || "Sites Studio";
  const runningRuntimes = runtimes.data?.filter((runtime) => runtime.state === "live").length ?? 0;

  return (
    <main className="min-h-full bg-background p-4 pb-10 text-foreground sm:p-6 sm:pb-12">
      <div className="mx-auto max-w-7xl">
        <WorkspacePageHeader
          className="border-b border-border pb-5"
          eyebrow={brandName}
          title="Multi-site organizer"
          description="Publish, monitor, and open every client site from one control plane."
          actions={
            <Button render={<a href="/clients" />}>
              <Globe2Icon className="size-4" /> Open public portal <ArrowUpRightIcon className="size-4" />
            </Button>
          }
        />
        <WorkspaceMetricGrid className="mt-5 gap-3">
          <WorkspaceMetricCard
            size="compact"
            icon={DatabaseIcon}
            label="Published sites"
            value={clients.data?.length.toString() ?? "—"}
            description="SQLite content records"
          />
          <WorkspaceHealthSummary
            icon={ActivityIcon}
            label="API status"
            value={health.data?.status === "ok" ? "Healthy" : health.isPending ? "Checking" : "Attention"}
            description={health.data?.status === "ok" ? "Public content API" : "Waiting for response"}
            tone={health.data?.status === "ok" ? "success" : "warning"}
          />
          <WorkspaceMetricCard size="compact" icon={Layers3Icon} label="Active runtimes" value={`${runningRuntimes}/4`} description="Standalone client hosts" />
          <WorkspaceMetricCard
            size="compact"
            icon={Globe2Icon}
            label="Public origin"
            value={publicOrigin.replace(/^https?:\/\//u, "")}
            description={import.meta.env.MODE === "production" ? "Production build" : "Control plane host"}
          />
        </WorkspaceMetricGrid>
        <section className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Client inventory</p>
              <h2 className="mt-2 text-2xl font-semibold">Public sites</h2>
            </div>
            <span className="text-sm text-muted-foreground">Refreshes every 60 seconds</span>
          </div>
          {clients.isError ? (
            <ErrorPanel message="The public client feed is unavailable." />
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(clients.data ?? []).map((client) => (
                <ClientCard
                  key={client.slug}
                  client={client}
                  runtime={runtimes.data?.find((item) => item.slug === client.slug)}
                  starting={startRuntime.isPending && startRuntime.variables === client.slug}
                  onStart={() => startRuntime.mutate(client.slug)}
                />
              ))}
            </div>
          )}
          {runtimes.isError ? <ErrorPanel message="Runtime checks are unavailable." onRetry={() => runtimes.refetch()} /> : null}
          {startRuntime.isError ? <ErrorPanel message="The runtime did not start. Check the API logs and retry." /> : null}
        </section>
        <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <WorkspaceSectionCard title="Production readiness" description="Four quick delivery checks.">
            <WorkspaceRouteChecklist items={[
              { label: "API health endpoint", status: health.data?.status === "ok" ? "ready" : "blocked" },
              { label: "Published content feed", status: clients.data?.length ? "ready" : "blocked" },
              { label: "Client route inventory", status: clients.data?.length ? "ready" : "blocked" },
              { label: "Search Console submission", status: "pending" },
            ]} />
          </WorkspaceSectionCard>
          <WorkspaceSectionCard title="Release checklist" description="Next step">
            <p className="text-sm leading-6 text-muted-foreground">
              Add domains and route checks before publishing a new site.
            </p>
            <Button className="mt-6" render={<a href="/clients" />} variant="link">
              Review public routes <ArrowUpRightIcon className="size-4" />
            </Button>
          </WorkspaceSectionCard>
        </section>
      </div>
    </main>
  );
}

function ClientCard({
  client,
  runtime,
  starting,
  onStart,
}: {
  client: ClientSummary;
  runtime?: RuntimeStatus;
  starting: boolean;
  onStart: () => void;
}) {
  const origin = standaloneOrigin(client.slug);
  return (
    <WorkspaceEntityCard
      variant="interactive"
      description={client.description}
      eyebrow={client.mark ?? client.slug.slice(0, 2)}
      action={
        <a aria-label={`Open ${client.name} standalone site in a new tab`} href={origin} rel="noreferrer" target="_blank">
          <Button aria-label={`Open ${client.name} standalone site`} size="icon-sm" variant="ghost">
            <ExternalLinkIcon />
          </Button>
        </a>
      }
      title={client.name}
      footer={
        <WorkspaceRuntimeStatus
          action={
            <Button
              aria-label={runtime?.state === "live" ? `${client.name} runtime is live` : `Run ${client.name} runtime`}
              disabled={runtime?.state === "live" || starting}
              onClick={onStart}
              size="icon-sm"
              variant="outline"
            >
              {starting ? <Loader2Icon className="animate-spin" /> : runtime?.state === "live" ? <CheckCircle2Icon className="text-success" /> : <PlayIcon />}
            </Button>
          }
          checkedAt={runtime?.checkedAt}
          httpStatus={runtime?.httpStatus}
          port={runtime?.port}
          responseTimeMs={runtime?.responseTimeMs}
          state={starting ? "starting" : runtime?.state ?? "stopped"}
        />
      }
    >
      <div className="flex flex-wrap gap-2">
        {client.stats.slice(0, 2).map((stat) => <Badge key={stat.label} variant="outline">{stat.label}: {stat.value}</Badge>)}
      </div>
    </WorkspaceEntityCard>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
      {message}
      {onRetry ? <Button onClick={onRetry} size="sm" variant="outline">Retry</Button> : null}
    </div>
  );
}

async function readHealth(request: typeof fetch): Promise<Health> {
  const response = await request("/api/v1/sites/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}

async function readClients(request: typeof fetch): Promise<ClientSummary[]> {
  const response = await request("/api/v1/sites/public/clients", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Client request failed: ${response.status}`);
  return response.json() as Promise<ClientSummary[]>;
}

async function readRuntimes(request: typeof fetch): Promise<RuntimeStatus[]> {
  const response = await request("/api/v1/sites/runtime", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Runtime status request failed: ${response.status}`);
  return response.json() as Promise<RuntimeStatus[]>;
}

async function startSiteRuntime(request: typeof fetch, slug: string): Promise<RuntimeStatus> {
  const response = await request(`/api/v1/sites/runtime/${slug}/start`, {
    body: "{}",
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok && response.status !== 202) throw new Error(`Runtime start request failed: ${response.status}`);
  return response.json() as Promise<RuntimeStatus>;
}

function standaloneOrigin(slug: string): string {
  const ports: Record<string, number> = { codexsun: 7001, devxcrew: 7002, logicx: 7003, skilloopz: 7004 };
  return `http://127.0.0.1:${ports[slug] ?? 7001}`;
}
