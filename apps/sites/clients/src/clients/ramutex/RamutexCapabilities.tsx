import { ArrowUpRight, Check, Leaf } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import profileUrl from "./assets/ramu-tex-company-profile.pdf?url";
export function RamutexCapabilities({ content }: { content: PageContent }) {
  const { processing, finishes, responsibility, equipment } = content;
  return (
    <>
      <section id="processing" className="rt-section rt-processing">
        <div className="rt-wrap">
          <div className="rt-section-heading">
            <div>
              <p className="rt-eyebrow">{processing.label}</p>
              <h2>
                {processing.title}
                <br />
                <em>{processing.emphasis}</em>
              </h2>
            </div>
            <p>{processing.intro}</p>
          </div>
          <div className="rt-process-grid">
            {processing.lines.map((line, index) => (
              <article className="rt-process" key={index}>
                <div
                  className={`rt-process-illustration rt-process-illustration-${index % 2}`}
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="rt-process-title">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{line.title}</h3>
                  <ArrowUpRight size={24} />
                </div>
                <p>{line.description}</p>
                <dl>
                  {line.stages.map(([stage, machine], i) => (
                    <div key={i}>
                      <dt>{stage}</dt>
                      <dd>{machine}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <div className="rt-base-process">
            <span>{processing.foundationLabel}</span>
            <p>
              {processing.foundation.map((text, index) => (
                <span key={index}>{text}</span>
              ))}
            </p>
          </div>
        </div>
      </section>
      <section id="finishes" className="rt-section rt-wrap">
        <div className="rt-section-heading">
          <div>
            <p className="rt-eyebrow">{finishes.label}</p>
            <h2>
              {finishes.title}
              <br />
              <em>{finishes.emphasis}</em>
            </h2>
          </div>
          <p>{finishes.intro}</p>
        </div>
        <div className="rt-finishes">
          {finishes.items.map((finish, index) => (
            <details key={index} className="rt-finish">
              <summary>
                <span className="rt-finish-number">{String(index + 1).padStart(2, "0")}</span>
                <span>{finish.name}</span>
                <span className="rt-finish-plus" aria-hidden="true">
                  +
                </span>
              </summary>
              <p>
                {finish.detail}{" "}
                <a href={`/contact?service=${encodeURIComponent(finish.name)}`}>
                  Talk to our team <ArrowUpRight size={15} />
                </a>
              </p>
            </details>
          ))}
        </div>
      </section>
      <section id="responsibility" className="rt-responsibility">
        <div className="rt-wrap rt-responsibility-grid">
          <div>
            <p className="rt-eyebrow">{responsibility.label}</p>
            <Leaf size={44} strokeWidth={1} className="rt-leaf" />
            <h2>
              {responsibility.title}
              <br />
              <em>{responsibility.emphasis}</em>
            </h2>
            <p>{responsibility.intro}</p>
            <a className="rt-text-link" href={profileUrl} target="_blank" rel="noreferrer">
              {responsibility.linkLabel}
              <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="rt-commitments">
            {responsibility.items.map((item, index) => (
              <article key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
            <div className="rt-profile-note">
              <Check size={16} />
              <span>{responsibility.note}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="rt-equipment rt-wrap">
        <p className="rt-eyebrow">{equipment.label}</p>
        <div>
          {equipment.names.map((name, index) => (
            <span key={index}>{name}</span>
          ))}
        </div>
        <p>{equipment.note}</p>
      </section>
    </>
  );
}
