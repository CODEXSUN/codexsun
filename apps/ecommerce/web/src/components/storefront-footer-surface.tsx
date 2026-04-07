import {
  Mail,
  MapPin,
  Phone,
} from "lucide-react"
import { Link } from "react-router-dom"

import type { CompanyBrandProfile } from "@cxapp/shared"
import type { StorefrontFooter } from "@ecommerce/shared"

import { getFooterSocialPlatformIcon } from "../lib/storefront-footer-socials"
import { normalizeStorefrontHref } from "../lib/storefront-routes"

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href)
}

function FooterHref({
  children,
  className,
  href,
}: {
  children: React.ReactNode
  className?: string
  href: string
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

  return (
    <Link to={normalizeStorefrontHref(href) ?? href} className={className}>
      {children}
    </Link>
  )
}

function buildLocation(brand: CompanyBrandProfile | null) {
  return [brand?.addressLine1, brand?.addressLine2].filter(Boolean).join(", ")
}

export function StorefrontFooterSurface({
  brand,
  footer,
  supportEmail,
  supportPhone,
  previewMode = false,
}: {
  brand: CompanyBrandProfile | null
  footer: StorefrontFooter
  supportEmail?: string | null
  supportPhone?: string | null
  previewMode?: boolean
}) {
  const descriptionParts = footer.description
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const location = buildLocation(brand)
  const visibleGroups = footer.groups.slice(0, 4)
  const design = footer.design

  return (
    <footer
      className={`w-full border-t pb-3 pt-12 ${previewMode ? "" : "lg:h-[400px] lg:overflow-hidden"}`}
      style={{
        backgroundColor: design.backgroundColor,
        borderColor: design.borderColor,
        color: design.bodyTextColor,
      }}
    >
      <div className="w-full px-5 lg:px-8 xl:px-10">
        <div
          className={`grid grid-cols-1 gap-12 sm:grid-cols-2 lg:gap-8 ${
            visibleGroups.length > 0 ? "lg:grid-cols-[1.55fr_repeat(4,minmax(0,1fr))]" : "lg:grid-cols-1"
          }`}
        >
          <div className="space-y-6 lg:pr-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/logo-dark.svg"
                alt={brand?.brandName ?? "Codexsun"}
                className="h-11 w-auto shrink-0 rounded-xl p-1.5"
                style={{ backgroundColor: design.logoBackgroundColor }}
              />
              <div className="space-y-1">
                <p
                  className="font-heading text-xl font-semibold uppercase tracking-[0.18em] sm:text-2xl"
                  style={{ color: design.titleColor }}
                >
                  {brand?.brandName ?? "Codexsun"}
                </p>
                {brand?.tagline ? (
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.18em]"
                    style={{ color: design.mutedTextColor }}
                  >
                    {brand.tagline}
                  </p>
                ) : null}
              </div>
            </Link>

            <div className="space-y-3 text-sm leading-7" style={{ color: design.bodyTextColor }}>
              {descriptionParts.length > 0
                ? descriptionParts.map((part, index) => <p key={`${index}:${part}`}>{part}</p>)
                : <p>{footer.description}</p>}
            </div>

            <div className="space-y-3 pt-2 text-sm" style={{ color: design.bodyTextColor }}>
              {location ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                  <span>{location}</span>
                </div>
              ) : null}
              {supportPhone || brand?.primaryPhone ? (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                  <a
                    href={`tel:${String(supportPhone ?? brand?.primaryPhone ?? "").replace(/\D/g, "")}`}
                    className="transition-colors"
                    style={{ color: design.bodyTextColor }}
                  >
                    {supportPhone ?? brand?.primaryPhone}
                  </a>
                </div>
              ) : null}
              {supportEmail || brand?.primaryEmail ? (
                <div className="flex items-center gap-3">
                  <Mail className="size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                  <a
                    href={`mailto:${supportEmail ?? brand?.primaryEmail ?? ""}`}
                    className="transition-colors"
                    style={{ color: design.bodyTextColor }}
                  >
                    {supportEmail ?? brand?.primaryEmail}
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {visibleGroups.map((group) => (
            <div key={group.id} className="space-y-5">
              <h3
                className="text-sm font-bold uppercase tracking-[0.18em]"
                style={{ color: design.titleColor }}
              >
                {group.title}
              </h3>
              <ul className="grid gap-3 text-sm" style={{ color: design.bodyTextColor }}>
                {group.links.map((item) => (
                  <li key={`${group.id}:${item.label}:${item.href}`}>
                    <FooterHref
                      href={item.href}
                      className="inline-block transition-transform hover:-translate-y-0.5"
                      
                    >
                      {item.label}
                    </FooterHref>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t" style={{ borderColor: design.borderColor }}>
        <div className="flex w-full flex-col items-center justify-between gap-4 px-5 py-4 lg:flex-row lg:px-8 xl:px-10">
          <div className="flex items-center gap-4">
            {footer.socialLinks.map((item) => {
              const Icon = getFooterSocialPlatformIcon(item.platform)

              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-10 items-center justify-center rounded-full border transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{
                    backgroundColor: design.socialButtonBackgroundColor,
                    borderColor: design.socialButtonBorderColor,
                    color: design.socialButtonIconColor,
                  }}
                >
                  <Icon className="size-5" />
                  <span className="sr-only">{item.label}</span>
                </a>
              )
            })}
          </div>

          <div className="text-center text-sm lg:text-right" style={{ color: design.mutedTextColor }}>
            {footer.legalLine}
          </div>
        </div>
      </div>
    </footer>
  )
}
