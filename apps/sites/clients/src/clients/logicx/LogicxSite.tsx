import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Braces,
  Database,
  Globe2,
  LogIn,
  ServerCog
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ClientCanvas } from "../../shared/ClientCanvas";
import { useClientDocument } from "../../shared/useClientDocument";
import { LogicxThemeSelector } from "./LogicxThemeSelector";
import "./logicx-site.css";

const heroSlides = [
  {
    eyebrow: "Software that connects the work",
    title: "Practical systems. Built around your business.",
    description:
      "Connect operations, finance and customer workflows through purposeful software that fits the way your team already works."
  },
  {
    eyebrow: "Integrations without the friction",
    title: "Your systems, data and people. Finally in sync.",
    description:
      "Join Tally, ERPNext, websites and internal tools with dependable flows that remove duplicate work and keep decisions clear."
  },
  {
    eyebrow: "Delivery that stays accountable",
    title: "From complex workflow to confident everyday use.",
    description:
      "Discover the real process, release improvements in useful stages, and keep every system supported after it reaches production."
  }
] as const;

const services = [
  {
    icon: Braces,
    title: "Custom software",
    description: "Purpose-built systems for the way your team works."
  },
  {
    icon: Database,
    title: "Tally integration",
    description: "Finance data connected, validated and reconciled."
  },
  {
    icon: ServerCog,
    title: "ERPNext delivery",
    description: "Practical ERP rollout shaped around real operations."
  },
  {
    icon: Globe2,
    title: "Website engineering",
    description: "Fast digital experiences built to keep evolving."
  },
  {
    icon: Bot,
    title: "Workflow automation",
    description: "Rules and approvals that remove repetitive work."
  },
  {
    icon: ServerCog,
    title: "Hosting and care",
    description: "Reliable production care after every launch."
  }
] as const;

const capabilities = ["Custom software", "ERPNext", "Tally", "Web systems", "Automation"] as const;

