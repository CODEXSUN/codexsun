import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  BoxesIcon,
  Code2Icon,
  DatabaseIcon,
  GitBranchIcon,
  Layers3Icon,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { ClientDeliveryWorkspaceView } from "./client-delivery-workspace";
import {
  WorkspaceEntityCard,
  WorkspaceHealthSummary,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePageHeader,
  WorkspaceSectionCard,
} from "@codexsun/ui/blocks/workspace";
import type { ClientWorkspace, EnvironmentName, SiteDeployment } from "../../../contracts/workspace";

type StudioSection = "overview" | "clients" | "delivery" | "design" | "forms" | "backoffice" | "activity";
type Health = { status: "ok"; providers: string[] };

export function SitesStudio({
  request,
  section,
  selectedSlug,
  onSelectClient,
}: {
  request: typeof fetch;
  section: StudioSection;
  selectedSlug?: string;
  onSelectClient: (slug: string) => void;
}) {
  const clients = useQuery({
    queryKey: ["sites", "workspaces"],
    queryFn: () => readWorkspaces(request),
    refetchInterval: 30_000,
  });
  const health = useQuery({
    queryKey: ["sites", "health"],
    queryFn: () => readHealth(request),
    refetchInterval: 30_000,
  });
  const selected = clients.data?.find((client) => client.slug === selectedSlug);
  const deployment = useMutation({
    mutationFn: ({ slug, environment }: { slug: string; environment: EnvironmentName }) =>
      requestDeployment(request, slug, environment),
    onSuccess: () => clients.refetch(),
  });

  if (section === "clients" && selected)
    return (
      <ClientWorkspaceView
        request={request}
        client={selected}
        onBack={() => onSelectClient("")}
        onDeploy={(environment) => deployment.mutate({ slug: selected.slug, environment })}
        deploying={deployment.isPending}
      />
    );
  if (section !== "overview" && section !== "clients")
    return <CapabilityView section={section} clients={clients.data ?? []} />;

  const activeClients = clients.data?.filter((client) => client.status === "active").length ?? 0;
  const productionReady =
    clients.data?.filter(
      (client) => client.environments.find((environment) => environment.name === "production")?.state === "ready",
    ).length ?? 0;
  return (
    <main className="min-h-full bg-background p-4 pb-10 text-foreground sm:p-6 sm:pb-12">
      <div className="mx-auto max-w-7xl">
        <WorkspacePageHeader
          className="border-b border-border pb-5"
          eyebrow="SITES STUDIO"
          title="Client delivery control plane"
          description="Develop, isolate, release, and operate every client workspace without merging their concepts."
          actions={
            <Button onClick={() => onSelectClient(clients.data?.[0]?.slug ?? "")}>
              <BoxesIcon className="size-4" /> Open client workspace <ArrowRightIcon className="size-4" />
            </Button>
          }
        />
        <WorkspaceMetricGrid className="mt-5 gap-3">
          <WorkspaceMetricCard
            size="compact"
            icon={BoxesIcon}
            label="Client workspaces"
            value={String(clients.data?.length ?? 0)}
            description="Independent delivery lanes"
          />
          <WorkspaceHealthSummary
            icon={ShieldCheckIcon}
            label="Control plane"
            value={health.data?.status === "ok" ? "Healthy" : "Checking"}
            description="Workspace and deployment API"
            tone={health.data?.status === "ok" ? "success" : "warning"}
          />
          <WorkspaceMetricCard
            size="compact"
            icon={RocketIcon}
            label="Production ready"
            value={`${productionReady}/${activeClients}`}
            description="Client environments"
          />
          <WorkspaceMetricCard
            size="compact"
            icon={GitBranchIcon}
            label="Delivery model"
            value="Isolated"
            description="Per-client source and runtime"
          />
        </WorkspaceMetricGrid>
        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portfolio delivery</p>
              <h2 className="mt-2 text-2xl font-semibold">Client workspaces</h2>
            </div>
            <span className="text-sm text-muted-foreground">Each client has its own environments</span>
          </div>
          {clients.isError ? (
            <ErrorPanel message="The client workspace feed is unavailable." />
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(clients.data ?? []).map((client) => (
                <ClientCard key={client.slug} client={client} onOpen={() => onSelectClient(client.slug)} />
              ))}
            </div>
          )}
        </section>
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <WorkspaceSectionCard
            title="Isolation contract"
            description="Shared visibility. Separate implementation and delivery."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <ContractItem icon={Code2Icon} label="Source" value="Client-owned" />
              <ContractItem icon={DatabaseIcon} label="Database" value="Environment-owned" />
              <ContractItem icon={Layers3Icon} label="Design" value="Versioned" />
            </div>
          </WorkspaceSectionCard>
          <WorkspaceSectionCard title="Next delivery action" description="Keep the client lane moving.">
            <p className="text-sm leading-6 text-muted-foreground">
              Open a client workspace to deploy development, review its design version, and promote only that client.
            </p>
          </WorkspaceSectionCard>
        </section>
      </div>
    </main>
  );
}

