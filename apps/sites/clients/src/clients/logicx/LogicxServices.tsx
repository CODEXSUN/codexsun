import { useEffect, useRef, useState } from "react";
import { m as motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import { serviceSlug } from "@codexsun/sites-api/page-routes";
import { LogicxServiceIcon } from "./LogicxServiceIcon";

export function LogicxServiceCarousel({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  const rail = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [position, setPosition] = useState({ previous: false, next: true });
  const services = [...content.finishes.items].sort((a, b) => {
    const rank = (name: string) => {
      const index = design.featuredServices.indexOf(serviceSlug(name));
      return index < 0 ? 100 : index;
    };
    return rank(a.name) - rank(b.name);
  });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () =>
      setPosition({
        previous: element.scrollLeft > 4,
        next: element.scrollLeft + element.clientWidth < element.scrollWidth - 4
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [services.length]);
  const scroll = (direction: number) => {
    const element = rail.current;
    if (element)
      element.scrollBy({
        left: direction * (element.clientWidth - (element.firstElementChild?.getBoundingClientRect().width ?? 0) * 0.4 - parseFloat(getComputedStyle(element).columnGap || "0")),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth"
      });
  };
  return (
    <section className="lx-new-services" id="services">
      <div className="lx-shell">
        <p className="lx-kicker lx-section-label">
          <span>01</span>
          {design.services.label}
        </p>
        <motion.div className="lx-service-overview-heading" initial={false} whileInView={{ opacity: 1, y: reducedMotion ? 0 : [12, 0] }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.65 }}> 
          <div>
            <h2>
              {design.services.title
                .split(/(your business\.)/)
                .map((part, index) =>
                  part === "your business." ? <em key={index}>{part}</em> : part
                )}
            </h2>
            <p>{design.services.intro}</p>
          </div>
          <div className="lx-service-overview-actions">
            <a className="lx-text-link" href="/services">
              {design.services.button}
              <ArrowUpRight size={17} />
            </a>
            <div className="lx-carousel-controls">
              <button
                aria-label="Previous services"
                disabled={!position.previous}
                onClick={() => scroll(-1)}
              >
                <ArrowLeft />
              </button>
              <button
                aria-label="Next services"
                disabled={!position.next || services.length < 2}
                onClick={() => scroll(1)}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </motion.div>
        <div
          ref={rail}
          className="lx-service-carousel"
          role="region"
          aria-label="Software services"
          tabIndex={0}
          onScroll={(event) => {
            const element = event.currentTarget;
            setPosition({
              previous: element.scrollLeft > 4,
              next: element.scrollLeft + element.clientWidth < element.scrollWidth - 4
            });
          }}
        >
          {services.map((service, index) => {
            return (
              <motion.a
                initial={false}
                whileInView={{ opacity: 1, y: reducedMotion ? 0 : [12, 0] }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: reducedMotion ? 0 : (index % 4) * 0.07 }}
                whileHover={reducedMotion ? {} : { y: -6, transition: { duration: 0.2, delay: 0 } }}
                className="lx-curved-service"
                href={`/services/${serviceSlug(service.name)}`}
                key={service.name}
              >
                <LogicxServiceIcon name={service.name} />
                <h3>{service.name}</h3>
                <p>{service.detail}</p>
                <span>
                  Learn more <ArrowUpRight size={16} />
                </span>
                <span className="lx-sr">
                  Service {index + 1} of {services.length}
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LogicxServiceRows({ content }: { content: PageContent }) {
  const design = content.marketing ?? initialLogicxMarketing;
  return (
    <div className="lx-service-rows">
      {content.finishes.items.map((service) => {
        const slug = serviceSlug(service.name);
        const image = design.serviceImages.find((item) => item.slug === slug)?.image;
        return (
          <a className="lx-service-row" href={`/services/${slug}`} key={slug}>
            <span className="lx-service-row-copy">
              <h3>{service.name}</h3>
              <span>{service.detail}</span>
            </span>
            {image ? (
              <span className="lx-service-row-preview" aria-hidden="true">
                <img src={image} alt="" width="560" height="300" decoding="async" />
              </span>
            ) : null}
            <span className="lx-service-row-symbol" aria-hidden="true">
              <LogicxServiceIcon name={service.name} />
            </span>
            <ArrowUpRight className="lx-service-row-arrow" size={24} aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}

