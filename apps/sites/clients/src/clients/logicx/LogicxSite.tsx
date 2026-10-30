import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { sitePathname } from "../../shared/sitePathname";
import { useSitePublication } from "../../shared/useSitePublication";
import { useClientDocument } from "../../shared/useClientDocument";
import { BrandLogo } from "../../shared/BrandLogo";
import { WhatsAppEnquiry } from "../../shared/SiteContactTools";
import { PortfolioPages } from "../../shared/PortfolioPages";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import { LogicxHome, LogicxServices } from "./LogicxHome";
import { LogicxApplications, LogicxServiceDetail, LogicxSupport } from "./LogicxApplications";
import "./logicx-site.css";

const navigation = [
  ["Services", "/services"],
  ["Applications", "/apps"],
  ["About", "/about"],
  ["Support", "/support"],
  ["Insights", "/blogs"]
] as const;

export function LogicxSite() {
  const { content, blogs, connected } = useSitePublication("logicx");
  const path = sitePathname().replace(/\/$/, "") || "/";
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const design = content.marketing ?? initialLogicxMarketing;
  useEffect(() => {
    if (!menu) return;
    navigationRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);
  const app = content.applications?.find((item) => path === `/apps/${item.slug}`);
  const post = blogs.find((item) => path === `/blogs/${item.slug}`);
  useClientDocument(
    app
      ? `${app.name} | LogicX Software`
      : post
        ? `${post.title} | LogicX Software`
        : content.pageTitle,
    app?.summary ?? post?.summary ?? content.description,
    "#ffffff"
  );
  return (
    <div className="logicx-studio">
      <a className="lx-skip" href="#logicx-main">
        Skip to content
      </a>
      <header className="lx-header">
        <div className="lx-shell lx-nav">
          <a href="/" className="lx-brand" aria-label="LogicX Software home">
            <BrandLogo name={content.profile.name} />
            <span>SOFTWARE STUDIO</span>
          </a>
          <button
            className="lx-mobile-menu"
            ref={menuButton}
            aria-controls="logicx-navigation"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <nav
            className={menu ? "lx-navigation lx-navigation-open" : "lx-navigation"}
            aria-label="Main navigation"
            ref={navigationRef}
            id="logicx-navigation"
          >
            {navigation.map(([name, url]) => (
              <a key={url} href={url} aria-current={path === url ? "page" : undefined}>
                {name}
              </a>
            ))}
            <a className="lx-nav-contact" href="/contact">
              {design.navigationLabel} <ArrowUpRight size={17} />
            </a>
          </nav>
        </div>
      </header>
      {path === "/" ? (
        <LogicxHome content={content} />
      ) : path === "/apps" || path.startsWith("/apps/") ? (
        <LogicxApplications content={content} path={path} />
      ) : path === "/services" ? (
        <LogicxServices content={content} />
      ) : path.startsWith("/services/") ? (
        <LogicxServiceDetail content={content} path={path} />
      ) : path === "/support" ? (
        <LogicxSupport content={content} />
      ) : (
        <div id="logicx-main">
          <PortfolioPages embedded content={content} blogs={blogs} connected={connected} />
        </div>
      )}
      <footer className="lx-footer">
        <div className="lx-shell">
          <div className="lx-footer-heading">
            <a className="lx-brand" href="/">
              <img
                className="portfolio-brand-logo"
                src="/logo-dark.svg"
                width="190"
                height="53"
                alt={content.profile.name}
              />
              <span>SOFTWARE STUDIO</span>
            </a>
            <p>{content.footer.lineOne}</p>
            <a href="/contact" className="lx-text-link">
              Start a conversation <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="lx-footer-columns">
            <div>
              <h3>About LogicX</h3>
              <p>{content.about.lead}</p>
              <p>{content.about.intro}</p>
              <a className="lx-text-link" href="/about">
                Get to know us <ArrowUpRight size={15} />
              </a>
            </div>
            <div>
              <h3>How we can help</h3>
              <nav aria-label="Footer services">
                <a href="/services">Custom software and applications</a>
                <a href="/apps">Business application collection</a>
                <a href="/support">Maintenance and continued support</a>
                <a href="/blogs">Ideas and insights</a>
              </nav>
            </div>
            <div>
              <h3>Let us talk about your business</h3>
              <p>{content.contact.formIntro}</p>
              {content.profile.phones.map((phone) => (
                <a key={phone.href} href={`tel:${phone.href}`}>
                  {phone.label}
                </a>
              ))}
              {content.profile.emails.map((email) => (
                <a key={email} href={`mailto:${email}`}>
                  {email}
                </a>
              ))}
              <a className="lx-text-link" href="/contact">
                Send us an enquiry <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
          <div className="lx-footer-bottom">
            <span>{content.profile.name}</span>
            <nav aria-label="Footer navigation">
              <a href="/apps">Applications</a>
              <a href="/contact">Contact</a>
              <a href="/privacy">Privacy</a>
              <a href="https://app.codexsun.com" target="_blank" rel="noreferrer">
                Customer sign-in
              </a>
            </nav>
            <span>{content.footer.lineTwo}</span>
          </div>
        </div>
      </footer>
      <WhatsAppEnquiry profile={content.profile} iconOnly />
    </div>
  );
}


