import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PageContent } from "@codexsun/sites-api/page-contract";
import { BrandLogo } from "../../shared/BrandLogo";

export function RamutexHeader({
  profile,
  path
}: {
  profile: PageContent["profile"];
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const links = [
    ["Portfolio", "/#portfolio"],
    ["About", "/about"],
    ["Services", "/services"],
    ["Journal", "/blogs"]
  ];
  return (
    <>
      <div className="rt-topline">
        <span>{profile.name}</span>
        <span>{profile.location}</span>
      </div>
      <header className="rt-header rt-wrap">
        <a className="rt-wordmark" href="/" aria-label={`${profile.name} home`}>
          <BrandLogo name={profile.name} />
        </a>
        <nav
          id="ramutex-navigation"
          className={`rt-nav${open ? " is-open" : ""}`}
          aria-label="Main navigation"
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            className="rt-nav-contact"
            href="/contact"
            aria-current={path === "/contact" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            Let’s talk fabric <ArrowUpRight size={16} />
          </a>
        </nav>
        <button
          className="rt-menu-button"
          ref={button}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="ramutex-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
    </>
  );
}
