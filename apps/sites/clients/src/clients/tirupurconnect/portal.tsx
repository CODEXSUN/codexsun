import { PortalContent, initialTirupurPage } from "./portal.content";
import { useSitePublication } from "../../shared/useSitePublication";
import { useState } from "react";
import { PortalHeader } from "./portal.header";
import { PortalFooter } from "./portal.brand";
import { PortalHome } from "./portal.home";
import { PortalDirectory } from "./portal.directory";
import { PortalInformation } from "./portal.information";
import { CategoryDiscovery } from "./portal.categories";
import { EnterpriseSpotlights } from "./portal.network";
import { TextileStandards } from "./portal.standards";
import { usePortalData, type PortalData } from "./portal.data";
import { usePortalMetadata } from "./portal.seo";
import { FeedFeedback } from "./portal.feedback";
import { PendingDirectory } from "./portal.pending";
import { CompanyProfile } from "./modules/company/company.profile";
import { AssociationsPage } from "./modules/association/association.page";
import { CommunityPage } from "./modules/community/community.page";
import { BuyerRegistration } from "./modules/buyer/buyer.registration";
import { MemberRegistration } from "./modules/member/member.registration";
import "./portal.css";
import "./portal.editorial.css";
import "./portal.network.css";
import "./portal.refined.css";
export function TconnectPortal() {
  const { content } = useSitePublication("tirupurconnect", initialTirupurPage);
  const data = usePortalData();
  const [dense, setDense] = useState(false);
  usePortalMetadata(data, content);
  return (
    <PortalContent.Provider value={content}>
      <div className={`tc-root ${dense ? "tc-compact" : ""}`}>
        <a className="tc-skip" href="#tc-content">
          Skip to content
        </a>
        <PortalHeader />
        <div id="tc-content" tabIndex={-1} />
        <PortalPage data={data} />
        <PortalFooter />
        <details className="tc-tweaks">
          <summary>Display</summary>
          <label>
            <input
              type="checkbox"
              checked={dense}
              onChange={(event) => setDense(event.target.checked)}
            />
            Compact business cards
          </label>
        </details>
      </div>
    </PortalContent.Provider>
  );
}
function PortalPage({ data }: { data: PortalData }) {
  const path = location.pathname.split("/").filter(Boolean);
  if (!path[0]) return <PortalHome data={data} />;
  if (
    ["companies", "associations", "community", "enterprises"].includes(path[0]) &&
    data.registration.error
  )
    return (
      <PendingDirectory
        retry={() => {
          data.registration.reload();
          data.companies.reload();
          data.associations.reload();
          data.posts.reload();
          data.products.reload();
        }}
      />
    );
  if (path[0] === "categories")
    return (
      <main>
        <CategoryDiscovery full />
      </main>
    );
  if (["join", "login", "contact", "privacy", "terms"].includes(path[0]))
    return <PortalInformation page={path[0]} corporateId={data.corporateId} />;
  if (path[0] === "standards")
    return (
      <main className="tc-standards-page">
        <section className="tc-container tc-page-intro">
          <span className="tc-eyebrow">SOURCING REFERENCE LIBRARY</span>
          <h1>
            Know what
            <br />
            <em>stands behind the label.</em>
          </h1>
          <p>
            Standards help you ask precise questions. Company credentials appear only after a staff
            review of current evidence.
          </p>
        </section>
        <TextileStandards />
      </main>
    );
  if (path[0] === "enterprises")
    return (
      <main>
        <section className="tc-container tc-page-intro">
          <span className="tc-eyebrow">COMPANY SPOTLIGHTS</span>
          <h1>
            Made with expertise.
            <br />
            <em>Presented with purpose.</em>
          </h1>
        </section>
        <FeedFeedback
          loading={data.companies.loading}
          error={data.companies.error}
          retry={data.companies.reload}
          label="Business spotlights"
        />
        <EnterpriseSpotlights companies={data.companies.data} />
      </main>
    );
  if (path[0] === "register")
    return (
      <>
        <FeedFeedback
          loading={data.registration.loading}
          error={data.registration.error}
          retry={data.registration.reload}
          label="Account registration"
        />
        {data.registration.error ? (
          <main className="tc-container tc-empty">
            <h1>New connections are coming soon.</h1>
            <p>
              We’re preparing the Tirupur Connect workspace. Please check back shortly to create
              your account.
            </p>
            <a href="/categories" className="tc-button">
              Explore textile categories
            </a>
          </main>
        ) : path[1] === "buyer" ? (
          <BuyerRegistration corporateId={data.corporateId} />
        ) : (
          <MemberRegistration
            associations={data.associations.data}
            corporateId={data.corporateId}
          />
        )}
      </>
    );
  if (path[0] === "companies" && !path[1])
    return (
      <main className="tc-container">
        <section className="tc-page-intro">
          <span className="tc-eyebrow">THE RIGHT CAPABILITY. THE RIGHT CONNECTION.</span>
          <h1>
            Find your next
            <br />
            <em>textile partner.</em>
          </h1>
          <p>
            Search published businesses or explore the product catalogue. Shape your shortlist
            around what you need to make.
          </p>
        </section>
        <PortalDirectory data={data} />
      </main>
    );
  if (path[0] === "companies") {
    const company = data.companies.data.find((item) => item.slug === path[1]);
    if (data.companies.loading || data.companies.error)
      return (
        <main className="tc-container tc-empty">
          <h1>Business profile</h1>
          <FeedFeedback
            loading={data.companies.loading}
            error={data.companies.error}
            retry={data.companies.reload}
            label="Business profile"
          />
        </main>
      );
    return company ? (
      <CompanyProfile
        company={company}
        association={data.associations.data.find((item) => item.uuid === company.associationUuid)}
        credentials={data.credentials.data.filter((item) => item.companyUuid === company.uuid)}
      />
    ) : (
      <NotFound />
    );
  }
  if (
    (path[0] === "associations" && data.associations.loading) ||
    (path[0] === "community" && data.posts.loading)
  )
    return (
      <main className="tc-container tc-empty">
        <h1>{path[0] === "community" ? "Community & knowledge" : "Associations"}</h1>
        <p role="status">Loading published profiles…</p>
      </main>
    );
  if (path[0] === "associations")
    return (
      <>
        <FeedFeedback
          loading={data.associations.loading}
          error={data.associations.error}
          retry={data.associations.reload}
          label="Associations"
        />
        <AssociationsPage
          associations={data.associations.data}
          companies={data.companies.data}
          slug={path[1]}
        />
      </>
    );
  if (path[0] === "community")
    return (
      <>
        <FeedFeedback
          loading={data.posts.loading}
          error={data.posts.error}
          retry={data.posts.reload}
          label="Community updates"
        />
        <CommunityPage
          posts={data.posts.data}
          associations={data.associations.data}
          postUuid={path[1]}
        />
      </>
    );
  return <NotFound />;
}
function NotFound() {
  return (
    <main className="tc-container tc-empty">
      <h1>Page not found</h1>
      <p>This profile or page is not currently published.</p>
      <a className="tc-button" href="/companies">
        Explore businesses
      </a>
    </main>
  );
}
