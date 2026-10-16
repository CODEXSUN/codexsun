"use client";

import { useMemo, useState } from "react";
import PrecisionCursor from "./PrecisionCursor";

type WorkMetric = {
  label: string;
  value: string;
  detail: string;
};

type ProjectItem = {
  title: string;
  slug: string;
  type: string;
  client: string;
  year: string;
  role: string;
  heroLine: string;
  problem: string;
  research: string;
  design: string;
  engineering: string;
  result: string;
  impact: string;
  description: string;
  visual: string;
  previewImage: string;
  previewImages: string[];
  status: "live" | "draft" | "building";
  visibility: "public" | "private";
  previewUrl: string;
  liveUrl: string;
  repoUrl: string;
  caseStudyUrl: string;
  version: string;
  stack: string[];
  services: string[];
  metrics: WorkMetric[];
  deployment: {
    provider: "vercel" | "custom" | "none";
    projectName: string;
    productionUrl: string;
    previewUrl: string;
    status: "not-configured" | "queued" | "building" | "ready" | "error";
    environment: "production" | "preview" | "development";
    buildCommand: string;
    outputDirectory: string;
    notes: string;
  };
};

type DrawerKey = "brief" | "story" | "proof" | "build" | "links";

type SiteStatus = {
  configured?: boolean;
  ok?: boolean;
  state?: "online" | "offline" | "error" | "not-connected";
  message?: string;
  status?: number;
  latencyMs?: number;
  checkedAt?: string;
};

const drawerItems: { id: DrawerKey; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "story", label: "Story" },
  { id: "proof", label: "Proof" },
  { id: "build", label: "Build" },
  { id: "links", label: "Links" }
];

