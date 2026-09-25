import { ArrowUpRightIcon, BotIcon, BracesIcon, DatabaseIcon, Globe2Icon, ServerCogIcon } from "lucide-react";
import { clientPath, type ClientSite } from "../../shared/client-data";

const services = [
  [BracesIcon, "Custom software", "Purpose-built systems for the way your team works."],
  [DatabaseIcon, "Tally integration", "Finance data connected, validated, and reconciled."],
  [ServerCogIcon, "ERPNext delivery", "Practical ERP rollout shaped around real operations."],
  [Globe2Icon, "Website engineering", "Fast digital experiences built to keep evolving."],
  [BotIcon, "Workflow automation", "Rules and approvals that remove repetitive work."],
  [ServerCogIcon, "Hosting and care", "Reliable production care after every launch."],
] as const;

export function LogicxHome({ client }: { client: ClientSite }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f2f7ff] text-[#071326] dark:bg-[#050b16] dark:text-[#edf4ff]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#cbd9ed]/70 bg-[#f2f7ff]/85 px-5 py-4 backdrop-blur-xl dark:border-[#263c5b] dark:bg-[#050b16]/85 sm:px-10">
        <a className="flex items-center gap-3 font-semibold" href={clientPath(client.slug)}>
          <span className="grid size-9 place-items-center rounded-xl bg-[#165dff] text-sm font-black text-white shadow-lg shadow-blue-500/25">
            LX
          </span>
          Logicx Info Tech
        </a>
        <nav className="hidden gap-7 text-sm text-[#52647e] md:flex">
          <a href="#services">Services</a>
          <a href="#method">Method</a>
          <a href="#contact">Contact</a>
        </nav>
        <a
          href="#contact"
          className="rounded-full border border-[#165dff]/30 px-4 py-2 text-xs font-semibold text-[#165dff]"
        >
          Discuss a workflow
        </a>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-10 lg:grid-cols-2 lg:items-center lg:pt-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#165dff]">{client.eyebrow}</p>
          <h1 className="mt-5 max-w-xl text-6xl font-semibold leading-[.94] tracking-[-.065em] text-[#071326] dark:text-white sm:text-8xl">
            Practical systems. Built around your business.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#52647e] dark:text-[#9bacc4]">
            {client.description} Connect operations, finance, and customer workflows through purposeful software that
            fits the way your team works.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#165dff] px-5 py-3 text-sm font-semibold text-white"
            >
              Discuss your workflow <ArrowUpRightIcon className="size-4" />
            </a>
            <a
              href="#services"
              className="rounded-full border border-[#cbd9ed] px-5 py-3 text-sm font-semibold text-[#071326] dark:border-[#334c70] dark:text-white"
            >
              Explore services
            </a>
          </div>
        </div>
        <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#071326] p-6 text-white shadow-2xl shadow-blue-900/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(22,93,255,.45),transparent_45%)]" />
          <div className="absolute inset-14 rounded-full border border-blue-300/30 [transform:rotate(-15deg)]" />
          <div className="absolute inset-24 rounded-full border border-blue-300/25 [transform:rotate(35deg)]" />
          <div className="relative grid min-h-[330px] place-items-center">
            <div className="grid size-28 place-items-center rounded-full border-[10px] border-blue-950 bg-gradient-to-br from-blue-400 to-blue-700 text-center shadow-[0_0_45px_rgba(22,93,255,.65)]">
              <strong className="text-3xl">LX</strong>
              <small className="text-[8px] uppercase tracking-widest text-blue-100">Connected</small>
            </div>
            <span className="absolute left-0 top-8 rounded-xl border border-blue-300/30 bg-blue-950/70 px-4 py-3 text-xs">
              Operations
            </span>
            <span className="absolute right-0 top-16 rounded-xl border border-blue-300/30 bg-blue-950/70 px-4 py-3 text-xs">
              Finance
            </span>
            <span className="absolute bottom-12 left-2 rounded-xl border border-blue-300/30 bg-blue-950/70 px-4 py-3 text-xs">
              Experience
            </span>
            <span className="absolute bottom-6 right-2 rounded-xl border border-blue-300/30 bg-blue-950/70 px-4 py-3 text-xs">
              Automation
            </span>
          </div>
          <div className="flex justify-center gap-4 text-[10px] uppercase tracking-[.2em] text-blue-100/60">
            Discover <span>·</span> Connect <span>·</span> Deliver
          </div>
        </div>
      </section>
      <div className="overflow-hidden bg-[#071326] py-5 text-center text-xs font-bold uppercase tracking-[.2em] text-white">
        <div className="flex justify-center gap-8 text-[#a8ff5e]">
          <span>Custom software</span>
          <span>ERPNext</span>
          <span>Tally</span>
          <span>Web systems</span>
          <span>Automation</span>
        </div>
      </div>
      <section id="services" className="bg-[#e4eefc]/70 px-5 py-20 dark:bg-[#081120] sm:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#165dff]">What we build</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Useful technology, joined properly.
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-[#52647e] dark:text-[#9bacc4]">
            Each engagement starts with the real workflow, then chooses the smallest reliable combination of product,
            integration, and infrastructure needed to improve it.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map(([Icon, title, description], index) => (
              <article
                key={title}
                className="min-h-64 rounded-3xl border border-blue-900/10 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 dark:border-blue-300/15 dark:bg-[#0f1f38]"
              >
                <span className="float-right font-mono text-xs text-[#165dff]/60">0{index + 1}</span>
                <div className="grid size-12 place-items-center rounded-2xl bg-[#165dff] text-white shadow-lg shadow-blue-500/20">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-16 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-[#52647e] dark:text-[#9bacc4]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="method" className="mx-auto max-w-7xl px-5 py-20 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#165dff]">Delivery method</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Clear from discovery to support.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Discover first", "Process, people, data, and exceptions"],
            ["02", "Release in stages", "Useful milestones with visible progress"],
            ["03", "Own the outcome", "Documentation, monitoring, and continued care"],
          ].map(([number, title, text]) => (
            <div key={number} className="border-t-2 border-[#165dff] pt-5">
              <span className="font-mono text-xs text-[#165dff]">{number}</span>
              <h3 className="mt-10 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-[#52647e] dark:text-[#9bacc4]">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="contact" className="mx-auto max-w-7xl px-5 pb-20 sm:px-10">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#071326] to-[#0c2c60] p-8 text-white shadow-2xl shadow-blue-900/20 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#a8ff5e]">{client.contactLabel}</p>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Make the next system easier to run.
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-blue-100/70">
            Share the process that is slowing your team down. We will help shape a practical path to a dependable
            software system.
          </p>
          <a
            href={`mailto:${client.contact?.email ?? "hello@logicx.in"}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#a8ff5e] px-5 py-3 text-sm font-semibold text-[#102a00]"
          >
            {client.contact?.email ?? "hello@logicx.in"} <ArrowUpRightIcon className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
