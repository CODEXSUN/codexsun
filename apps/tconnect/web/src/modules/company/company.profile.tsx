import { useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import type { Company } from "./company.types";
import type { Association } from "../association/association.types";
import { PublicProducts } from "../product/product.public";
import { InquiryForm } from "../inquiry/inquiry.form";
export function CompanyProfile({
  company,
  association
}: {
  company: Company;
  association: Association | undefined;
}) {
  const [enquire, setEnquire] = useState(false);
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
        <div className="tc-profile-grid">
          <article>
            <span className="tc-eyebrow">MEET THE BUSINESS</span>
            <h2>
              Good work.
              <br />A team worth knowing.
            </h2>
            <p>{company.description}</p>
            <h3>Products & capabilities</h3>
            <PublicProducts companyUuid={company.uuid} />
            <div className="tc-product-tags">
              {company.products.split(",").map((product) => (
                <span key={product}>{product}</span>
              ))}
            </div>
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
          <aside className="tc-profile-aside">
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
                {company.city}, Tamil Nadu
              </dd>
              <dt>Established</dt>
              <dd>{company.established}</dd>
              <dt>Capacity / coverage</dt>
              <dd>{company.capacity}</dd>
            </dl>
            <small>
              Information supplied by the profile owner
              <br />
              No verification or certification implied.
            </small>
          </aside>
        </div>
      </main>
      {enquire ? <InquiryForm company={company} onClose={() => setEnquire(false)} /> : null}
    </>
  );
}