export function LogicxSite() {
  const [heroIndex, setHeroIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useClientDocument(
    "Logicx Info Tech | Practical software systems",
    "Custom software, ERPNext, Tally integration, website engineering and automation.",
    "#f6f9ff"
  );

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(
      () => setHeroIndex((current) => (current + 1) % heroSlides.length),
      5600
    );
    return () => window.clearInterval(interval);
  }, [heroIndex, reducedMotion]);

  const heroSlide = heroSlides[heroIndex]!;

  function selectHeroSlide(index: number) {
    setHeroIndex((index + heroSlides.length) % heroSlides.length);
  }

  return (
    <ClientCanvas client="logicx" theme="blue">
      <header className="client-header logicx-header">
        <a className="client-brand" href="#top" aria-label="Logicx home">
          <span className="client-brand-mark">LX</span>
          Logicx Info Tech
        </a>
        <nav className="logicx-primary-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#method">Method</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="logicx-header-actions">
          <Button asChild className="logicx-login-button" size="sm" variant="outline">
            <a href="https://app.codexsun.com">
              <LogIn aria-hidden="true" />
              <span>Login</span>
            </a>
          </Button>
          <LogicxThemeSelector />
        </div>
      </header>

      <main id="top">
        <section className="client-hero client-wrap">
          <div className="client-hero-copy logicx-hero-copy">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                className="logicx-hero-slide"
                key={heroSlide.title}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="client-eyebrow">{heroSlide.eyebrow}</span>
                <h1>{heroSlide.title}</h1>
                <p>{heroSlide.description}</p>
              </motion.div>
            </AnimatePresence>
            <motion.div
              className="client-actions"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button asChild size="lg">
                <a href="mailto:hello@logicx.in">
                  Discuss your workflow <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#services">Explore services</a>
              </Button>
            </motion.div>
            <div className="logicx-carousel-controls" aria-label="Hero slides">
              <button
                aria-label="Previous slide"
                className="logicx-carousel-arrow"
                onClick={() => selectHeroSlide(heroIndex - 1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" />
              </button>
              <div className="logicx-carousel-dots">
                {heroSlides.map((slide, index) => (
                  <button
                    aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                    aria-pressed={index === heroIndex}
                    className="logicx-carousel-dot"
                    key={slide.title}
                    onClick={() => selectHeroSlide(index)}
                    type="button"
                  />
                ))}
              </div>
              <span className="logicx-carousel-count">
                {String(heroIndex + 1).padStart(2, "0")} /{" "}
                {String(heroSlides.length).padStart(2, "0")}
              </span>
              <button
                aria-label="Next slide"
                className="logicx-carousel-arrow"
                onClick={() => selectHeroSlide(heroIndex + 1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <motion.div
            className="client-visual"
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="client-visual-top">
              <span>LogicX operating system</span>
              <span className="logicx-live-status">Live architecture</span>
            </div>
            <div className="logicx-system-stage" aria-hidden="true">
              <svg className="logicx-wire-map" preserveAspectRatio="none" viewBox="0 0 520 360">
                <defs>
                  <linearGradient id="logicx-wire-gradient" x1="0" x2="1">
                    <stop offset="0" stopColor="#8bb9ff" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.92" />
                    <stop offset="1" stopColor="#8bb9ff" stopOpacity="0" />
                  </linearGradient>
                  <filter id="logicx-wire-glow">
                    <feGaussianBlur result="blur" stdDeviation="3" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path className="logicx-wire-base" d="M260 180 C190 130 125 88 54 80" />
                <path className="logicx-wire-base" d="M260 180 C338 120 405 102 476 98" />
                <path className="logicx-wire-base" d="M260 180 C184 226 126 270 62 292" />
                <path className="logicx-wire-base" d="M260 180 C330 224 400 260 470 300" />
                <path
                  className="logicx-wire-pulse logicx-wire-pulse-a"
                  d="M260 180 C190 130 125 88 54 80"
                />
                <path
                  className="logicx-wire-pulse logicx-wire-pulse-b"
                  d="M260 180 C338 120 405 102 476 98"
                />
                <path
                  className="logicx-wire-pulse logicx-wire-pulse-c"
                  d="M260 180 C184 226 126 270 62 292"
                />
                <path
                  className="logicx-wire-pulse logicx-wire-pulse-d"
                  d="M260 180 C330 224 400 260 470 300"
                />
                <path
                  className="logicx-orbit-path"
                  d="M80 180a180 102 0 1 0 360 0a180 102 0 1 0-360 0"
                  id="logicx-orbit-a"
                />
                <path
                  className="logicx-orbit-path"
                  d="M260 22a95 158 0 1 0 0 316a95 158 0 1 0 0-316"
                  id="logicx-orbit-b"
                />
                <circle className="logicx-orbit-light" r="4">
                  <animateMotion dur="5.2s" repeatCount="indefinite">
                    <mpath href="#logicx-orbit-a" />
                  </animateMotion>
                </circle>
                <circle className="logicx-orbit-light logicx-orbit-light-secondary" r="3">
                  <animateMotion begin="-1.4s" dur="4.4s" repeatCount="indefinite">
                    <mpath href="#logicx-orbit-b" />
                  </animateMotion>
                </circle>
              </svg>
              <div className="logicx-system-ring logicx-system-ring-a" />
              <div className="logicx-system-ring logicx-system-ring-b" />
              <div className="logicx-system-core">
                <span>LX</span>
                <small>Connected</small>
              </div>
              <div className="client-system-node logicx-system-node logicx-system-node-a">
                <Braces aria-hidden="true" size={20} />
                <strong>Operations</strong>
              </div>
              <div className="client-system-node logicx-system-node logicx-system-node-b">
                <Database aria-hidden="true" size={20} />
                <strong>Finance</strong>
              </div>
              <div className="client-system-node logicx-system-node logicx-system-node-c">
                <Globe2 aria-hidden="true" size={20} />
                <strong>Experience</strong>
              </div>
              <div className="client-system-node logicx-system-node logicx-system-node-d">
                <Bot aria-hidden="true" size={20} />
                <strong>Automation</strong>
              </div>
            </div>
            <div className="client-visual-footer">
              <span>Discover</span>
              <i />
              <span>Connect</span>
              <i />
              <span>Deliver</span>
            </div>
          </motion.div>
        </section>

        <div className="logicx-capability-strip" aria-label="LogicX capabilities">
          <div className="logicx-capability-track">
            {[false, true].map((duplicate) => (
              <div
                aria-hidden={duplicate || undefined}
                className="logicx-capability-group"
                key={duplicate ? "duplicate" : "primary"}
              >
                {capabilities.map((capability) => (
                  <span className="logicx-capability-item" key={capability}>
                    {capability}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="client-section client-section-muted" id="services">
          <div className="client-wrap">
            <div className="client-section-heading">
              <span className="client-eyebrow">What we build</span>
              <div>
                <h2>Useful technology, joined properly.</h2>
                <p>
                  Each engagement starts with the real workflow, then chooses the smallest reliable
                  combination of product, integration and infrastructure needed to improve it.
                </p>
              </div>
            </div>
            <div className="client-card-grid">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: index * 0.045, duration: 0.42 }}
                  >
                    <Card className="client-service-card">
                      <span className="logicx-service-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="logicx-service-icon">
                        <Icon aria-hidden="true" size={24} />
                      </div>
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="client-section client-wrap" id="method">
          <div className="client-section-heading">
            <span className="client-eyebrow">Delivery method</span>
            <div>
              <h2>Clear from discovery to support.</h2>
              <p>
                We map the process, establish the data and integration boundaries, release in useful
                stages, and remain accountable after the system reaches production.
              </p>
            </div>
          </div>
          <div className="client-stats">
            <div className="client-stat">
              <span className="logicx-stat-index">01</span>
              <strong>Discover first</strong>
              <span>Process, people, data and exceptions</span>
            </div>
            <div className="client-stat">
              <span className="logicx-stat-index">02</span>
              <strong>Release in stages</strong>
              <span>Useful milestones with visible progress</span>
            </div>
            <div className="client-stat">
              <span className="logicx-stat-index">03</span>
              <strong>Own the outcome</strong>
              <span>Documentation, monitoring and continued care</span>
            </div>
          </div>
        </section>

        <section className="client-section client-wrap" id="contact">
          <div className="client-cta">
            <div>
              <h2>Make the next system easier to run.</h2>
              <p>
                Share the process that is slowing your team down. We will help shape a practical
                path from the current workflow to a dependable software system.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <a href="mailto:hello@logicx.in">
                hello@logicx.in <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="client-footer client-wrap">
        <span>Logicx Info Tech</span>
        <span>Custom software · ERPNext · Tally · Websites · Automation</span>
      </footer>
    </ClientCanvas>
  );
}
