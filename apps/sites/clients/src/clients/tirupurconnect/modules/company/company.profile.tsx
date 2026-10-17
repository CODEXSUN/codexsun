import { useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import type { Company } from "@codexsun/tconnect-web/public";
import type { Association } from "@codexsun/tconnect-web/public";
import { PublicProducts } from "../product/product.public";
import type { PublicCredential } from "@codexsun/tconnect-web/public";
import { CompanyBadges } from "./company.badges";
import { InquiryForm } from "../inquiry/inquiry.form";
export function CompanyProfile({
  company,
  association,
  credentials = []
}: {
  company: Company;
  association: Association | undefined;
  credentials?: PublicCredential[];
}) {
  const [enquire, setEnquire] = useState(
    new URLSearchParams(location.search).get("enquire") === "1"
  );
  return (
    <>
      <main className="tc-container">
        <a className="tc-back" href="/companies">
          <ArrowLeft size={16} />
          All companies
        </a>
        <div className="tc-profile-hero" style={{ background: company.color }}>
          <div className="tc-profile-monogram">
            {company.logoDataUrl ? (
              <img
                className="tc-company-logo"
                src={company.logoDataUrl}
                alt={`${company.name} logo`}
              />
            ) : (
              company.initials
            )}
          </div>
          <span>
            {company.industry} / {company.city}
          </span>
          {company.description.toLowerCase().includes("fictional") ? (
            <span>Sample business · demonstration content</span>
          ) : null}
          <h1>{company.name}</h1>
          <p>{company.tagline}</p>
        </div>
        <nav className="tc-profile-tabs" aria-label="Company profile sections">
          <a href="#overview">Overview</a>
          <a href="#products">Products & capabilities</a>
          <a href="#credentials">Credentials & trust</a>
          <a href="#company-enquiry">Enquire</a>
        </nav>
        <div className="tc-profile-grid">
          <article id="overview">
            <span className="tc-eyebrow">MEET THE BUSINESS</span>
            <h2>
              Good work.
              <br />A team worth knowing.
            </h2>
            <p>{company.description}</p>
            <h3 id="products">Products & capabilities</h3>
            <PublicProducts companyUuid={company.uuid} />
            <div className="tc-product-tags">
              {company.products.split(",").map((product) => (
                <span key={product}>{product}</span>
              ))}
            </div>
            <section className="tc-profile-credentials" id="credentials">
              <span className="tc-eyebrow">EVIDENCE BEHIND THE BADGE</span>
              <h2>Credentials & trust</h2>
              <CompanyBadges
                sample={company.description.toLowerCase().includes("fictional")}
                credentials={credentials}
              />
              {credentials.length ? (
                credentials.map((record) => (
                  <article className="tc-credential-detail" key={record.uuid}>
                    <h3>
                      {record.kind === "identity"
                        ? "Business identity review"
                        : record.standardName}
                    </h3>
                    <dl>
                      <dt>Issuer / source</dt>
                      <dd>{record.issuer}</dd>
                      <dt>Reference</dt>
                      <dd>{record.reference}</dd>
                      <dt>Reviewed</dt>
                      <dd>{record.reviewedAt}</dd>
                      <dt>Valid until</dt>
                      <dd>{record.expiresOn}</dd>
                    </dl>
                    <p>{record.scope}</p>
                    <a
                      className="tc-text-link"
                      href={record.publicEvidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View public evidence <ArrowUpRight size={16} />
                    </a>
                  </article>
                ))
              ) : (
                <p>
                  No current approved evidence is published for this profile. Any Sample badge is
                  illustrative. Ask the business for documents covering your specific product,
                  process and delivery requirements.
                </p>
              )}
              <small>
                Staff review records the evidence checked. It does not guarantee product quality or
                commercial performance. Expired and revoked reviews do not display as current
                credentials.
              </small>
            </section>
            {association ? (
              <section className="tc-membership">
                <span className="tc-eyebrow">ASSOCIATION MEMBER</span>
                <h3>{association.name}</h3>
                <p>{association.tagline}</p>
                <a href={`/associations/${association.slug}`}>
                  Meet the community <ArrowUpRight size={16} />
                </a>
              </section>
            ) : null}
          </article>
          <aside className="tc-profile-aside" id="company-enquiry">
            <h3>Let’s make a connection.</h3>
            <p>Share your requirements and start a business conversation.</p>
            <button className="tc-button" onClick={() => setEnquire(true)}>
              Send an enquiry <ArrowUpRight size={17} />
            </button>
            <dl>
              <dt>Business type</dt>
              <dd>{company.role}</dd>
              <dt>Based in</dt>
              <dd>
                <MapPin size={15} />
                {company.city}
              </dd>
              <dt>Established</dt>
              <dd>{company.established}</dd>
              <dt>Capacity / coverage</dt>
              <dd>{company.capacity}</dd>
            </dl>
            <small>
              Information supplied by the profile owner
              <br />
              Credential status is limited to the evidence and scope shown on this page.
            </small>
          </aside>
        </div>
      </main>
      <a
        className="tc-mobile-enquire"
        href="#company-enquiry"
        onClick={(event) => {
          event.preventDefault();
          setEnquire(true);
        }}
      >
        Send an enquiry <ArrowUpRight size={17} />
      </a>
      {enquire ? <InquiryForm company={company} onClose={() => setEnquire(false)} /> : null}
    </>
  );
}
