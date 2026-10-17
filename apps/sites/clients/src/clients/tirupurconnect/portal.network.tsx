import { useTextileContent } from "./portal.content";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Globe2 } from "lucide-react";
import type { Company } from "@codexsun/tconnect-web/public";

export function NetworkSnapshot({
  companies,
  associationCount
}: {
  companies: Company[];
  associationCount: number;
}) {
  const locations = [...new Set(companies.map((item) => item.city.trim()).filter(Boolean))];
  const figures = [
    { label: "Published businesses", value: companies.length },
    { label: "Association profiles", value: associationCount },
    {
      label: "Industries represented",
      value: new Set(companies.map((item) => item.industry)).size
    },
    { label: "Connected locations", value: locations.length }
  ];
  return (
    <section className="tc-container tc-network" aria-labelledby="network-title">
      <div className="tc-network-heading">
        <span className="tc-eyebrow">A NETWORK TAKING SHAPE</span>
        <h2 id="network-title">
          Local connections.
          <br />
          <em>Wider possibilities.</em>
        </h2>
        <p>
          Every profile is another starting point. Explore the businesses and communities currently
          published on this portal.
        </p>
      </div>
      <div className="tc-network-figures">
        {figures.map((item) => (
          <AnimatedFigure key={item.label} {...item} />
        ))}
      </div>
      <div className="tc-network-footnote">
        <span>
          <Globe2 size={16} />{" "}
          {locations.length
            ? locations.join(" · ")
            : "New locations will appear as businesses publish."}
        </span>
        <p>
          Directory snapshot, including fictional sample profiles. Counts do not represent verified
          connections, transactions or certified businesses.
        </p>
      </div>
    </section>
  );
}

function AnimatedFigure({ value, label }: { value: number; label: string }) {
  const element = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      setDisplay(value);
    };
    if (motion.matches || !("IntersectionObserver" in window)) {
      finish();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (motion.matches) {
          finish();
          return;
        }
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / 1400, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    if (element.current) observer.observe(element.current);
    motion.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [value]);
  return (
    <div
      ref={element}
      className="tc-network-figure"
      aria-label={`${value.toLocaleString("en-IN")} ${label}`}
    >
      <strong aria-hidden="true">
        {display.toLocaleString("en-IN")}
        <span>.</span>
      </strong>
      <span aria-hidden="true">{label}</span>
    </div>
  );
}

export function EnterpriseSpotlights({ companies }: { companies: Company[] }) {
  const selected = companies
    .filter(
      (item) =>
        item.role !== "buyer" &&
        /textile|knit|yarn|fabric|apparel/i.test(`${item.industry} ${item.products}`)
    )
    .slice(0, 3);
  const doc = useTextileContent().documents.find((doc) => doc.path === "enterprises");
  if (!selected.length) return null;
  return (
    <section className="tc-container tc-enterprises" aria-labelledby="enterprise-title">
      <div className="tc-section-heading">
        <div>
          <span className="tc-eyebrow">BUSINESSES WITH A POINT OF VIEW</span>
          <h2 id="enterprise-title">{doc?.title ?? "A bigger stage. For what you make."}</h2>
        </div>
        <p className="tc-enterprise-intro">
          {doc?.intro ?? "Explore specialist company profiles."}
        </p>
      </div>
      {doc?.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <div className="tc-enterprise-banners">
        {selected.map((company, index) => (
          <a
            key={company.uuid}
            className={`tc-enterprise-banner tc-enterprise-tone-${index}`}
            href={`/companies/${company.slug}`}
          >
            <div className="tc-enterprise-top">
              <span>
                {company.description.toLowerCase().includes("fictional")
                  ? "SAMPLE BUSINESS SPOTLIGHT"
                  : "BUSINESS SPOTLIGHT"}
              </span>
              <ArrowUpRight size={22} />
            </div>
            <div className="tc-enterprise-identity">
              {company.logoDataUrl ? (
                <img src={company.logoDataUrl} width="56" height="56" alt="" loading="lazy" />
              ) : (
                <span className="tc-enterprise-monogram">{company.initials}</span>
              )}
              <span>
                {company.city} / {company.industry}
              </span>
            </div>
            <h3>{company.name}</h3>
            <p>{company.tagline}</p>
            <div className="tc-enterprise-bottom">
              <span>Explore the company</span>
              <span>0{index + 1}</span>
            </div>
          </a>
        ))}
      </div>
      <p className="tc-art-credit">
        Editorial spotlights from published directory profiles. Placement does not imply enterprise
        status, sponsorship, certification or endorsement. Textile artwork is illustrative.
      </p>
    </section>
  );
}
