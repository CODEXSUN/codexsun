export function PortalBrand() {
  return (
    <a className="tc-brand" href="/" aria-label="Tirupur Connect home">
      <svg width="48" height="54" viewBox="0 0 52 58" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M5 9 45 39M5 20 45 50M5 31 35 54M16 4 46 27" />
          <path d="M5 45 46 13M5 34 40 6M16 51 46 28" stroke="#f7f5ef" strokeWidth="10" />
          <path d="M5 45 46 13M5 34 40 6M16 51 46 28" />
        </g>
      </svg>
      <span>
        Tirupur
        <br />
        Connect<small>TEXTILE BUSINESS NETWORK</small>
      </span>
    </a>
  );
}
export function PortalFooter() {
  return (
    <footer className="tc-footer">
      <div>
        <PortalBrand />
        <p>Made in Tirupur. Worn Everywhere.</p>
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
        <a href="https://tirupurconnect.com">tirupurconnect.com</a>
        <a href="mailto:info@tirupurconnect.com">info@tirupurconnect.com</a>
        <a href="tel:+919655227767">9655227767</a>
        <small>
          Demonstration listings are fictional. Information is supplied by profile owners; no
          verification is implied unless current reviewed credential details are published.
        </small>
      </div>
    </footer>
  );
}
