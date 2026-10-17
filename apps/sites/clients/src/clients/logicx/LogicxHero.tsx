import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Pause,
  Play,
  Code2,
  Layers,
  Atom,
  Smartphone,
  Workflow,
  Plug,
  Globe2,
  Headphones,
  Box,
  ChartNoAxesCombined,
  Users,
  Settings,
  Bell
} from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";

const technologyLogos: Readonly<Record<string, string>> = {
  Frappe: "frappe.svg",
  ERPNext: "erpnext.svg",
  React: "react.svg",
  "Tailwind CSS": "tailwindcss.svg",
  Python: "python.svg",
  "Node.js": "nodejs.svg"
};

export const logicxServiceIcons = [
  Code2,
  Layers,
  Atom,
  Smartphone,
  Workflow,
  Plug,
  Globe2,
  Headphones
];

export function LogicxHero({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  const slides = [
    { eyebrow: content.hero.eyebrow, title: content.hero.title, secondLine: content.hero.secondLine, emphasis: content.hero.emphasis, intro: content.hero.intro },
    ...content.finishes.items.slice(0, 2).map((service) => ({ eyebrow: design.services.label, title: service.name, secondLine: "", emphasis: "Built around your business.", intro: service.detail }))
  ];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (paused || interacting || reducedMotion || slides.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reducedMotion, slides.length]);
  return (
    <section className="lx-new-hero">
      <div className="lx-hero-sculpture" aria-hidden="true">
        <img src={design.heroImage} alt="" fetchPriority="high" />
        <span />
      </div>
      <div className="lx-shell lx-new-hero-inner">
        <div className="lx-new-hero-copy lx-hero-load" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocus={() => setInteracting(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
          <div className="lx-hero-text-slider" aria-roledescription="carousel" aria-label="LogicX highlights">
            {slides.map((slide, index) => (
              <motion.div
                key={index}
                className="lx-hero-slide"
                aria-hidden={active % slides.length !== index}
                initial={false}
                animate={{ opacity: active % slides.length === index ? 1 : 0, y: active % slides.length === index || reducedMotion ? 0 : 10 }}
                transition={{ duration: reducedMotion ? 0 : 0.42 }}
                style={{ pointerEvents: active % slides.length === index ? "auto" : "none" }}
              >
                <p className="lx-kicker">{slide.eyebrow}</p>
                <h1>{slide.title}{slide.secondLine ? <><br />{slide.secondLine}</> : null}<br /><em>{slide.emphasis}</em></h1>
                <p className="lx-new-hero-intro">{slide.intro}</p>
              </motion.div>
            ))}
          </div>
          <div className="lx-hero-slide-controls" aria-label="Hero controls">
            {slides.map((item, index) => <button key={index} type="button" aria-label={`Show highlight ${index + 1}: ${item.title}`} aria-current={active % slides.length === index ? "true" : undefined} onClick={() => setActive(index)} />)}
            <button
              type="button"
              className="lx-hero-pause"
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              title={paused ? "Play slideshow" : "Pause slideshow"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            </button>
          </div>
          <div className="lx-new-hero-actions">
            <a className="lx-button" href="/contact?service=Software%20project">
              {design.primaryLabel}
              <ArrowUpRight size={18} />
            </a>
            <a className="lx-watch-link" href="#approach">
              <span>
                <ArrowRight size={17} />
              </span>
              {design.secondaryLabel}
            </a>
          </div>
        </div>
        <div className="lx-hero-principles" aria-hidden="true">
          People
          <br />
          Processes
          <br />
          Possibilities
        </div>
        <div className="lx-hero-panel">
          <LogicxDashboard />
        </div>
      </div>
      <section className="lx-shell lx-tech-marquee" aria-label="Trusted technologies">
        <div className="lx-tech-label"><span className="lx-kicker">Built with</span><strong>Trusted technologies</strong></div>
        <div className="lx-tech-window" tabIndex={0} aria-label="Technology stack; focus to pause scrolling">
          <div className="lx-tech-track">
            {[false, true].map((duplicate) => <div className="lx-tech-items" key={String(duplicate)} aria-hidden={duplicate || undefined}>
              {design.technologies.map((name) => {
                const logo = technologyLogos[name];
                return <div className="lx-tech-item" key={name}>
                  {logo ? <img src={`/technologies/${logo}`} alt="" width="72" height="36" /> : null}
                  <span>{name}</span>
                </div>;
              })}
            </div>)}
          </div>
        </div>
      </section>
    </section>
  );
}

function LogicxDashboard() {
  return (
    <div
      className="lx-dashboard"
      role="img"
      aria-label="Illustrative software demonstration showing orders, customers, and workflows. Figures are sample data."
    >
      <div className="lx-dashboard-sidebar">
        <img
          className="lx-dashboard-brand-mark"
          src="/brand-mark.svg"
          width="32"
          height="25"
          alt=""
          aria-hidden="true"
        />
        {[
          [Box, "Dashboard"],
          [ChartNoAxesCombined, "Sales"],
          [Users, "Customers"],
          [Box, "Products"],
          [Layers, "Operations"],
          [ChartNoAxesCombined, "Reports"],
          [Settings, "Settings"]
        ].map(([Icon, label]) => {
          const Symbol = Icon as typeof Box;
          return (
            <span key={String(label)}>
              <Symbol size={13} />
              {String(label)}
            </span>
          );
        })}
      </div>
      <div className="lx-dashboard-main">
        <div className="lx-dashboard-top">
          <div>
            <strong>
              Your business,
              <br />
              connected.
            </strong>
            <small>Real-time insights. Smarter decisions.</small>
          </div>
          <Bell size={16} />
        </div>
        <div className="lx-demo-stats">
          {[
            ["Open orders", "128"],
            ["Active customers", "1,248"],
            ["Tasks completed", "892"]
          ].map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong><DashboardCount value={Number((value ?? "0").replaceAll(",", ""))} /></strong>
              <span>↗ This month</span>
            </div>
          ))}
        </div>
        <div className="lx-demo-charts">
          <div>
            <strong>Business growth</strong>
            <svg viewBox="0 0 300 150" aria-hidden="true">
              <defs>
                <linearGradient id="lx-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#a3e2ae" stopOpacity=".6" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M10 30H290M10 65H290M10 100H290M10 135H290" stroke="#eaf0ec" />
              <path
                d="M10 118Q35 90 60 101T110 88T160 76T210 65T260 46L290 57V150H10Z"
                className="lx-chart-area"
                fill="url(#lx-chart-fill)"
              />
              <path
                d="M10 118Q35 90 60 101T110 88T160 76T210 65T260 46L290 57"
                fill="none"
                className="lx-chart-line"
                pathLength="1"
                stroke="#148450"
                strokeWidth="2.5"
              />
            </svg>
            <small>Jan　　 Feb　　 Mar　　 Apr　　 May　　 Jun</small>
          </div>
          <div className="lx-demo-ring">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#dbece1" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#137b48"
                strokeWidth="9"
                className="lx-ring-progress"
                strokeDasharray="229 239"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="56" textAnchor="middle" fontSize="19" fill="#14251c">
                <DashboardCount value={96} />%
              </text>
            </svg>
            <small>
              Operational
              <br />
              efficiency
            </small>
          </div>
        </div>
        <span className="lx-dashboard-disclaimer">Demonstration workspace · Sample data</span>
      </div>
    </div>
  );
}

function DashboardCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) { setDisplay(value); return; }
    const animation = animate(0, value, {
      duration: 1.8,
      delay: 0.35,
      ease: "easeOut",
      onUpdate: (current) => setDisplay(Math.round(current))
    });
    return () => animation.stop();
  }, [value, reducedMotion]);
  return <>{display.toLocaleString("en-IN")}</>;
}

export function LogicxApproach({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  return (
    <section className="lx-new-approach" id="approach">
      <img className="lx-approach-photo" src={design.approachImage} alt="" loading="lazy" />
      <svg
        className="lx-approach-wave"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0H1440V14L1070 100C970 123 850 40 727 60S523 117 410 95L84 38Q25 30 0 0Z"
          fill="#fafbf8"
        />
      </svg>
      <div className="lx-approach-ribbon" aria-hidden="true" />
      <div className="lx-shell lx-new-approach-inner">
        <div className="lx-approach-copy">
          <p className="lx-kicker">
            <span>02</span>
            {content.about.label}
          </p>
          <h2>
            {content.about.title}
            <br />
            <em>{content.about.emphasis}</em>
          </h2>
          <p>{content.about.intro}</p>
          <a className="lx-button" href="/contact?service=Project%20consultation">
            {content.responsibility.linkLabel}
            <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="lx-approach-stages">
          {content.responsibility.items.slice(0, 3).map((step, index) => (
            <article key={step.title}>
              <span>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


