import { ArrowRightIcon, Globe2Icon, MailIcon, MenuIcon, MapPinIcon, PhoneIcon, type LucideIcon } from "lucide-react";
import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  clientSites,
  clientPath,
  hydrateClientSite,
  portalFeatures,
  type ClientSite,
  type PublicClientPayload,
} from "./client-data";
import { ClientSitePage } from "../templates/client-site-page";
import { LegalPage } from "./legal-pages";
import type { SkilloopzPage } from "../Clients/skilloopz/skilloopz-site";

const SkilloopzSitePage = lazy(() => import("../Clients/skilloopz/skilloopz-site").then(({ SkilloopzSitePage: Component }) => ({ default: Component })));
const CodexsunHome = lazy(() => import("../Clients/codexsun/codexsun-home").then(({ CodexsunHome: Component }) => ({ default: Component })));
const LogicxHome = lazy(() => import("../Clients/logicx/logicx-home").then(({ LogicxHome: Component }) => ({ default: Component })));
import { clientRouteManifests, resolveClientRoute } from "./client-routes";

const accentClasses = {
  cyan: {
    dot: "bg-cyan-400",
    soft: "bg-cyan-400/10",
    text: "text-cyan-300",
    line: "border-cyan-300/25",
    button: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
  },
  orange: {
    dot: "bg-orange-400",
    soft: "bg-orange-400/10",
    text: "text-orange-300",
    line: "border-orange-300/25",
    button: "bg-orange-300 text-slate-950 hover:bg-orange-200",
  },
  violet: {
    dot: "bg-violet-400",
    soft: "bg-violet-400/10",
    text: "text-violet-300",
    line: "border-violet-300/25",
    button: "bg-violet-300 text-slate-950 hover:bg-violet-200",
  },
} as const;

export function ClientsPortal({ standaloneSlug }: { standaloneSlug?: string }) {
  const content = useQuery<PublicClientPayload | PublicClientPayload[]>({
    queryKey: ["sites", "public", standaloneSlug ?? "clients"],
    queryFn: () => (standaloneSlug ? readClientSite(standaloneSlug) : readClientSites()),
    staleTime: 60_000,
  });
  if (content.isPending) return <ClientLoading />;
  if (content.isError && standaloneSlug) return <ClientError slug={standaloneSlug} />;
  const sites = standaloneSlug
    ? content.data
      ? [hydrateClientSite(content.data as PublicClientPayload)]
      : clientSites.filter((site) => site.slug === standaloneSlug)
    : (content.data as PublicClientPayload[] | undefined)?.map(hydrateClientSite) ?? clientSites;
  const segments = window.location.pathname.split("/").filter(Boolean);
  const envTestClient = normalizeClientSlug(import.meta.env.VITE_SITES_TEST_CLIENT_NAME);
  const slug = standaloneSlug ??
    (segments[1] === "test"
      ? normalizeClientSlug(new URLSearchParams(window.location.search).get("client")) || envTestClient
      : segments[1]);
  const client = sites.find((site) => site.slug === slug);
  const routeSegment = standaloneSlug ? segments[0] : segments[2];
  const page = resolveClientRoute(routeSegment) as Exclude<SkilloopzPage, "overview"> | undefined;
  const legal = slug === "privacy" || slug === "terms" || slug === "cookies" ? slug : undefined;
  const clientPage = page ?? "overview";
  const skilloopzHome = client?.slug === "skilloopz" && clientPage === "overview";
  const codexsunHome = client?.slug === "codexsun" && clientPage === "overview";
  const logicxHome = client?.slug === "logicx" && clientPage === "overview";
  return (
    <div id="main-content" className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      {legal ? (
        <>
          <PortalHeader />
          <LegalPage kind={legal} />
          <PortalFooter />
        </>
      ) : client ? (
        <>
          {skilloopzHome || codexsunHome || logicxHome ? null : (
            <PortalHeader accent={accentClasses[client.accent].text} clientSlug={client.slug} standalone={Boolean(standaloneSlug)} />
          )}
          <Suspense fallback={<ClientLoading />}>
            {routeSegment && !page && !legal ? <ClientNotFound client={client} /> : client.slug === "skilloopz" ? (
              <SkilloopzSitePage client={client} page={clientPage} />
            ) : client.slug === "codexsun" && codexsunHome ? (
              <CodexsunHome client={client} />
            ) : client.slug === "logicx" && logicxHome ? (
              <LogicxHome client={client} />
            ) : (
              <ClientSitePage
                client={client}
                page={clientPage === "learning-path" || clientPage === "placement-path" ? "overview" : clientPage}
              />
            )}
          </Suspense>
          <PortalFooter client={client} standalone={Boolean(standaloneSlug)} />
        </>
      ) : (
        <PortalHome />
      )}
    </div>
  );
}