function projectUrl(item: ProjectItem) {
  const raw =
    item.liveUrl ||
    item.deployment.productionUrl ||
    item.previewUrl ||
    item.deployment.previewUrl ||
    "";
  if (!raw || raw === "#") return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function fallbackMetrics(item: ProjectItem): WorkMetric[] {
  return [
    { label: "Proof", value: "Clear", detail: item.result || "Story proof is being shaped." },
    {
      label: "System",
      value: "Built",
      detail: item.engineering || "Engineering notes are being prepared."
    },
    { label: "Care", value: "Active", detail: item.impact || "Product care path is being refined." }
  ];
}

function galleryImages(item: ProjectItem): string[] {
  return Array.from(new Set([item.previewImage, ...(item.previewImages ?? [])].filter(Boolean)));
}

export default function ProjectCaseRoom({
  item,
  nextProject
}: {
  item: ProjectItem;
  nextProject?: { title: string; slug: string } | null;
}) {
  const [active, setActive] = useState<DrawerKey>("brief");
  const url = projectUrl(item);
  const [siteStatus] = useState<SiteStatus>({
    state: url ? "online" : "not-connected",
    configured: Boolean(url),
    ok: Boolean(url)
  });
  const checkingStatus = false;
  const metrics = item.metrics.length ? item.metrics : fallbackMetrics(item);
  const drawer = useMemo(() => buildDrawerContent(item, metrics, url), [item, metrics, url]);

  return (
    <>
      <PrecisionCursor />
      <main className="h-screen overflow-hidden bg-[#0d0c0a] text-carbon">
        <section className="grid h-screen lg:grid-cols-[112px_1fr]">
          <aside className="hidden border-r border-carbon/10 bg-[#0b0b09] text-frost lg:flex lg:flex-col lg:justify-between lg:p-8">
            <a href="/#work" className="text-[10px] font-black uppercase tracking-[0.24em]">
              CXS
            </a>
            <nav className="grid gap-6 text-[10px] uppercase tracking-[0.18em] text-frost/45">
              <a href="/#hero" className="hover:text-frost">
                Home
              </a>
              <a href="/#work" className="text-frost">
                Work
              </a>
              <a href="/#contact" className="hover:text-frost">
                Contact
              </a>
            </nav>
            <span className="writing-vertical text-[10px] uppercase tracking-[0.22em] text-frost/35">
              Case room
            </span>
          </aside>

          <div className="relative overflow-hidden bg-[#f4efe4]">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.026)_1px,transparent_1px),linear-gradient(rgba(10,10,10,0.024)_1px,transparent_1px)] bg-[size:96px_100%,100%_8px]" />
            <div className="pointer-events-none absolute right-[-18vw] top-[-18vw] h-[42vw] w-[42vw] rounded-full border border-[#9f8f73]/25" />

            <div className="relative z-10 grid h-screen min-h-0 grid-rows-[auto_1fr] px-5 py-5 md:px-8 md:py-6 lg:px-10">
              <header className="flex h-8 shrink-0 items-center justify-between gap-5 text-carbon">
                <a href="/#work" className="text-[11px] font-black uppercase tracking-[0.16em]">
                  {"<-"} Work
                </a>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-carbon/45">
                  <span>{item.status}</span>
                  <span className="hidden h-px w-10 bg-carbon/20 sm:block" />
                  <StatusChip status={siteStatus} checking={checkingStatus} />
                </div>
              </header>

              <section className="grid min-h-0 gap-5 pb-4 pt-5 lg:grid-cols-[minmax(0,1fr)_430px]">
                <HeroPreview item={item} url={url} />
                <div className="flex min-h-0 flex-col gap-4">
                  <section className="shrink-0 border border-carbon/10 bg-[#e8dfd0]/70 p-5 shadow-[0_20px_70px_rgba(86,75,58,0.08)]">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-[#7b6b52]">
                      {item.type}
                    </p>
                    <h1 className="font-display text-[4.2rem] uppercase leading-[0.82] md:text-[5.5rem]">
                      {item.title}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-carbon/68">
                      {item.heroLine || item.description || item.result}
                    </p>
                  </section>
                  <CaseDrawer
                    active={active}
                    setActive={setActive}
                    content={drawer[active]}
                    item={item}
                    url={url}
                    siteStatus={siteStatus}
                    checkingStatus={checkingStatus}
                    nextProject={nextProject ?? null}
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function HeroPreview({ item, url }: { item: ProjectItem; url: string }) {
  const images = galleryImages(item);
  const [activeImage, setActiveImage] = useState(0);
  const currentImage = images[activeImage] || images[0] || "";

  return (
    <section className="relative min-h-0 overflow-hidden border border-carbon/10 bg-[#d8d0c1] shadow-[0_22px_80px_rgba(86,75,58,0.12)]">
      {currentImage ? (
        <img
          src={currentImage}
          alt={`${item.title} preview`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full min-h-[420px] items-center justify-center bg-[#e3ddd1]">
          <div className="border border-carbon/10 bg-[#f4efe4]/80 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-carbon/42">
            No preview connected
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 border border-white/20" />
      <div className="absolute left-5 top-5 border border-carbon/10 bg-[#f4efe4]/86 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-carbon/48">
        Hero preview
      </div>
      {images.length > 1 && (
        <div className="absolute right-5 top-5 flex max-w-[42%] gap-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`h-14 w-20 overflow-hidden border bg-[#f4efe4]/80 transition-all ${
                activeImage === index
                  ? "border-carbon shadow-[0_12px_35px_rgba(86,75,58,0.18)]"
                  : "border-carbon/12 opacity-68 hover:opacity-100"
              }`}
              aria-label={`Show preview image ${index + 1}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="absolute bottom-5 left-5 max-w-sm border border-carbon/10 bg-[#f4efe4]/90 p-4 shadow-[0_18px_55px_rgba(86,75,58,0.12)]">
        {url ? (
          <>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7b6b52]">
              Live site connected
            </p>
            <p className="mt-2 text-sm leading-6 text-carbon/62">
              This site is verified through the server. Vercel blocks embedded iframe previews, so
              open it directly for the real page.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex border border-carbon px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-carbon transition-colors hover:bg-carbon hover:text-frost"
            >
              Open live site
            </a>
          </>
        ) : (
          <>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7b6b52]">
              In build preview
            </p>
            <p className="mt-2 text-sm leading-6 text-carbon/62">
              Add a Preview Image URL in Dashboard / Content to replace this surface.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function CaseDrawer({
  active,
  setActive,
  content,
  item,
  url,
  siteStatus,
  checkingStatus,
  nextProject
}: {
  active: DrawerKey;
  setActive: (value: DrawerKey) => void;
  content: { eyebrow: string; title: string; body: string[]; chips?: string[] };
  item: ProjectItem;
  url: string;
  siteStatus: SiteStatus;
  checkingStatus: boolean;
  nextProject?: { title: string; slug: string } | null;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col border border-carbon/10 bg-[#fffaf0] text-carbon shadow-[0_30px_90px_rgba(86,75,58,0.12)]">
      <div className="grid shrink-0 grid-cols-5 border-b border-carbon bg-[#0d0c0a]">
        {drawerItems.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActive(entry.id)}
            onMouseEnter={() => setActive(entry.id)}
            className={`border-r border-frost/10 px-2 py-3 text-left text-[10px] uppercase tracking-[0.16em] transition-colors last:border-r-0 ${
              active === entry.id ? "bg-[#fffaf0] text-carbon" : "text-frost/45 hover:text-frost"
            }`}
          >
            <span className="block font-mono">{String(index + 1).padStart(2, "0")}</span>
            <span className="mt-1 block">{entry.label}</span>
          </button>
        ))}
      </div>

      <div className="case-drawer-scroll min-h-0 flex-1 overflow-y-auto p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7b6b52]">
          Case document / {content.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-[3.15rem] uppercase leading-[0.84]">
          {content.title}
        </h2>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-carbon/10 py-4 text-sm">
          {[
            ["Client", item.client || "CODEXSUN"],
            ["Year", item.year],
            ["Role", item.role || "End-to-end"],
            ["Version", item.version]
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-carbon/38">{label}</dt>
              <dd className="mt-1 font-medium leading-5 text-carbon">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 border border-carbon/10 bg-[#e8dfd0]/45 p-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7b6b52]">
              Live verification
            </p>
            <StatusChip status={siteStatus} checking={checkingStatus} />
          </div>
          <p className="mt-2 text-xs leading-5 text-carbon/55">
            {statusMessage(siteStatus, checkingStatus)}
          </p>
        </div>
        <div className="mt-6 grid gap-4">
          {content.body.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-7 text-carbon/68">
              {paragraph}
            </p>
          ))}
        </div>
        {content.chips && content.chips.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2">
            {content.chips.map((chip) => (
              <span
                key={chip}
                className="border border-carbon/12 bg-[#e8dfd0]/52 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-carbon/55"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid shrink-0 border-t border-carbon/10 sm:grid-cols-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-carbon/10 px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-carbon hover:bg-[#0d0c0a] hover:text-frost sm:border-b-0 sm:border-r"
          >
            Open site
          </a>
        ) : (
          <span className="border-b border-carbon/10 px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-carbon/35 sm:border-b-0 sm:border-r">
            Site not connected
          </span>
        )}
        {nextProject ? (
          <a
            href={`/work/${nextProject.slug}`}
            className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-carbon hover:bg-[#0d0c0a] hover:text-frost"
          >
            Next: {nextProject.title}
          </a>
        ) : (
          <a
            href="/#contact"
            className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-carbon hover:bg-[#0d0c0a] hover:text-frost"
          >
            Let&apos;s build
          </a>
        )}
      </div>
    </aside>
  );
}

function statusMessage(status: SiteStatus, checking: boolean) {
  if (checking && !status.checkedAt) return "Checking the connected preview from the server.";
  if (status.state === "not-connected") return "No Vercel/live URL is connected yet.";
  if (status.state === "online") {
    return `Online${status.status ? ` / HTTP ${status.status}` : ""}${status.latencyMs ? ` / ${status.latencyMs}ms` : ""}.`;
  }
  if (status.state === "offline") return status.message || "The connected site did not respond.";
  if (status.state === "error") return status.message || "The connected site returned an error.";
  return "Waiting for verification.";
}

function StatusChip({ status, checking }: { status: SiteStatus; checking: boolean }) {
  const state = status.state ?? (checking ? "checking" : "unknown");
  const label =
    checking && !status.checkedAt
      ? "Checking"
      : state === "online"
        ? "Live online"
        : state === "not-connected"
          ? "In build preview"
          : state === "offline"
            ? "Offline"
            : state === "error"
              ? "Site error"
              : "Verifying";
  const tone =
    state === "online"
      ? "border-[#6f7d5a]/45 text-[#4f5d3f]"
      : state === "not-connected"
        ? "border-carbon/15 text-carbon/45"
        : "border-[#9b4f45]/45 text-[#8a3f36]";

  return (
    <span className={`inline-flex items-center gap-2 border px-2.5 py-1 ${tone}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state === "online"
            ? "bg-[#4f5d3f]"
            : state === "not-connected"
              ? "bg-carbon/30"
              : "bg-[#8a3f36]"
        } ${checking ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  );
}

function buildDrawerContent(item: ProjectItem, metrics: WorkMetric[], url: string) {
  return {
    brief: {
      eyebrow: "Project brief",
      title: item.heroLine || "Clarity system",
      body: [
        item.description ||
          item.result ||
          "A product story shaped around clarity, usability, and long-term value.",
        `${item.client || "CODEXSUN"} / ${item.year || "2026"} / ${item.role || "End-to-end product work"}`
      ],
      chips: [item.type, item.status, item.version].filter(Boolean)
    },
    story: {
      eyebrow: "Narrative",
      title: "Problem to proof",
      body: [
        item.problem || "The problem statement is being refined.",
        item.research || "Research notes are being prepared.",
        item.design || "Design decisions will appear here.",
        item.engineering || "Engineering notes will appear here."
      ]
    },
    proof: {
      eyebrow: "Evidence",
      title: "Measured signal",
      body: metrics.map((metric) => `${metric.label}: ${metric.value}. ${metric.detail}`)
    },
    build: {
      eyebrow: "System",
      title: "Built to last",
      body: [
        item.engineering || "The engineering path is being documented.",
        item.deployment.notes || "Deployment notes will appear once the preview is connected.",
        `Deployment: ${item.deployment.provider} / ${item.deployment.status}`
      ],
      chips: [
        ...(item.stack.length ? item.stack : ["Frontend", "Product system"]),
        ...(item.services || [])
      ].slice(0, 8)
    },
    links: {
      eyebrow: "Access",
      title: url ? "Preview ready" : "Preview pending",
      body: [
        url
          ? "The project has a connected preview or live URL. Open it from the drawer action below."
          : "Connect a live URL or preview URL in Dashboard / Content. Add a Preview Image URL when you want this case room to show artwork.",
        item.caseStudyUrl
          ? `Case study: ${item.caseStudyUrl}`
          : "Case study link not connected yet.",
        item.repoUrl ? `Repository: ${item.repoUrl}` : "Repository link not public."
      ]
    }
  };
}
