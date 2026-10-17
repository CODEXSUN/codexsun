import { buyerLoginUrl } from "@codexsun/tconnect-web/public";
import { memberLoginUrl } from "@codexsun/tconnect-web/public";
import { usePortalContent, useTextileContent } from "./portal.content";
export function PortalInformation({ page, corporateId }: { page: string; corporateId: string }) {
  const { profile } = usePortalContent();
  const doc = useTextileContent().documents.find((doc) => doc.path === page);
  const title =
    (doc?.title ?? page === "contact")
      ? "Let’s make a connection."
      : page === "login" || page === "join"
        ? "Your next chapter starts here."
        : page === "privacy"
          ? "Privacy, with clarity."
          : "A shared understanding.";
  return (
    <main className="tc-container tc-information">
      <span className="tc-eyebrow">TIRUPUR CONNECT · {page}</span>
      <h1>{title}</h1>
      {doc ? (
        <div className="tc-managed-copy">
          <p>{doc.intro}</p>
          {doc.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {page === "login" || page === "join" ? (
        <>
          <p>
            Choose the account that fits your work. Buyers source products and compare offers.
            Businesses manage profiles, products and enquiries.
          </p>
          <div className="tc-account-choices">
            <article>
              <h2>For buyers</h2>
              <p>Post requirements, send enquiries, compare quotations and talk to sellers.</p>
              <a
                className="tc-button"
                href={page === "join" ? "/register/buyer" : buyerLoginUrl(corporateId)}
              >
                {page === "join" ? "Create buyer account" : "Buyer login"}
              </a>
              <a className="tc-text-link" href="/register/buyer">
                Create a buyer account →
              </a>
            </article>
            <article>
              <h2>For businesses</h2>
              <p>Manage your company branding, products, enquiries and private quotations.</p>
              <a
                className="tc-button"
                href={page === "join" ? "/register" : memberLoginUrl(corporateId)}
              >
                {page === "join" ? "List your business" : "Seller / member login"}
              </a>
              <a className="tc-text-link" href="/register">
                Register your business →
              </a>
            </article>
          </div>
        </>
      ) : page === "contact" ? (
        <>
          <p>
            For platform questions, profile corrections and association enquiries, reach the Tirupur
            Connect team.
          </p>
          <div className="tc-contact-links">
            {profile.emails.map((email) => (
              <a key={email} href={`mailto:${email}`}>
                {email}
              </a>
            ))}
            {profile.phones.map((phone) => (
              <a key={phone.href} href={`tel:${phone.href}`}>
                {phone.label}
              </a>
            ))}
            <a href={`https://${profile.domain}`}>{profile.domain}</a>
          </div>
          <p>
            Looking for a supplier? Use the enquiry form on their business profile. Registered
            buyers can track replies and quotations in their buyer account.
          </p>
          <a className="tc-button" href="/companies">
            Find businesses →
          </a>
        </>
      ) : page === "privacy" ? (
        <>
          <p>
            Public profiles and private account information serve different purposes. This notice
            describes the current platform features. Production operator details and retention
            periods must be finalized before public launch.
          </p>
          <h2>What you share</h2>
          <p>
            Registration collects account and business information, consent and credentials.
            Platform manages password hashing and signed sessions. Published company profiles and
            active products are visible to visitors. Private enquiries, requirements, quotations and
            messages are available through account permissions.
          </p>
          <h2>Who can see conversations</h2>
          <p>
            Buyer and seller conversations are restricted to their participants. Enquiry contact
            information is accessible to its sender, recipient and authorized staff. Association
            affiliation requires approval. Registering an account does not claim previous anonymous
            enquiries by email.
          </p>
          <h2>Contact and corrections</h2>
          <p>
            Manage published information from your account. Contact{" "}
            {profile.emails[0] ?? profile.brand} for access, correction or deletion requests.
            Retained records may require staff review. Automatic deletion and marketing email
            delivery are not configured.
          </p>
          <h2>Session cookies</h2>
          <p>
            Authentication uses Platform session cookies. The public portal does not store passwords
            or authentication tokens in browser storage. External links have their own privacy
            terms.
          </p>
        </>
      ) : (
        <>
          <p>
            These platform terms describe the current service. Operator identity, applicable
            jurisdiction and final legal terms require approval before production launch.
          </p>
          <h2>Accurate, authorized information</h2>
          <p>
            Publish only information and images you have permission to share. Do not impersonate
            businesses or claim unconfirmed certifications. Demonstration listings, organizations
            and events are examples, not endorsements or verified commercial offers.
          </p>
          <h2>Enquiries and quotations</h2>
          <p>
            The platform enables discovery and private communication. Buyers and sellers must
            independently confirm specifications, credentials, pricing, tax, delivery and commercial
            terms. Sending or comparing a quotation does not place an order. Payments and automatic
            order acceptance are not provided.
          </p>
          <h2>Responsible participation</h2>
          <p>
            Protect your account credentials. Do not send spam, unlawful content or confidential
            third-party information. Staff can suspend accounts under platform permissions. Contact
            {profile.emails[0] ?? profile.brand} to report inaccurate content or request review.
          </p>
        </>
      )}
    </main>
  );
}