function normalizeClientSlug(value: string | null | undefined): string | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return normalized || undefined;
}

async function readClientSites(): Promise<PublicClientPayload[]> {
  const response = await fetch("/api/v1/sites/public/clients", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Public content request failed: ${response.status}`);
  return response.json() as Promise<PublicClientPayload[]>;
}

async function readClientSite(slug: string): Promise<PublicClientPayload> {
  const response = await fetch(`/api/v1/sites/public/clients/${slug}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Public content request failed: ${response.status}`);
  return response.json() as Promise<PublicClientPayload>;
}

function PortalHome({ sites: loadedSites }: { sites?: ClientSite[] }) {
  const content = useQuery({ queryKey: ["sites", "public", "clients"], queryFn: readClientSites, staleTime: 60_000 });
  const sites = loadedSites ?? content.data?.map(hydrateClientSite) ?? clientSites;
  return (
    <>
      <PortalHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-10 lg:pt-28">
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.28em] text-cyan-300">Sites / client portal</p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-7xl">
              One calm place to publish many different worlds.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              A modular hosting CMS for client sites that need the speed of static pages and the flexibility of dynamic
              content.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                href="#clients"
              >
                Explore client sites <ArrowRightIcon className="ml-2 inline size-4" />
              </a>
              <a
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/35"
                href="/"
              >
                Open workspace
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <div className="absolute -right-14 -top-16 size-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <p className="relative text-sm text-slate-400">A small system with room to grow</p>
            <div className="relative mt-10 grid grid-cols-2 gap-6">
              <PortalMetric value="04" label="client spaces" />
              <PortalMetric value="02" label="delivery modes" />
              <PortalMetric value="01" label="shared foundation" />
              <PortalMetric value="∞" label="future pages" />
            </div>
            <div className="relative mt-10 border-t border-white/10 pt-5 text-sm text-slate-300">
              <span className="mr-2 inline-block size-2 rounded-full bg-emerald-400" /> Public pages are ready to browse
            </div>
          </div>
        </section>
        <section id="clients" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-24 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Client spaces</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Four distinct voices. One flexible foundation.
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-slate-500 md:block">
              Each site is a content surface today and a CMS-managed experience tomorrow.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sites.map((client) => (
              <ClientCard key={client.slug} client={client} />
            ))}
          </div>
        </section>
        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-16 md:grid-cols-3 lg:px-10">
            {portalFeatures.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl p-5">
                <Icon className="size-5 text-cyan-300" />
                <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PortalFooter />
    </>
  );
}

function ClientCard({ client }: { client: ClientSite }) {
  const accent = accentClasses[client.accent];
  const Icon = client.icon;
  return (
    <a
      className={`group flex min-h-80 flex-col justify-between rounded-[1.5rem] border ${accent.line} ${accent.soft} p-6 transition hover:-translate-y-1 hover:bg-white/[0.08]`}
      href={`/clients/${client.slug}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <Icon className={`size-5 ${accent.text}`} />
          <span className="text-sm text-slate-500">/{client.slug}</span>
        </div>
        <h3 className="mt-16 text-2xl font-semibold text-white">{client.name}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{client.description}</p>
      </div>
      <span className={`mt-8 inline-flex items-center text-sm font-medium ${accent.text}`}>
        View public page <ArrowRightIcon className="ml-2 size-4 transition group-hover:translate-x-1" />
      </span>
    </a>
  );
}

