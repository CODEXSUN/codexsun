import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { PortalBrand } from "./portal.brand";
export function PortalHeader() {
  const [open, setOpen] = useState(false);
  const path = location.pathname;
  return (
    <header className="tc-nav">
      <PortalBrand />
      <button
        className="tc-mobile-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="tc-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="tc-navigation"
        className={`tc-nav-links ${open ? "tc-open" : ""}`}
        aria-label="Main navigation"
      >
        {[
          ["Businesses", "/companies"],
          ["Categories", "/categories"],
          ["Associations", "/associations"],
          ["Community", "/community"],
          ["Login", "/login"]
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            aria-current={path.startsWith(href ?? "-") ? "page" : undefined}
          >
            {label}
          </a>
        ))}
        <a className="tc-login-mobile" href="/register/buyer">
          For buyers
        </a>
      </nav>
      <a className="tc-nav-cta" href="/join">
        Join Tirupur Connect <ArrowUpRight size={17} />
      </a>
    </header>
  );
}
