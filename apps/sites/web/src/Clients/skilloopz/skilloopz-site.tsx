import { ArrowRightIcon } from "lucide-react";
import { type ClientSite } from "../../shared/client-data";
import { Seo, StructuredData } from "../../shared/seo";
import { SkilloopzHome } from "./skilloopz-home";

export type SkilloopzPage = "overview" | "learning-path" | "placement-path" | "about" | "services" | "work" | "contact";

export function SkilloopzSitePage({ client, page }: { client: ClientSite; page: SkilloopzPage }) {
  const title =
    page === "overview"
      ? client.seo.title
      : `${page === "learning-path" ? "Learning Path" : page === "placement-path" ? "Placement Path" : `${page[0].toUpperCase()}${page.slice(1)}`} | ${client.name}`;
  const description =
    page === "overview"
      ? client.seo.description
      : `${page === "learning-path" ? "Learning Path" : page === "placement-path" ? "Placement Path" : `${page[0].toUpperCase()}${page.slice(1)}`} for ${client.name}. ${client.description}`;
  return (
    <>
      <Seo title={title} description={description} keywords={client.seo.keywords} />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: client.name,
          description,
          url: window.location.href,
        }}
      />
      {page === "overview" ? (
        <SkilloopzHome client={client} />
      ) : (
        <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 lg:px-10">
          <SubPage client={client} page={page} />
        </main>
      )}
    </>
  );
}

function SubPage({ client, page }: { client: ClientSite; page: Exclude<SkilloopzPage, "overview"> }) {
  const headings = {
    "learning-path": "Learn the skills employers need next.",
    "placement-path": "Turn practice into career momentum.",
    about: "Learning should feel useful, human, and possible.",
    services: "Paths for the next version of you.",
    work: "Learning experiences with momentum built in.",
    contact: "Start your next learning loop.",
  };
  return (
    <>
      <section className="max-w-3xl pb-16 pt-12">
        <p className="text-sm uppercase tracking-[0.24em] text-violet-300">
          {client.name} / {page}
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">{headings[page]}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-400">{client.description}</p>
      </section>
      {page === "learning-path" && <LearningPath client={client} />}
      {page === "placement-path" && <PlacementPath client={client} />}
      {page === "about" && <About client={client} />}
      {page === "services" && <Services client={client} />}
      {page === "work" && <Work client={client} />}
      {page === "contact" && <Contact client={client} />}
    </>
  );
}

function LearningPath({ client }: { client: ClientSite }) {
  return (
    <section className="grid gap-4 border-t border-white/10 py-14 md:grid-cols-3">
      {["Choose a focused program", "Build with mentor feedback", "Publish practical proof"].map((step, index) => (
        <article key={step} className="min-h-56 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-violet-300">0{index + 1}</p>
          <h2 className="mt-16 text-xl font-semibold text-white">{step}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {client.services[index] ?? "Industry-focused learning"} helps you turn practice into capability.
          </p>
        </article>
      ))}
    </section>
  );
}

function PlacementPath({ client }: { client: ClientSite }) {
  return (
    <section className="grid gap-8 border-t border-white/10 py-14 md:grid-cols-[.8fr_1.2fr]">
      <h2 className="text-2xl font-semibold text-white">From learning to a clear next step.</h2>
      <div>
        <p className="text-lg leading-8 text-slate-300">
          {client.about} Use practical projects, mentor guidance, and career preparation to move toward placement with
          confidence.
        </p>
        <div className="mt-8 grid gap-3">
          {["Prepare your portfolio", "Practice interview conversations", "Connect with opportunity"].map(
            (step, index) => (
              <div key={step} className="flex items-center gap-4 border-b border-white/10 py-5 text-slate-200">
                <span className="text-sm text-violet-300">0{index + 1}</span>
                {step}
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function About({ client }: { client: ClientSite }) {
  return (
    <section className="grid gap-10 border-t border-white/10 py-14 md:grid-cols-[0.8fr_1.2fr]">
      <h2 className="text-2xl font-semibold text-white">A network for practical progress</h2>
      <div>
        <p className="text-lg leading-8 text-slate-300">{client.about}</p>
        <div className="mt-10 grid gap-3">
          {client.approach.map((step, index) => (
            <div key={step} className="flex items-center gap-4 border-b border-white/10 py-5 text-slate-200">
              <span className="text-sm text-violet-300">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function Services({ client }: { client: ClientSite }) {
  return (
    <section className="grid gap-4 border-t border-white/10 py-14 md:grid-cols-3">
      {client.services.map((service, index) => (
        <article key={service} className="min-h-56 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-violet-300">0{index + 1}</p>
          <h2 className="mt-16 text-xl font-semibold text-white">{service}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            A focused, practical way for learners and teams to turn interest into capability.
          </p>
        </article>
      ))}
    </section>
  );
}
function Work({ client }: { client: ClientSite }) {
  return (
    <section className="border-t border-white/10 py-14">
      <div className="grid gap-4 md:grid-cols-3">
        {client.work.map((item) => (
          <article key={item.title} className="min-h-64 border-t border-white/15 pt-5">
            <p className="text-sm text-violet-300">{item.type}</p>
            <h2 className="mt-12 text-xl font-semibold text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function Contact({ client }: { client: ClientSite }) {
  const email = client.contact?.email || (import.meta.env.VITE_SITES_CONTACT_EMAIL as string | undefined);
  return (
    <section className="grid gap-4 border-t border-white/10 py-14 md:grid-cols-2">
      <div className="rounded-[2rem] border border-violet-300/25 bg-violet-300/10 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-violet-200">
          {client.contact?.label ?? client.contactLabel}
        </p>
        <p className="mt-5 text-lg leading-8 text-slate-200">Tell us what you want to learn, teach, or build next.</p>
        {email ? (
          <a
            className="mt-8 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-violet-200"
            href={`mailto:${email}`}
          >
            Email the team <ArrowRightIcon className="ml-2 size-4" />
          </a>
        ) : null}
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Connect with Skilloopz</p>
        {client.location ? <p className="mt-5 text-lg leading-8 text-slate-200">{client.location.address}</p> : null}
        {client.contact?.phone ? <p className="mt-4 text-sm text-slate-400">{client.contact.phone}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {(client.socialLinks ?? []).map((link) => (
            <a
              key={link.href}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-white/40 hover:text-white"
              href={link.href}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