function PortalHeader({ accent = "text-cyan-300", clientSlug, standalone = false }: { accent?: string; clientSlug?: string; standalone?: boolean }) {
  const base = clientSlug ? clientPath(clientSlug) : "/clients";
  const activePath = window.location.pathname.split("/").filter(Boolean).at(-1);
  return (
    <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-3 focus:z-20 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950" href="#main-content">Skip to content</a>
      <a className="flex items-center gap-3 text-sm font-semibold tracking-tight text-white" href={standalone ? "/" : "/clients"}>
        <span className={`grid size-8 place-items-center rounded-lg bg-white text-xs text-slate-950 ${accent}`}>S</span>{" "}
        Sites <span className="hidden text-slate-600 sm:inline">/ Client portal</span>
      </a>
      <nav className="hidden items-center gap-7 text-sm text-slate-400 sm:flex">
        {clientSlug ? (
          <>
            {clientRouteManifests.map((route) => <a key={route.path} aria-current={activePath === route.path ? "page" : undefined} className="transition hover:text-white" href={`${base}/${route.path}`}>{route.label}</a>)}
          </>
        ) : (
          <a className="transition hover:text-white" href="/clients#clients">
            Clients
          </a>
        )}
        <a className="transition hover:text-white" href={standalone ? "/clients" : "/"}>
          CMS workspace
        </a>
      </nav>
      <details className="sm:hidden">
        <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-white/10" aria-label="Open navigation"><MenuIcon className="size-5 text-slate-300" /></summary>
        <nav aria-label="Mobile navigation" className="absolute right-6 top-20 z-10 grid min-w-44 gap-1 rounded-2xl border border-white/10 bg-slate-900 p-2 text-sm text-slate-300 shadow-2xl">
          {clientSlug ? clientRouteManifests.map((route) => <a key={route.path} aria-current={activePath === route.path ? "page" : undefined} className="rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white" href={`${base}/${route.path}`}>{route.label}</a>) : <a className="rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white" href="/clients#clients">Clients</a>}
          <a className="rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white" href={standalone ? "/clients" : "/"}>CMS workspace</a>
        </nav>
      </details>
    </header>
  );
}

function ClientLoading() {
  return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-300"><div role="status" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm">Loading client site…</div></div>;
}

function ClientError({ slug }: { slug: string }) {
  return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-300"><div className="max-w-md rounded-2xl border border-rose-300/20 bg-rose-300/10 p-6"><h1 className="text-xl font-semibold text-white">Client site unavailable</h1><p className="mt-3 text-sm leading-6">The public content for <span className="text-white">{slug}</span> could not be loaded. Please try again later.</p></div></div>;
}

function ClientNotFound({ client }: { client: ClientSite }) {
  return <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 lg:px-10"><p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{client.name} / 404</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-white">This page is not part of the site yet.</h1><p className="mt-6 text-lg leading-8 text-slate-400">Return to the client overview or choose one of the published routes.</p><a className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950" href={clientPath(client.slug)}>Back to overview</a></main>;
}

function PortalFooter({ client, standalone = false }: { client?: ClientSite; standalone?: boolean }) {
  const footer = client?.footer;
  const contact = client?.contact;
  const location = client?.location;
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-10">
        <div>
          <p className="text-lg font-semibold text-white">{client?.name ?? "Sites client portal"}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            {footer?.tagline ?? "Editor-controlled client sites, composed from reusable sections."}
          </p>
          {client ? (
            <div className="mt-6 flex gap-3">
              {(client.socialLinks ?? []).map((link) => {
                const Icon = socialIcon(link.label);
                return (
                  <a
                    key={link.href}
                    aria-label={link.label}
                    className="grid size-9 place-items-center rounded-full border border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
        {client ? (
          <>
            <div className="grid gap-3 text-sm text-slate-400">
              <p className="font-medium text-white">Contact</p>
              {contact?.email ? (
                <a className="flex items-center gap-2 hover:text-white" href={`mailto:${contact.email}`}>
                  <MailIcon className="size-4" />
                  {contact.email}
                </a>
              ) : null}
              {contact?.phone ? (
                <a className="flex items-center gap-2 hover:text-white" href={`tel:${contact.phone}`}>
                  <PhoneIcon className="size-4" />
                  {contact.phone}
                </a>
              ) : null}
            </div>
            <div className="grid gap-3 text-sm text-slate-400">
              <p className="font-medium text-white">Location</p>
              {location ? (
                <p className="flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                  {location.address}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 border-t border-white/10 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>{footer?.copyright ?? "Sites client portal"}</span>
        <span className="flex gap-4">
          <a className="hover:text-white" href={standalone ? "/privacy" : "/clients/privacy"}>
            Privacy
          </a>
          <a className="hover:text-white" href={standalone ? "/terms" : "/clients/terms"}>
            Terms
          </a>
          <a className="hover:text-white" href={standalone ? "/cookies" : "/clients/cookies"}>
            Cookies
          </a>
        </span>
      </div>
    </footer>
  );
}
function socialIcon(label: string): LucideIcon {
  return label.toLowerCase().includes("mail") ? MailIcon : Globe2Icon;
}
function PortalMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  );
}
