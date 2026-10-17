import { sitePathname } from "../../shared/sitePathname";
import { ArrowDown, ArrowDownToLine, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useClientDocument } from "../../shared/useClientDocument";
import { useSitePublication } from "../../shared/useSitePublication";
import { RamutexHeader } from "./RamutexHeader";
import { RamutexPages } from "./RamutexPages";
import { RamutexCapabilities } from "./RamutexCapabilities";
import { RamutexFooter, RamutexContact } from "./RamutexContact";
import { RamutexBlogs } from "./RamutexBlogs";
import { RamutexPortfolio } from "./RamutexPortfolio";
import { RamutexFabrics } from "./RamutexFabrics";
import { WhatsAppEnquiry } from "../../shared/SiteContactTools";
import profileUrl from "./assets/ramu-tex-company-profile.pdf?url";
import "./ramutex.css";
import "./ramutex-portfolio.css";
import "./ramutex-pages.css";
export function RamutexSite() {
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [palette, setPalette] = useState("navy");
  const [compact, setCompact] = useState(false);
  const { content, blogs, connected } = useSitePublication("ramutex");
  const { profile, hero, materials, about } = content;
  const path = sitePathname().replace(/\/$/, "") || "/";
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [path]);
  const slug = sitePathname().startsWith("/blogs/") ? sitePathname().slice(7) : null;
  const post = blogs.find((item) => item.slug === slug);
  useClientDocument(
    post
      ? `${post.title} | ${profile.name}`
      : path === "/privacy"
        ? `Privacy | ${profile.name}`
        : content.pageTitle,
    post?.summary ?? content.description,
    "#faf8f5"
  );
  return (
    <div className={`ramutex-site rt-palette-${palette}${compact ? " rt-compact" : ""}`}>
      <a className="rt-skip" href="#main">
        Skip to content
      </a>
      <RamutexHeader profile={profile} path={path} />
      {path === "/" ? (
        <main id="main">
          <section className="rt-hero rt-wrap">
            <div className="rt-hero-copy">
              <p className="rt-eyebrow">
                <span />
                {hero.eyebrow}
              </p>
              <h1>
                {hero.title} <br />
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
            <div className="rt-textile-art">
              <img
                className="rt-hero-image"
                src="/ramutex/fabric-sculpture-navy.webp"
                alt="Illustrative studio study of flowing ivory, navy blue and copper knitted fabric"
                width="1536"
                height="1024"
                fetchPriority="high"
              />
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
          <RamutexPortfolio content={content} />
          <RamutexFabrics />
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
        </main>
      ) : (
        <RamutexPages content={content} blogs={blogs} path={path} />
      )}
      {path === "/" ? <RamutexContact content={content} /> : <RamutexFooter content={content} />}
      <WhatsAppEnquiry profile={profile} iconOnly />
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
                <button aria-pressed={palette === "navy"} onClick={() => setPalette("navy")}>
                  Navy & copper
                </button>
                <button aria-pressed={palette === "stone"} onClick={() => setPalette("stone")}>
                  Warm stone
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
