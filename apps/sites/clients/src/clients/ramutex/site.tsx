import { ArrowDown, ArrowDownToLine, ArrowUpRight, Menu, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useClientDocument } from "../../shared/useClientDocument";
import { useSitePublication } from "../../shared/useSitePublication";
import { PortfolioPages, PortfolioPageLinks } from "../../shared/PortfolioPages";
import { RamutexCapabilities } from "./RamutexCapabilities";
import { RamutexContact } from "./RamutexContact";
import { RamutexBlogs } from "./RamutexBlogs";
import profileUrl from "./assets/ramu-tex-company-profile.pdf?url";
import "./ramutex.css";
export function RamutexSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [palette, setPalette] = useState("earth");
  const [compact, setCompact] = useState(false);
  const { content, blogs, connected } = useSitePublication("ramutex");
  const { profile, hero, materials, about } = content;
  const slug = window.location.pathname.startsWith("/blogs/")
    ? window.location.pathname.slice(7)
    : null;
  const post = blogs.find((item) => item.slug === slug);
  useClientDocument(
    post ? `${post.title} | ${profile.name}` : content.pageTitle,
    post?.summary ?? content.description,
    "#f5f3eb"
  );
  if (window.location.pathname !== "/")
    return <PortfolioPages content={content} blogs={blogs} connected={connected} tone="earth" />;
  const navigation = [
    ["About", "/about"],
    ["Services", "/services"],
    ["Blog", "/blogs"]
  ];
  return (
    <div className={`ramutex-site rt-palette-${palette}${compact ? " rt-compact" : ""}`}>
      <a className="rt-skip" href="#main">
        Skip to content
      </a>
      <div className="rt-topline">
        <span>{profile.name.toUpperCase()}</span>
        <span>
          {profile.location.toUpperCase()}
          <span className="rt-dot" />
        </span>
      </div>
      <header className="rt-header rt-wrap">
        <a className="rt-wordmark" href="#" aria-label={`${profile.name} home`}>
          <span className="rt-mark" aria-hidden="true">
            r<span>t</span>
          </span>
          <span>
            {profile.brand}
            <small>{profile.tagline.toUpperCase()}</small>
          </span>
        </a>
        <nav className={menuOpen ? "rt-nav is-open" : "rt-nav"} aria-label="Main navigation">
          {navigation.map(([label, id]) => (
            <a key={id} href={id} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="rt-nav-contact" href="/contact" onClick={() => setMenuOpen(false)}>
            Let’s talk fabric
            <ArrowUpRight size={16} />
          </a>
        </nav>
        <button
          className="rt-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section className="rt-hero rt-wrap">
          <div className="rt-hero-copy">
            <p className="rt-eyebrow">
              <span />
              {hero.eyebrow}
            </p>
            <h1>
              {hero.title}
              <br />
              {hero.secondLine}
              <br />
              <em>{hero.emphasis}</em>
            </h1>
            <p className="rt-hero-intro">{hero.intro}</p>
            <a className="rt-button rt-button-dark" href="#processing">
              {hero.button}
              <ArrowUpRight size={18} />
            </a>
            <div className="rt-hero-caption">
              <span className="rt-small-line" />
              {hero.caption}
            </div>
          </div>
          <div
            className="rt-textile-art"
            role="img"
            aria-label="An abstract arrangement of woven fabric in sage, terracotta, ivory and charcoal"
          >
            <div className="rt-fabric rt-fabric-sage" />
            <div className="rt-fabric rt-fabric-rust" />
            <div className="rt-fabric rt-fabric-ivory" />
            <div className="rt-fabric rt-fabric-dark" />
            <div className="rt-art-label">
              <span>{hero.artLabel}</span>
              <ArrowDown size={16} />
            </div>
            <div className="rt-art-note">
              {hero.artTitle}
              <br />
              <em>{hero.artEmphasis}</em>
            </div>
          </div>
        </section>
        <div className="rt-material-strip">
          <div className="rt-wrap">
            {materials.names.map((name, index) => (
              <span key={index}>{name}</span>
            ))}
            <span className="rt-material-note">{materials.caption}</span>
          </div>
        </div>
        <section id="about" className="rt-section rt-wrap rt-about">
          <div>
            <p className="rt-eyebrow">{about.label}</p>
            <h2>
              {about.title}
              <br />
              <em>{about.emphasis}</em>
            </h2>
            <p className="rt-about-intro">{about.intro}</p>
          </div>
          <div className="rt-about-body">
            <p className="rt-lead">{about.lead}</p>
            {about.paragraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
            <a href={profileUrl} download="Ramu-Tex-Company-Profile.pdf" className="rt-text-link">
              {about.profileLink}
              <ArrowDownToLine size={17} />
            </a>
          </div>
        </section>
        <RamutexCapabilities content={content} />
        <RamutexBlogs posts={blogs} />
        <PortfolioPageLinks />
      </main>
      <RamutexContact content={content} />
      {import.meta.env.DEV ? (
        <aside className="rt-tweaks">
          <button onClick={() => setTweaksOpen(!tweaksOpen)} aria-expanded={tweaksOpen}>
            <SlidersHorizontal size={15} />
            Design options
          </button>
          {tweaksOpen ? (
            <div>
              <p>
                {connected
                  ? "Published content connected"
                  : "Built-in company profile · content service not connected"}
              </p>
              <span>Fabric palette</span>
              <div>
                <button aria-pressed={palette === "earth"} onClick={() => setPalette("earth")}>
                  Earth
                </button>
                <button aria-pressed={palette === "indigo"} onClick={() => setPalette("indigo")}>
                  Indigo
                </button>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={compact}
                  onChange={(e) => setCompact(e.target.checked)}
                />
                Compact spacing
              </label>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
export default RamutexSite;
