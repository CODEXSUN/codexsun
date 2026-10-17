import { ArrowUpRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import { LogicxHero, LogicxApproach } from "./LogicxHero";
import { LogicxServiceCarousel, LogicxServiceRows } from "./LogicxServices";
import { LogicxGrowth } from "./LogicxGrowth";

export function LogicxHome({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  const apps = content.applications ?? [];
  return (
    <main id="logicx-main">
      <LogicxHero content={content} />
      <LogicxServiceCarousel content={content} />
      <LogicxApproach content={content} />
      <section className="lx-app-section">
        <div className="lx-shell">
          <div className="lx-growth-heading">
            <p className="lx-kicker">{design.applications.label}</p>
            <h2>{design.applications.title}</h2>
            <p>{design.applications.intro}</p>
          </div>
          <div className="lx-app-preview">
            {apps.slice(0, 8).map((app) => (
              <a href={`/apps/${app.slug}`} key={app.slug}>
                <span>{app.category}</span>
                <h3>{app.name}</h3>
                <ArrowUpRight size={18} />
              </a>
            ))}
          </div>
          <a className="lx-button" href="/apps">
            {design.applications.button}
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <LogicxGrowth content={content} />
      <section className="lx-start-band">
        <div className="lx-shell">
          <div>
            <p className="lx-kicker">{design.closing.label}</p>
            <h2>{design.closing.title}</h2>
            <p>{design.closing.intro}</p>
          </div>
          <a className="lx-button" href="/contact">
            {design.closing.button}
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
    </main>
  );
}

export function LogicxServices({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  return (
    <main id="logicx-main" className="lx-service-section">
      <div className="lx-shell lx-page">
        <div className="lx-growth-heading">
          <p className="lx-kicker">{design.services.label}</p>
          <h1>{design.services.title}</h1>
          <p>{design.services.intro}</p>
        </div>
        <LogicxServiceRows content={content} />
      </div>
    </main>
  );
}
