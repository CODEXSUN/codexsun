import { ArrowUpRight, Check, Plus, ArrowRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import "./logicx-growth.css";

export function LogicxGrowth({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  return (
    <>
      {design.exampleItems.length ? (
        <section className="lx-shell lx-growth-section" id="work">
          <div className="lx-growth-heading">
            <p className="lx-kicker">{design.examples.label}</p>
            <h2>{design.examples.title}</h2>
            <p>{design.examples.intro}</p>
          </div>
          <div className="lx-workflows">
            {design.exampleItems.map((item, index) => (
              <article key={item.title}>
                <div className={`lx-workflow-art lx-workflow-art-${index % 3}`} aria-hidden="true">
                  {item.steps.map((step, i) => (
                    <span key={step}>
                      <b>{String(i + 1).padStart(2, "0")}</b>
                      {step}
                      {i < item.steps.length - 1 ? <ArrowRight size={15} /> : null}
                    </span>
                  ))}
                </div>
                <p className="lx-kicker">Illustrative workflow</p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <a
                  className="lx-text-link"
                  href={`/contact?service=${encodeURIComponent(item.title)}`}
                >
                  {design.examples.button}
                  <ArrowUpRight size={17} />
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {design.industryItems.length ? (
        <section className="lx-industry-section">
          <div className="lx-shell lx-industry-layout">
            <div>
              <p className="lx-kicker">{design.industries.label}</p>
              <h2>{design.industries.title}</h2>
              <p>{design.industries.intro}</p>
              <a className="lx-text-link" href="/apps">
                {design.industries.button}
                <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="lx-industries">
              {design.industryItems.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {design.engagementItems.length ? (
        <section className="lx-shell lx-growth-section" id="work-with-us">
          <div className="lx-growth-heading">
            <p className="lx-kicker">{design.engagements.label}</p>
            <h2>{design.engagements.title}</h2>
            <p>{design.engagements.intro}</p>
          </div>
          <div className="lx-engagements">
            {design.engagementItems.map((item, index) => (
              <article key={item.title}>
                <span className="lx-engagement-number">{String(index + 1).padStart(2, "0")}</span>
                <p className="lx-kicker">{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <ul>
                  {item.items.map((text) => (
                    <li key={text}>
                      <Check size={17} />
                      {text}
                    </li>
                  ))}
                </ul>
                <a
                  className="lx-text-link"
                  href={`/contact?service=${encodeURIComponent(item.topic)}`}
                >
                  {design.engagements.button}
                  <ArrowUpRight size={17} />
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {design.questions.length ? (
        <section className="lx-shell lx-growth-section lx-faq-section">
          <div className="lx-growth-heading">
            <p className="lx-kicker">{design.faq.label}</p>
            <h2>{design.faq.title}</h2>
            <p>{design.faq.intro}</p>
          </div>
          <div className="lx-faq-list">
            {design.questions.map((item) => (
              <details key={item.title}>
                <summary>
                  {item.title}
                  <Plus size={20} aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <div className="lx-faq-contact">
            <a className="lx-text-link" href="/contact?service=Software%20project%20question">
              {design.faq.button}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
      ) : null}
    </>
  );
}
