import { ArrowUpRightIcon, CheckCircle2Icon, ChevronRightIcon, Layers3Icon } from "lucide-react";
import { clientPath, type ClientSite } from "../../shared/client-data";

const work = [
  ["CODEXSUN Platform", "Business operating platform", "One governed workspace for the work that runs a business."],
  ["Billing Suite", "Billing and control", "Commercial documents become operational intelligence."],
  ["ZERO", "Permission-aware AI", "Business intelligence that respects the business."],
] as const;

const capabilities = [
  ["01", "Business platform", "A modular operating layer for companies, teams, branches, and industries."],
  ["02", "Unified experience", "Dense, clear workspaces designed for real business operations."],
  ["03", "Billing and accounting", "GST-ready documents, ledgers, payments, and financial control."],
  ["04", "AI and automation", "Permission-aware assistance, workflow automation, and intelligence."],
] as const;

export function CodexsunHome({ client }: { client: ClientSite }) {
  return (
    <main className="overflow-hidden bg-[#090909] text-[#f5f5f0]">
      <section className="relative isolate min-h-[720px] border-b border-white/10 px-6 pb-24 pt-8 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_22%,rgba(35,208,198,.2),transparent_30%),linear-gradient(115deg,#090909_35%,#0d2528)]" />
        <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
          <a href={clientPath(client.slug)} className="flex items-center gap-3 text-sm font-semibold tracking-[.18em]">
            <span className="grid size-9 place-items-center rounded-full border border-cyan-200/50 text-xs text-cyan-200">
              CS
            </span>
            CODEXSUN
          </a>
          <nav className="hidden gap-7 text-[11px] uppercase tracking-[.2em] text-white/55 md:flex">
            <a href="#work" className="hover:text-white">
              Products
            </a>
            <a href="#approach" className="hover:text-white">
              Approach
            </a>
            <a href="#capabilities" className="hover:text-white">
              Capabilities
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </nav>
          <a
            href="#contact"
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[.14em] text-cyan-100 hover:border-cyan-200"
          >
            Start a conversation
          </a>
        </header>
        <div className="mx-auto grid max-w-7xl gap-14 pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pt-36">
          <div>
            <p className="mb-6 text-xs uppercase tracking-[.32em] text-cyan-200">
              {client.eyebrow} / {client.statement}
            </p>
            <h1 className="max-w-4xl whitespace-pre-line text-6xl font-semibold uppercase leading-[.88] tracking-[-.075em] text-white sm:text-8xl">
              WE TURN{`\n`}COMPLEXITY{`\n`}INTO <span className="text-cyan-200">CLARITY</span>
            </h1>
            <p className="mt-9 max-w-xl text-lg leading-8 text-white/60">
              {client.description} Run your website, billing, users, and daily work from one clean workspace that feels
              easy from the first click.
            </p>
            <a href="#work" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              Explore selected work <ArrowUpRightIcon className="size-4" />
            </a>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-black/30 p-6 shadow-2xl shadow-cyan-950/40">
            <div className="absolute inset-8 rounded-full border border-cyan-200/15 [box-shadow:0_0_100px_rgba(36,214,200,.22)]" />
            <div className="absolute inset-20 rounded-full border border-cyan-200/25" />
            <div className="relative grid min-h-60 place-items-center text-center">
              <Layers3Icon className="size-12 text-cyan-200" />
              <span className="mt-4 block text-xs uppercase tracking-[.28em] text-white/55">
                Software makes simple.
              </span>
            </div>
            <div className="absolute bottom-5 left-6 right-6 flex justify-between text-[10px] uppercase tracking-[.2em] text-white/45">
              <span>Platform</span>
              <span>Billing</span>
              <span>Governed AI</span>
            </div>
          </div>
        </div>
      </section>
      <section id="work" className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-cyan-200">Selected work</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Products built for the work behind the work.
            </h2>
          </div>
          <span className="hidden text-xs uppercase tracking-[.2em] text-white/35 sm:block">2026 / 03 systems</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {work.map(([title, type, description], index) => (
            <article
              key={title}
              className="group min-h-80 rounded-3xl border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-cyan-200/40"
            >
              <div className="flex justify-between text-xs text-cyan-200">
                <span>0{index + 1}</span>
                <span>{type}</span>
              </div>
              <h3 className="mt-24 text-2xl font-medium">{title}</h3>
              <p className="mt-3 leading-7 text-white/55">{description}</p>
              <a
                href={clientPath(client.slug, "work")}
                className="mt-7 inline-flex items-center text-sm text-white/70 group-hover:text-cyan-200"
              >
                View case room <ChevronRightIcon className="ml-1 size-4" />
              </a>
            </article>
          ))}
        </div>
      </section>
      <section id="approach" className="border-y border-white/10 bg-white/[.025] px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-cyan-200">Our approach</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">Clarity is a product decision.</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {["Listen deeply", "Make ownership visible", "Ship the next useful version"].map((item, index) => (
              <div key={item} className="border-t border-cyan-200/30 pt-4">
                <span className="text-xs text-cyan-200">0{index + 1}</span>
                <h3 className="mt-12 text-xl">{item}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  A focused step that keeps complex systems legible, governed, and ready to grow.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="capabilities" className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
        <p className="text-xs uppercase tracking-[.28em] text-cyan-200">Capabilities</p>
        <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {capabilities.map(([number, title, description]) => (
            <div key={number} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-white/10 pt-5">
              <span className="text-xs text-cyan-200">{number}</span>
              <div>
                <h3 className="text-xl">{title}</h3>
                <p className="mt-3 max-w-md leading-7 text-white/50">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="contact" className="mx-auto max-w-7xl px-6 pb-24 sm:px-10 lg:px-16">
        <div className="rounded-[2rem] border border-cyan-200/20 bg-cyan-100/[.06] p-8 sm:p-12">
          <p className="text-xs uppercase tracking-[.28em] text-cyan-200">{client.contactLabel}</p>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Build the next clear version of your business.
          </h2>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/65">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-cyan-200" /> {client.contact?.email ?? "hello@codexsun.com"}
            </span>
            <span>{client.location?.address ?? "India / Global delivery"}</span>
          </div>
          <a
            href={`mailto:${client.contact?.email ?? "hello@codexsun.com"}`}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Talk to Codexsun <ArrowUpRightIcon className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
