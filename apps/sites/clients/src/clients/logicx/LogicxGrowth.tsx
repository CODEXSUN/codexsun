import { m as motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import "./logicx-growth.css";
import { LogicxWorkflowBoard } from "./LogicxWorkflowBoard";

export function LogicxGrowth({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  const reducedMotion = useReducedMotion();
  const practiceBackdrop = design.practiceBackdrop ?? initialLogicxMarketing.practiceBackdrop;
  const industryBackdrop = design.industryBackdrop ?? initialLogicxMarketing.industryBackdrop;
  const deliveryBackdrop = design.deliveryBackdrop ?? initialLogicxMarketing.deliveryBackdrop;
  const reveal = {
    initial: false as const,
    animate: reducedMotion ? { opacity: 1, y: 0 } : {},
    whileInView: { opacity: 1, y: reducedMotion ? 0 : [12, 0] },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: reducedMotion ? 0 : 0.7 }
  };
  return (
    <>
      {design.exampleItems.length ? (
        <section className="lx-shell lx-growth-section lx-practice-section" id="work">
          {practiceBackdrop ? <img className="lx-practice-backdrop" src={practiceBackdrop} alt="" loading="lazy" decoding="async" aria-hidden="true" /> : null}
          <motion.div {...reveal} className="lx-growth-heading">
            <p className="lx-kicker">{design.examples.label}</p>
            <h2>{design.examples.title}</h2>
            <p>{design.examples.intro}</p>
          </motion.div>
          <div className="lx-workflows">
            {design.exampleItems.map((item, index) => (
              <motion.article {...reveal} key={item.title}>
                <LogicxWorkflowBoard steps={item.steps} title={item.title} variant={index} />
                <p className="lx-kicker">WORKFLOW / {String(index + 1).padStart(2, "0")}</p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <a
                  className="lx-text-link"
                  href={`/contact?service=${encodeURIComponent(item.title)}`}
                >
                  {design.examples.button}
                  <ArrowUpRight size={17} />
                </a>
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}
      {design.industryItems.length ? (
        <section className="lx-industry-section" id="industries">
          {industryBackdrop ? <img className="lx-industry-backdrop" src={industryBackdrop} alt="" loading="lazy" decoding="async" aria-hidden="true" /> : null}
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
              {design.industryItems.map((item, index) => (
                <motion.article {...reveal} key={item.title}>
                  <span className="lx-industry-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {design.engagementItems.length ? (
        <section className="lx-shell lx-growth-section lx-delivery-section" id="work-with-us">
          {deliveryBackdrop ? <img className="lx-delivery-backdrop" src={deliveryBackdrop} alt="" loading="lazy" decoding="async" aria-hidden="true" /> : null}
          <motion.div {...reveal} className="lx-growth-heading">
            <p className="lx-kicker">{design.engagements.label}</p>
            <h2>{design.engagements.title}</h2>
            <p>{design.engagements.intro}</p>
          </motion.div>
          <div className="lx-engagements">
            {design.engagementItems.map((item, index) => (
              <motion.article {...reveal} key={item.title}>
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
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}
      {design.questions.length ? (
        <section className="lx-shell lx-growth-section lx-faq-section">
          <motion.div {...reveal} className="lx-growth-heading">
            <p className="lx-kicker">{design.faq.label}</p>
            <h2>{design.faq.title}</h2>
            <p>{design.faq.intro}</p>
          </motion.div>
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
