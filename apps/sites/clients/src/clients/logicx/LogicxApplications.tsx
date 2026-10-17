import { useState } from "react";
import { ArrowUpRight, ArrowLeft, Search, Check } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import { serviceSlug } from "@codexsun/sites-api/page-routes";

export function LogicxApplications({ content, path }: { content: PageContent; path: string }) {
  const design = content.marketing ?? initialLogicxMarketing;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const apps = content.applications ?? [];
  const app = apps.find((item) => path === `/apps/${item.slug}`);
  if (app)
    return (
      <main id="logicx-main" className="lx-shell lx-page">
        <a className="lx-text-link" href="/apps">
          <ArrowLeft size={16} /> All applications
        </a>
        <p className="lx-kicker">APPLICATION / {app.category.toUpperCase()}</p>
        <h1>
          {app.name}
          <em> for your business.</em>
        </h1>
        <p className="lx-intro">{app.summary}</p>
        <div className="lx-detail-columns">
          <section className="lx-stack">
            <h2>What this workspace covers</h2>
            <ul className="lx-check-list">
              {app.features.map((feature) => (
                <li key={feature}>
                  <Check size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <p>
              We confirm available modules, integration needs and deployment scope with you before a
              project starts.
            </p>
          </section>
          <aside className="lx-enquiry-note">
            <p className="lx-kicker">YOUR NEXT STEP</p>
            <h2>Make {app.name} fit your workflow.</h2>
            <p>Tell us how your team works and what you want to connect.</p>
            <a className="lx-button" href={`/contact?app=${encodeURIComponent(app.name)}`}>
              Enquire about {app.name}
              <ArrowUpRight size={17} />
            </a>
            <a
              className="lx-text-link"
              href="https://app.codexsun.com"
              target="_blank"
              rel="noreferrer"
            >
              Existing customer? Sign in <ArrowUpRight size={16} />
            </a>
          </aside>
        </div>
      </main>
    );
  const visible = apps.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      `${item.name} ${item.summary} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main id="logicx-main" className="lx-shell lx-page">
      <p className="lx-kicker">THE LOGICX APPLICATION COLLECTION</p>
      <h1>{design.applications.title}</h1>
      <p className="lx-intro">{design.applications.intro}</p>
      <div className="lx-catalog-tools">
        <label className="lx-search">
          <Search size={18} />
          <span className="lx-sr">Search applications</span>
          <input
            type="search"
            placeholder="Find an application or workflow"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="lx-category-filters" aria-label="Application categories">
          {["All", ...new Set(apps.map((item) => item.category))].map((item) => (
            <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="lx-result-count" role="status">
        {visible.length} applications
      </p>
      <div className="lx-catalog">
        {visible.map((item, i) => (
          <a href={`/apps/${item.slug}`} key={item.slug}>
            <div className="lx-app-card-top">
              <span className="lx-number">{String(i + 1).padStart(2, "0")}</span>
              <span>{item.category}</span>
              <ArrowUpRight size={20} />
            </div>
            <h2>{item.name}</h2>
            <p>{item.summary}</p>
            <span className="lx-text-link">
              Explore application <ArrowUpRight size={16} />
            </span>
          </a>
        ))}
      </div>
      {!visible.length ? <p>No applications match. Try another search or category.</p> : null}
    </main>
  );
}

export function LogicxServiceDetail({ content, path }: { content: PageContent; path: string }) {
  const design = content.marketing ?? initialLogicxMarketing;
  const service = content.finishes.items.find(
    (item) => path === `/services/${serviceSlug(item.name)}`
  );
  if (!service)
    return (
      <main id="logicx-main" className="lx-shell lx-page">
        <h1>Service not found</h1>
        <a href="/services">Explore services</a>
      </main>
    );
  return (
    <main id="logicx-main" className="lx-shell lx-page">
      <a className="lx-text-link" href="/services">
        <ArrowLeft size={16} /> All services
      </a>
      <p className="lx-kicker">LOGICX / SOFTWARE SERVICES</p>
      <h1>{service.name}</h1>
      <p className="lx-intro">{service.detail}</p>
      <div className="lx-capability-labels">
        {design.proofLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      {design.serviceImages.find((item) => item.slug === serviceSlug(service.name)) ? (
        <img
          className="lx-service-detail-image"
          src={design.serviceImages.find((item) => item.slug === serviceSlug(service.name))!.image}
          width="560"
          height="300"
          alt={`${service.name} illustration`}
        />
      ) : null}
      <div className="lx-detail-columns">
        <section className="lx-stack">
          <h2>
            {content.processing.title} {content.processing.emphasis}
          </h2>
          <p>
            We start with your process, the people using it and the systems it must connect to.
            Together we agree requirements, data ownership, permissions and success criteria.
          </p>
          <ul className="lx-check-list">
            {content.processing.foundation.map((item) => (
              <li key={item}>
                <Check size={18} />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <aside className="lx-enquiry-note">
          <h2>Let’s scope your project.</h2>
          <p>Share your workflow, existing software and the outcome you need.</p>
          <a className="lx-button" href={`/contact?service=${encodeURIComponent(service.name)}`}>
            Discuss {service.name}
            <ArrowUpRight size={17} />
          </a>
        </aside>
      </div>
      <section className="lx-detail-process">
        <div className="lx-growth-heading">
          <p className="lx-kicker">{content.processing.label}</p>
          <h2>{content.processing.foundationLabel}</h2>
          <p>{content.processing.intro}</p>
        </div>
        <div className="lx-detail-process-steps">
          {content.processing.lines
            .flatMap((line) => line.stages)
            .map(([title, body], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
        </div>
      </section>
      <section className="lx-detail-related">
        <div className="lx-growth-heading">
          <p className="lx-kicker">{design.applications.label}</p>
          <h2>{design.applications.title}</h2>
          <p>{design.applications.intro}</p>
        </div>
        <div className="lx-app-preview">
          {content.applications?.slice(0, 4).map((app) => (
            <a href={`/apps/${app.slug}`} key={app.slug}>
              <span>{app.category}</span>
              <h3>{app.name}</h3>
              <ArrowUpRight size={18} />
            </a>
          ))}
        </div>
        <a className="lx-text-link" href="/apps">
          {design.applications.button}
          <ArrowUpRight size={18} />
        </a>
      </section>
      {design.questions.length ? (
        <section className="lx-detail-faq">
          <div className="lx-growth-heading">
            <p className="lx-kicker">{design.faq.label}</p>
            <h2>{design.faq.title}</h2>
          </div>
          <div className="lx-faq-list">
            {design.questions.slice(0, 3).map((question) => (
              <details key={question.title}>
                <summary>{question.title}</summary>
                <p>{question.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export function LogicxSupport({ content }: { content: PageContent }) {
  return (
    <main id="logicx-main" className="lx-shell lx-page">
      <p className="lx-kicker">LOGICX / SUPPORT & CONTINUED CARE</p>
      <h1>
        Keep your software
        <br />
        <em>moving forward.</em>
      </h1>
      <p className="lx-intro">
        Plan the care your applications need after launch. We agree the systems covered, support
        hours, response expectations and change process before work starts.
      </p>
      <div className="lx-services-grid">
        {content.responsibility.items.map((item) => (
          <article className="lx-service-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <section className="lx-support-strip">
        <div className="lx-stack">
          <h2>Tell us what needs support.</h2>
          <p>Share your technology, hosting setup and business-critical workflows.</p>
        </div>
        <a className="lx-button" href="/contact?service=Application%20support">
          Discuss support
          <ArrowUpRight size={17} />
        </a>
      </section>
    </main>
  );
}
