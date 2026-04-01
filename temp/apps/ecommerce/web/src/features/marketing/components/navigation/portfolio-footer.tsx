import { Link } from "react-router-dom"

import { BrandMark } from "@/shared/branding/brand-mark"
import { useBranding } from "@/shared/branding/branding-provider"

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Templates", href: "/templates" },
  { label: "Team", href: "/team" },
  { label: "Bio", href: "/bio" },
  { label: "Enquiry", href: "/enquiry" },
  { label: "Contact", href: "/contact" },
]

export function PortfolioFooter() {
  const branding = useBranding()

  return (
    <footer className="border-t border-border/70 bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <BrandMark />
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {branding.summary}
          </p>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Codexsun delivers portfolio websites, landing pages, ecommerce, CRM, HRMS, accounts, and integration-ready business software from one shared platform.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Site Links</h3>
            <div className="grid gap-3 text-sm">
              {quickLinks.map((link) => (
                <Link key={link.href} to={link.href} className="transition-colors hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Codexsun Contact</h3>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p>{branding.email}</p>
              <p>{branding.phone}</p>
              <p>{branding.location}</p>
              <p>{branding.tagline}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

