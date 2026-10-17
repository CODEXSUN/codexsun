import { sitePathname } from "./sitePathname";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import type { SitePublication } from "@codexsun/sites-api/public-contract";
import "./portfolio-pages.css";
import { ContactForm } from "../enquiry/ContactForm";
import { CompanyMap, WhatsAppEnquiry } from "./SiteContactTools";
import { BrandLogo } from "./BrandLogo";
import { useState } from "react";

export const portfolioRoutes = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Contact", "/contact"],
  ["Blog", "/blogs"],
  ["Privacy", "/privacy"]
] as const;

export function PortfolioPageLinks() {
  return (
    <nav className="portfolio-page-links" aria-label="Website pages">
      {portfolioRoutes
        .filter(([, href]) => href !== "/privacy")
        .map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
    </nav>
  );
}

export function PortfolioPages({
  content,
  blogs,
  connected,
  embedded = false,
  tone = "blue"
}: {
  content: PageContent;
  blogs: SitePublication["blogs"];
  connected: boolean;
  embedded?: boolean;
  tone?: "blue" | "earth";
}) {
  const [compact, setCompact] = useState(false);
  const [options, setOptions] = useState(false);
  const path = sitePathname().replace(/\/$/, "");
  const { profile, about, processing, finishes, contact } = content;
  const article = path.startsWith("/blogs/")
    ? blogs.find((post) => `/blogs/${post.slug}` === path)
    : undefined;
  const title =
    path === ""
      ? "Home"
      : (article?.title ??
        portfolioRoutes.find(([, href]) => href === path)?.[0] ??
        "Page not found");
  return (
    <div className={`portfolio-pages portfolio-${tone} ${compact ? "portfolio-compact" : ""}`}>
      <a className="portfolio-skip" href="#portfolio-main">
        Skip to content
      </a>
      {!embedded ? (
        <header className="portfolio-shell portfolio-header">
          <a href="/" className="portfolio-brand">
            <BrandLogo name={profile.name} />
            <small>{profile.tagline}</small>
          </a>
          <PortfolioPageLinks />
        </header>
      ) : null}
      <main id="portfolio-main" className="portfolio-shell portfolio-main">
        <p className="portfolio-eyebrow">{profile.name}</p>
        <h1>{title}</h1>
        {path === "" ? (
          <>
            <p className="portfolio-lead">
              {content.hero.title} {content.hero.secondLine} {content.hero.emphasis}
            </p>
            <p>{content.hero.intro}</p>
            <a className="portfolio-cta" href="/services">
              {content.hero.button} ↗
            </a>
            <section className="portfolio-panel">
              <h2>
                {about.title} {about.emphasis}
              </h2>
              <p>{about.lead}</p>
              <a href="/about">About us →</a>
            </section>
            <div className="portfolio-grid">
              {finishes.items.map((item, i) => (
                <article key={i}>
                  <h2>{item.name}</h2>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </>
        ) : path === "/about" ? (
          <>
            <p className="portfolio-lead">
              {about.title} {about.emphasis}
            </p>
            <p>{about.intro}</p>
            <h2>{about.lead}</h2>
            {about.paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            <section className="portfolio-panel">
              <h2>
                {content.responsibility.title} {content.responsibility.emphasis}
              </h2>
              <p>{content.responsibility.intro}</p>
              <div className="portfolio-grid">
                {content.responsibility.items.map((item, i) => (
                  <article key={i}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : path === "/services" ? (
          <>
            <p className="portfolio-lead">
              {finishes.title} {finishes.emphasis}
            </p>
            <p>{finishes.intro}</p>
            <div className="portfolio-grid">
              {finishes.items.map((item, i) => (
                <article className="portfolio-panel" key={i}>
                  <span className="portfolio-eyebrow">{String(i + 1).padStart(2, "0")}</span>
                  <h2>{item.name}</h2>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
            <section>
              <h2>
                {processing.title} {processing.emphasis}
              </h2>
              <p>{processing.intro}</p>
              {processing.lines.map((line, i) => (
                <article className="portfolio-panel" key={i}>
                  <h3>{line.title}</h3>
                  <p>{line.description}</p>
                  <dl>
                    {line.stages.map(([name, detail], n) => (
                      <div key={n}>
                        <dt>{name}</dt>
                        <dd>{detail}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </section>
          </>
        ) : path === "/contact" ? (
          <>
            <p className="portfolio-lead">
              {contact.title} {contact.emphasis}
            </p>
            <p>{contact.intro}</p>
            <div className="portfolio-grid">
              <section className="portfolio-panel">
                <h2>{contact.officeLabel}</h2>
                {profile.address.length ? (
                  <address>
                    {profile.address.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </address>
                ) : null}
                {profile.emails.map((email) => (
                  <p key={email}>
                    <a href={`mailto:${email}`}>{email}</a>
                  </p>
                ))}
                {profile.phones.map((phone) => (
                  <p key={phone.href}>
                    <a href={`tel:${phone.href}`}>{phone.label}</a>
                  </p>
                ))}
                {profile.gstin ? <p>GSTIN: {profile.gstin}</p> : null}
              </section>
              <ContactForm contact={contact} />
            </div>
            <CompanyMap profile={profile} />
          </>
        ) : path === "/privacy" ? (
          <section className="portfolio-prose">
            <p>This notice explains how {profile.name} handles enquiries through this website.</p>
            <h2>Information you provide</h2>
            <p>
              The enquiry form collects your name, email address, optional company and phone
              details, and your message. We use these details to respond to your request.
            </p>
            <h2>Storage and retention</h2>
            <p>
              Enquiries are stored in this company's website database. Submitted records are removed
              after 90 days. We do not publish your enquiry or share it with other client websites.
            </p>
            <h2>Maps and WhatsApp</h2>
            <p>
              Interactive maps load only when you choose to load them. Google Maps and WhatsApp are
              external services with their own privacy policies. Opening those services may share
              technical information with their providers.
            </p>
            <h2>Contact and requests</h2>
            <p>
              To ask about your enquiry or request its deletion, contact our team through the
              details on the <a href="/contact">contact page</a>. Quote your enquiry reference when
              available.
            </p>
          </section>
        ) : path === "/blogs" ? (
          <>
            <p className="portfolio-lead">News, ideas and updates from {profile.brand}.</p>
            {blogs.length ? (
              <div className="portfolio-grid">
                {blogs.map((post) => (
                  <article className="portfolio-panel" key={post.slug}>
                    <h2>
                      <a href={`/blogs/${post.slug}`}>{post.title}</a>
                    </h2>
                    <p>{post.summary}</p>
                    <a href={`/blogs/${post.slug}`}>Read article →</a>
                  </article>
                ))}
              </div>
            ) : (
              <p>
                {connected
                  ? "No articles have been published yet."
                  : "Articles are temporarily unavailable. Please check back soon."}
              </p>
            )}
          </>
        ) : article ? (
          <article>
            <p className="portfolio-lead">{article.summary}</p>
            {article.body.split(/\n\s*\n/).map((paragraph, i) => (
              <p className="portfolio-article-paragraph" key={i}>
                {paragraph}
              </p>
            ))}
            <a href="/blogs">← All articles</a>
          </article>
        ) : (
          <>
            <p>This page is unavailable.</p>
            <a href="/">Return home →</a>
          </>
        )}
        <aside className="portfolio-next">
          <p>{profile.tagline}</p>
          <a href="/contact">Start a conversation ↗</a>
        </aside>
      </main>
      {!embedded ? (
        <footer className="portfolio-shell portfolio-footer">
          <span>{profile.name}</span>
          <span>{content.footer.lineOne}</span>
          <a href="/privacy">Privacy notice</a>
          <PortfolioPageLinks />
        </footer>
      ) : null}
      {!embedded ? <WhatsAppEnquiry profile={profile} /> : null}
      {import.meta.env.DEV && !embedded ? (
        <aside className="portfolio-tweaks">
          <button onClick={() => setOptions(!options)} aria-expanded={options}>
            Design options
          </button>
          {options ? (
            <div>
              <p>{connected ? "Published content connected" : "Content service unavailable"}</p>
              <button onClick={() => setCompact(!compact)} aria-pressed={compact}>
                {compact ? "Use relaxed spacing" : "Use compact spacing"}
              </button>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
