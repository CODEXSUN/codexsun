import { ArrowRight, Search } from "lucide-react";
import { usePortalContent, useTextileContent } from "./portal.content";
export function PortalHero() {
  const { hero } = usePortalContent();
  const textile = useTextileContent();
  const quick = [
    ["Knitted Fabrics", "Knitted Fabrics"],
    ["Garments", "Garment Manufacturing"],
    ["Yarn", "Yarn & Fibre"],
    ["Dyeing", "Dyeing & Processing"],
    ["Printing", "Printing & Embroidery"],
    ["Accessories", "Accessories & Packaging"]
  ];
  return (
    <section className="tc-hero">
      <div className="tc-hero-copy">
        <span className="tc-eyebrow">
          <span className="tc-small-line" />
          {hero.eyebrow}
        </span>
        <h1>
          {hero.title}
          <br />
          {hero.secondLine}
          <br />
          <em>{hero.emphasis}</em>
        </h1>
        <p>{hero.intro}</p>
        <form className="tc-search" action="/companies">
          <Search size={22} />
          <input
            aria-label="Search businesses, products or services"
            name="q"
            placeholder="Knitted fabric, garment manufacturer…"
          />
          <button type="submit" aria-label="Search businesses">
            <ArrowRight size={22} />
          </button>
        </form>
        <div className="tc-hero-actions">
          <a className="tc-text-link" href="/register/buyer">
            Post a requirement <ArrowRight size={17} />
          </a>
          <a href="/register" className="tc-hero-seller">
            List your business <ArrowRight size={15} />
          </a>
        </div>
        <div className="tc-popular">
          <span>Explore</span>
          {quick.map(([label, category]) => (
            <a key={label} href={`/companies?category=${encodeURIComponent(category ?? "")}`}>
              {label}
            </a>
          ))}
        </div>
      </div>
      <div className="tc-editorial-art">
        <div className="tc-art-arch" />
        <div className="tc-art-thread" />
        <img
          className="tc-hero-photo"
          src={textile.heroImage}
          alt={textile.heroAlt}
          width="1024"
          height="1536"
          fetchPriority="high"
        />
        <div className="tc-made-note">
          <span>
            MADE IN
            <br />
            TIRUPUR.
          </span>
          <em>
            Worn
            <br />
            Everywhere.
          </em>
        </div>
        <div className="tc-connection-seal">
          <span>LOCAL ROOTS · GLOBAL REACH</span>
          <strong>TIRUPUR</strong>
          <small>CONNECTED TO POSSIBILITIES</small>
        </div>
        <span className="tc-art-caption">TEXTURE. CRAFT. CONNECTION. · ILLUSTRATIVE ARTWORK</span>
      </div>
    </section>
  );
}
