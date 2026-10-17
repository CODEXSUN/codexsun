import { ArrowUpRight, FileCheck2 } from "lucide-react";

const standards = [
  {
    name: "GOTS",
    logo: "/standards/gots.webp",
    title: "Organic textile processing",
    description:
      "A standard for processing textiles made with organic fibres, with environmental and social requirements.",
    url: "https://global-standards.org/our-standards/gots",
    detail: "Organic fibres / processing"
  },
  {
    name: "GRS",
    logo: "/standards/grs.webp",
    title: "Recycled material traceability",
    description:
      "A standard covering recycled content and chain of custody, with additional processing requirements.",
    url: "https://textileexchange.org/recycled-claim-global-recycled-standard/",
    detail: "Recycled content / traceability"
  },
  {
    name: "OEKO-TEX®",
    logo: "/standards/oeko-tex.webp",
    title: "STANDARD 100",
    description:
      "A product label for textiles tested for harmful substances. Check the certificate against the specific article.",
    url: "https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100",
    detail: "Product testing / harmful substances"
  },
  {
    name: "ISO 9001",
    logo: "",
    title: "Quality management systems",
    description:
      "Requirements for a quality management system. System certification is distinct from certification of a textile product.",
    url: "https://www.iso.org/standards/popular/iso-9000-family",
    detail: "Management systems / quality"
  }
];

export function TextileStandards() {
  return (
    <section className="tc-standards" aria-labelledby="standards-title">
      <div className="tc-container">
        <div className="tc-section-heading">
          <div>
            <span className="tc-eyebrow">CERTIFICATIONS & STANDARDS</span>
            <h2 id="standards-title">
              Better questions.
              <br />
              <em>More confident sourcing.</em>
            </h2>
          </div>
          <p className="tc-standards-intro">
            Know what a claim means before you compare suppliers. Explore the official standards,
            then ask for current, relevant documentation.
          </p>
        </div>
        <div className="tc-standards-grid">
          {standards.map((item) => (
            <a
              className="tc-standard"
              href={item.url}
              key={item.name}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.name}: ${item.title}, official resource (opens in a new tab)`}
            >
              <div className="tc-standard-logo">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={`${item.name} logo — educational reference`}
                    width="240"
                    height="140"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="tc-iso-reference"
                    aria-label="ISO 9001 reference, not an official certification logo"
                  >
                    <strong>ISO</strong>
                    <span>9001</span>
                    <small>STANDARD REFERENCE</small>
                  </div>
                )}
              </div>
              <span className="tc-standard-name">{item.name}</span>
              <span className="tc-standard-detail">{item.detail}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="tc-standard-link">
                Official standard <ArrowUpRight size={17} />
              </span>
            </a>
          ))}
        </div>
        <div className="tc-standards-note">
          <FileCheck2 size={23} />
          <p>
            <strong>Check the scope, issuer and validity.</strong> Ask whether the document covers
            the specific company, site, process and product you are sourcing. These references are
            educational; Tirupur Connect does not certify companies, and no listed business is
            represented as holding these certifications. Logos identify the standards discussed;
            they do not indicate affiliation or endorsement. The ISO 9001 panel uses a typographic
            reference, not the restricted ISO logo.
          </p>
        </div>
      </div>
    </section>
  );
}
