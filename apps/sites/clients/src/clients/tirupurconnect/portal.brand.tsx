import { usePortalContent } from "./portal.content";
export function PortalBrand() {
  const { profile } = usePortalContent();
  return (
    <a className="tc-brand" href="/" aria-label={`${profile.brand} home`}>
      <svg width="48" height="54" viewBox="0 0 52 58" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M5 9 45 39M5 20 45 50M5 31 35 54M16 4 46 27" />
          <path d="M5 45 46 13M5 34 40 6M16 51 46 28" stroke="#f7f5ef" strokeWidth="10" />
          <path d="M5 45 46 13M5 34 40 6M16 51 46 28" />
        </g>
      </svg>
      <span>{profile.brand}</span>
    </a>
  );
}
export function PortalFooter() {
  const { profile, footer } = usePortalContent();
  return (
    <footer className="tc-footer">
      <div>
        <PortalBrand />
        <p>{footer.lineOne}</p>
      </div>
      <nav aria-label="Footer navigation">
        {[
          ["Businesses", "/companies"],
          ["Categories", "/categories"],
          ["Associations", "/associations"],
          ["Community", "/community"],
          ["Standards", "/standards"],
          ["Spotlights", "/enterprises"],
          ["Contact", "/contact"],
          ["Privacy", "/privacy"],
          ["Terms", "/terms"]
        ].map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
      <div className="tc-footer-contact">
        <a href={`https://${profile.domain}`}>{profile.domain}</a>
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
        <small>{footer.lineTwo}</small>
      </div>
    </footer>
  );
}