function ClientCard({ client, onOpen }: { client: ClientWorkspace; onOpen: () => void }) {
  const production = client.environments.find((environment) => environment.name === "production");
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${client.name} workspace`}
      className="cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <WorkspaceEntityCard
        variant="interactive"
        eyebrow={client.runtimeProfile}
        title={client.name}
        description={client.description}
        action={<ArrowRightIcon className="size-4" aria-hidden="true" />}
        footer={
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{client.designVersion}</span>
            <Badge variant={production?.state === "ready" ? "default" : "outline"}>
              {production?.state ?? "planned"}
            </Badge>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Dev {stateFor(client, "development")}</Badge>
          <Badge variant="outline">Stage {stateFor(client, "staging")}</Badge>
          <Badge variant="outline">Prod {stateFor(client, "production")}</Badge>
        </div>
      </WorkspaceEntityCard>
    </div>
  );
}

function ClientWorkspaceView({
  request,
  client,
  onBack,
  onDeploy,
  deploying,
}: {
  request: typeof fetch;
  client: ClientWorkspace;
  onBack: () => void;
  onDeploy: (environment: EnvironmentName) => void;
  deploying: boolean;
}) {
  const latest = client.latestDeployment;
  return (
    <main className="min-h-full bg-background p-4 pb-10 text-foreground sm:p-6 sm:pb-12">
      <div className="mx-auto max-w-7xl">
        <WorkspacePageHeader
          eyebrow={`CLIENT / ${client.slug.toUpperCase()}`}
          title={client.name}
          description={client.description}
          actions={
            <Button variant="outline" onClick={onBack}>
              Back to clients
            </Button>
          }
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <WorkspaceSectionCard
            title="Independent delivery lane"
            description="This client can develop and deploy without changing other clients."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {client.environments.map((environment) => (
                <div className="rounded-xl border border-border p-4" key={environment.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{environment.name}</span>
                    <Badge variant={environment.state === "ready" ? "default" : "outline"}>{environment.state}</Badge>
                  </div>
                  <p className="mt-3 truncate text-xs text-muted-foreground">{environment.publicOrigin}</p>
                  <Button
                    className="mt-4 w-full"
                    disabled={deploying}
                    onClick={() => onDeploy(environment.name)}
                    size="sm"
                    variant={environment.name === "production" ? "default" : "outline"}
                  >
                    {deploying ? "Queueing…" : `Deploy ${environment.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </WorkspaceSectionCard>
          <WorkspaceSectionCard title="Release identity" description="Versions stay client-scoped.">
            <dl className="space-y-4 text-sm">
              <Definition label="Source reference" value={client.sourceRef} />
              <Definition label="Design version" value={client.designVersion} />
              <Definition label="Runtime profile" value={client.runtimeProfile} />
              <Definition label="Database model" value="Private per environment" />
            </dl>
          </WorkspaceSectionCard>
        </div>
        <div className="mt-4">
          <WorkspaceSectionCard
            title="Latest deployment"
            description="Deployment records are isolated by client and environment."
          >
            {latest ? (
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{latest.releaseTag}</p>
                  <p className="mt-1 text-muted-foreground">
                    {latest.environment} · {latest.state} · {latest.sourceRef}
                  </p>
                </div>
                <Badge variant="outline">{latest.requestedAt}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No deployment has been requested for this client yet.</p>
            )}
          </WorkspaceSectionCard>
        </div>
        <ClientDeliveryWorkspaceView request={request} client={client} />
      </div>
    </main>
  );
}

function CapabilityView({
  section,
  clients,
}: {
  section: Exclude<StudioSection, "overview" | "clients">;
  clients: ClientWorkspace[];
}) {
  const labels: Record<Exclude<StudioSection, "overview" | "clients">, { title: string; description: string }> = {
    delivery: {
      title: "Environments and deployments",
      description: "Track each client release independently across development, staging, and production.",
    },
    design: {
      title: "Design concepts and versions",
      description: "Keep unique client concepts versioned and opt-in to shared package upgrades.",
    },
    forms: {
      title: "Client forms",
      description: "Forms will be attached to a client runtime and keep submissions inside that client boundary.",
    },
    backoffice: {
      title: "Client back offices",
      description: "Enable optional client portals without adding back-office routes to unrelated clients.",
    },
    activity: {
      title: "Activity and audit",
      description: "Review deployment, content, access, and runtime events by client.",
    },
  };
  const content = labels[section];
  return (
    <main className="min-h-full bg-background p-4 pb-10 text-foreground sm:p-6 sm:pb-12">
      <div className="mx-auto max-w-7xl">
        <WorkspacePageHeader eyebrow="SITES STUDIO" title={content.title} description={content.description} />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {clients.map((client) => (
            <WorkspaceEntityCard
              key={client.slug}
              eyebrow={client.runtimeProfile}
              title={client.name}
              description={`${client.environments.length} isolated environments`}
            >
              <Badge variant="outline">{client.designVersion}</Badge>
            </WorkspaceEntityCard>
          ))}
        </div>
      </div>
    </main>
  );
}

function ContractItem({ icon: Icon, label, value }: { icon: typeof BoxesIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}
function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">{message}</div>
  );
}
function stateFor(client: ClientWorkspace, name: EnvironmentName): string {
  return client.environments.find((environment) => environment.name === name)?.state ?? "planned";
}
async function readHealth(request: typeof fetch): Promise<Health> {
  const response = await request("/api/v1/sites/health");
  if (!response.ok) throw new Error("Health request failed");
  return response.json() as Promise<Health>;
}
async function readWorkspaces(request: typeof fetch): Promise<ClientWorkspace[]> {
  const response = await request("/api/v1/sites/workspaces");
  if (!response.ok) throw new Error("Workspace request failed");
  return response.json() as Promise<ClientWorkspace[]>;
}
async function requestDeployment(
  request: typeof fetch,
  slug: string,
  environment: EnvironmentName,
): Promise<SiteDeployment> {
  const response = await request(`/api/v1/sites/workspaces/${slug}/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ environment }),
  });
  if (!response.ok && response.status !== 202) throw new Error("Deployment request failed");
  return response.json() as Promise<SiteDeployment>;
}
