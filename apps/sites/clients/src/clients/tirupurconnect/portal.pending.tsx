import { useTextileContent, PortalClosingBanner, usePortalContent } from "./portal.content";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { PortalHero } from "./portal.hero";
import { CategoryDiscovery } from "./portal.categories";
import { PortalJourney } from "./portal.journey";
export function PendingHome({ retry }: { retry: () => void }) {
  const content = useTextileContent();
  return (
    <main className="tc-home">
      <PortalHero />
      <div className="tc-container tc-readiness" role="status">
        <div>
          <strong>{content.notice.title}</strong>
          <p>{content.notice.body}</p>
        </div>
        <button className="tc-text-link" onClick={retry}>
          Check availability <RefreshCw size={16} />
        </button>
      </div>
      <div className="tc-container">
        <CategoryDiscovery />
      </div>
      <PortalJourney />
      <PortalClosingBanner />
    </main>
  );
}
export function PendingDirectory({ retry }: { retry: () => void }) {
  const { profile } = usePortalContent();
  const textile = useTextileContent();
  const section = location.pathname.split("/")[1];
  const copy =
    section === "associations"
      ? textile.associations
      : section === "community"
        ? textile.community
        : textile.directory;
  const doc = textile.documents.find((doc) => doc.path === section);
  return (
    <main className="tc-container tc-pending-directory">
      <span className="tc-eyebrow">{copy.label}</span>
      <h1>
        {doc?.title ?? copy.title}
        <br />
        <em>{doc ? "" : copy.emphasis}</em>
      </h1>
      <p>{doc?.intro ?? copy.intro}</p>
      {doc?.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <p>
        Business profiles, products and community updates will appear here when the Tirupur Connect
        workspace is ready. Explore categories to plan your sourcing shortlist.
      </p>
      <div className="tc-hero-actions">
        <a className="tc-button" href="/categories">
          Explore textile categories <ArrowUpRight size={17} />
        </a>
        <button className="tc-text-link" onClick={retry}>
          Check availability <RefreshCw size={16} />
        </button>
      </div>
      <p>
        Have a question?{" "}
        {profile.emails.map((email) => (
          <a key={email} href={`mailto:${email}`}>
            {email}
          </a>
        ))}
      </p>
    </main>
  );
}
