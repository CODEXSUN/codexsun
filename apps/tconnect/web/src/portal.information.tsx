import { buyerLoginUrl } from "./modules/buyer/buyer.services";
import { memberLoginUrl } from "./modules/member/member.services";
export function PortalInformation({ page, corporateId }: { page: string; corporateId: string }) {
  const title =
    page === "contact"
      ? "Let’s make a connection."
      : page === "login"
        ? "Your next chapter starts here."
        : page === "privacy"
          ? "Privacy, with clarity."
          : "A shared understanding.";
  return (
    <main className="tc-container tc-information">
      <span className="tc-eyebrow">TIRUPUR CONNECT · {page}</span>
      <h1>{title}</h1>
      {page === "login" ? (
        <>
          <p>
            Choose the account you registered. Secure sign-in and password recovery are managed by
            the Platform.
          </p>
          <div className="tc-account-choices">
            <article>
              <h2>For buyers</h2>
              <p>Post requirements, send enquiries, compare quotations and talk to sellers.</p>
              <a className="tc-button" href={buyerLoginUrl(corporateId)}>
                Buyer login
              </a>
              <a className="tc-text-link" href="/register/buyer">
                Create a buyer account →
              </a>
            </article>
            <article>
              <h2>For businesses</h2>
              <p>Manage your company branding, products, enquiries and private quotations.</p>
              <a className="tc-button" href={memberLoginUrl(corporateId)}>
                Seller / member login
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
            <a href="mailto:info@tirupurconnect.com">info@tirupurconnect.com</a>
            <a href="tel:+919655227767">9655227767</a>
            <a href="https://tirupurconnect.com">tirupurconnect.com</a>
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
            Manage published information from your account. Contact info@tirupurconnect.com for
            access, correction or deletion requests. Retained records may require staff review.
            Automatic deletion and marketing email delivery are not configured.
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
            info@tirupurconnect.com to report inaccurate content or request review.
          </p>
        </>
      )}
    </main>
  );
}
