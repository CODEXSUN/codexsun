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
import { useSitePublication } from "../../shared/useSitePublication";
import { PortfolioPages, PortfolioPageLinks } from "../../shared/PortfolioPages";

export function LogicxSite() {
  const { content, blogs, connected } = useSitePublication("logicx");
  const heroSlides = [
    {
      eyebrow: content.hero.eyebrow,
      title: `${content.hero.title} ${content.hero.secondLine} ${content.hero.emphasis}`,
      description: content.hero.intro
    },
    {
      eyebrow: content.about.label,
      title: `${content.about.title} ${content.about.emphasis}`,
      description: content.about.intro
    },
    {
      eyebrow: content.processing.label,
      title: `${content.processing.title} ${content.processing.emphasis}`,
      description: content.processing.intro
    }
  ];
  const icons = [Braces, Database, ServerCog, Globe2, Bot, ServerCog];
  const services = content.finishes.items.map((item, index) => ({
    icon: icons[index % icons.length]!,
    title: item.name,
    description: item.detail
  }));
  const capabilities = content.materials.names;
  const [heroIndex, setHeroIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  const article = blogs.find((post) => window.location.pathname === `/blogs/${post.slug}`);
  useClientDocument(
    article ? `${article.title} | ${content.profile.name}` : content.pageTitle,
    article?.summary ?? content.description,
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

  if (window.location.pathname !== "/")
    return <PortfolioPages content={content} blogs={blogs} connected={connected} />;
  return (
    <ClientCanvas client="logicx" theme="blue">
      <header className="client-header logicx-header">
        <a className="client-brand" href="#top" aria-label="Logicx home">
          <span className="client-brand-mark">LX</span>
          {content.profile.brand}
        </a>
        <nav className="logicx-primary-nav" aria-label="Main navigation">
          <a href="/about">About</a>
          <a href="/services">Services</a>
          <a href="#method">Method</a>
          <a href="/contact">Contact</a>
          <a href="/blogs">Blog</a>
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
                <a href={`mailto:${content.profile.emails[0]}`}>
                  {content.hero.button} <ArrowUpRight aria-hidden="true" />
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
              <span className="client-eyebrow">{content.finishes.label}</span>
              <div>
                <h2>
                  {content.finishes.title} {content.finishes.emphasis}
                </h2>
                <p>{content.finishes.intro}</p>
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
            <span className="client-eyebrow">{content.about.label}</span>
            <div>
              <h2>
                {content.about.title} {content.about.emphasis}
              </h2>
              <p>{content.about.lead}</p>
            </div>
          </div>
          <div className="client-stats">
            {content.processing.lines[0]?.stages.map(([name, detail], index) => (
              <div className="client-stat" key={index}>
                <span className="logicx-stat-index">{String(index + 1).padStart(2, "0")}</span>
                <strong>{name}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="client-section client-wrap" id="contact">
          <div className="client-cta">
            <div>
              <h2>
                {content.contact.title} {content.contact.emphasis}
              </h2>
              <p>{content.contact.intro}</p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <a href={`mailto:${content.profile.emails[0]}`}>
                {content.profile.emails[0]} <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>
        <PortfolioPageLinks />
      </main>

      <footer className="client-footer client-wrap">
        <span>{content.profile.name}</span>
        <span>{content.footer.lineTwo}</span>
      </footer>
    </ClientCanvas>
  );
}
