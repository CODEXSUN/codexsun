import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import type { BlogContent } from "@codexsun/sites-api/blog-contract";
import { RamutexCapabilities } from "./RamutexCapabilities";
import { RamutexContact } from "./RamutexContact";
import { RamutexFabrics } from "./RamutexFabrics";
import { RamutexArticle, RamutexJournal, RamutexPrivacy } from "./RamutexReading";
import profileUrl from "./assets/ramu-tex-company-profile.pdf?url";

export function RamutexPages({
  content,
  blogs,
  path
}: {
  content: PageContent;
  blogs: BlogContent[];
  path: string;
}) {
  const article = blogs.find((post) => `/blogs/${post.slug}` === path);
  const titles: Record<string, [string, string]> = {
    "/about": ["THE COMPANY", "Rooted in textiles. Looking forward."],
    "/services": ["PROCESSING & FINISHING", "The right process. A considered finish."],
    "/contact": ["LET’S TALK FABRIC", "Your next fabric starts here."],
    "/blogs": ["THE RAMU TEX JOURNAL", "Colour. Craft. Conversation."],
    "/privacy": ["YOUR INFORMATION", "A clear approach to privacy."]
  };
  const [label, title] =
    titles[path] ??
    (article
      ? ["FROM THE JOURNAL", article.title]
      : ["PAGE NOT FOUND", "Let’s find your way back."]);
  return (
    <main id="main" className={`rt-inner-page rt-page-${path.slice(1).split("/")[0]}`}>
      <section className="rt-page-hero rt-wrap">
        <p className="rt-eyebrow">{label}</p>
        <h1>{title}</h1>
        {path === "/services" ? (
          <p>{content.processing.intro}</p>
        ) : path === "/about" ? (
          <p>{content.about.intro}</p>
        ) : null}
      </section>
      {path === "/about" ? (
        <RamutexAbout content={content} />
      ) : path === "/services" ? (
        <>
          <RamutexMaterialBanner />
          <RamutexFabrics detailed />
          <RamutexCapabilities content={content} />
        </>
      ) : path === "/contact" ? (
        <RamutexContact content={content} showFooter={false} showIntro={false} />
      ) : path === "/blogs" ? (
        <RamutexJournal posts={blogs} />
      ) : path === "/privacy" ? (
        <RamutexPrivacy profile={content.profile} />
      ) : article ? (
        <RamutexArticle post={article} />
      ) : (
        <section className="rt-wrap rt-reading">
          <p>This page is unavailable.</p>
          <a className="rt-button rt-button-dark" href="/">
            Return home <ArrowUpRight size={18} />
          </a>
        </section>
      )}
      {path !== "/contact" && path !== "/privacy" ? (
        <section className="rt-wrap rt-closing">
          <div>
            <p className="rt-eyebrow">YOUR FABRIC. YOUR POSSIBILITIES.</p>
            <h2>Start with a conversation.</h2>
          </div>
          <a className="rt-button rt-button-dark" href="/contact">
            Discuss your requirements <ArrowUpRight size={18} />
          </a>
        </section>
      ) : null}
    </main>
  );
}

function RamutexMaterialBanner() {
  return (
    <figure className="rt-wrap rt-page-image">
      <img
        src="/ramutex/material-study-navy.webp"
        width="1536"
        height="1024"
        alt="Illustrative studio study of navy, ivory and copper fabric swatches with cotton yarn"
      />
      <figcaption>Illustrative material study · Colour, texture and construction.</figcaption>
    </figure>
  );
}

function RamutexAbout({ content }: { content: PageContent }) {
  const { about, responsibility, materials, equipment } = content;
  return (
    <>
      <RamutexMaterialBanner />
      <section className="rt-wrap rt-about-story rt-section">
        <div>
          <p className="rt-eyebrow">{about.label}</p>
          <h2>
            {about.title}
            <br />
            <em>{about.emphasis}</em>
          </h2>
        </div>
        <div>
          <p className="rt-reading-lead">{about.lead}</p>
          {about.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <a className="rt-text-link" href={profileUrl} download="Ramu-Tex-Company-Profile.pdf">
            Download company profile <ArrowDownToLine size={18} />
          </a>
        </div>
      </section>
      <section className="rt-about-materials rt-wrap">
        <p className="rt-eyebrow">MATERIALS WE WORK WITH</p>
        <div>
          {materials.names.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
        <p>{materials.caption}</p>
      </section>
      <section className="rt-responsibility rt-section">
        <div className="rt-wrap">
          <p className="rt-eyebrow">{responsibility.label}</p>
          <h2>
            {responsibility.title}
            <br />
            <em>{responsibility.emphasis}</em>
          </h2>
          <p className="rt-section-intro">{responsibility.intro}</p>
          <div className="rt-about-values">
            {responsibility.items.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <p className="rt-image-note">{responsibility.note}</p>
          <a className="rt-text-link" href={profileUrl} target="_blank" rel="noreferrer">
            Read the original profile <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <section className="rt-equipment rt-wrap">
        <p className="rt-eyebrow">{equipment.label}</p>
        <div>
          {equipment.names.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
        <p>{equipment.note}</p>
      </section>
    </>
  );
}
