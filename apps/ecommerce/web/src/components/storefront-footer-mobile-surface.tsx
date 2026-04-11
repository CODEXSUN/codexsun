import { ChevronRight, Mail, MapPin, Phone } from "lucide-react"
import { Link } from "react-router-dom"

import type { CompanyBrandProfile } from "@cxapp/shared"
import type { StorefrontFooter } from "@ecommerce/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

export function StorefrontFooterMobileSurface({
  brand,
  footer,
  supportEmail,
  supportPhone,
}: {
  brand: CompanyBrandProfile | null
  footer: StorefrontFooter
  supportEmail?: string | null
  supportPhone?: string | null
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
      className="w-full border-t pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-8"
      data-technical-name="section.storefront.footer"
      style={{
        backgroundColor: design.backgroundColor,
        borderColor: design.borderColor,
        color: design.bodyTextColor,
      }}
    >
      <div className="space-y-6 px-4 sm:px-6">
        <div className="space-y-4 rounded-[1.6rem] border px-4 py-4" style={{ borderColor: design.borderColor }}>
          <Link to="/" className="inline-flex min-w-0 items-center gap-3">
            <img
              src="/logo-dark.svg"
              alt={brand?.brandName ?? "Codexsun"}
              className="h-10 w-auto shrink-0 rounded-xl p-1.5"
              style={{ backgroundColor: design.logoBackgroundColor }}
            />
            <div className="min-w-0 space-y-1">
              <p className="truncate font-heading text-[0.92rem] font-semibold uppercase tracking-[0.16em]" style={{ color: design.titleColor }}>
                {brand?.brandName ?? "Codexsun"}
              </p>
              {brand?.tagline ? (
                <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: design.mutedTextColor }}>
                  {brand.tagline}
                </p>
              ) : null}
            </div>
          </Link>

          <div className="space-y-2 text-[13px] leading-6">
            {(descriptionParts.length > 0 ? descriptionParts.slice(0, 2) : [footer.description]).map((part, index) => (
              <p key={`${index}:${part}`}>{part}</p>
            ))}
          </div>

          <div className="grid gap-2 text-[13px] leading-5">
            {location ? (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                <span className="line-clamp-2">{location}</span>
              </div>
            ) : null}
            {supportPhone || brand?.primaryPhone ? (
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                <a
                  href={`tel:${String(supportPhone ?? brand?.primaryPhone ?? "").replace(/\D/g, "")}`}
                  className="truncate"
                  style={{ color: design.bodyTextColor }}
                >
                  {supportPhone ?? brand?.primaryPhone}
                </a>
              </div>
            ) : null}
            {supportEmail || brand?.primaryEmail ? (
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                <a
                  href={`mailto:${supportEmail ?? brand?.primaryEmail ?? ""}`}
                  className="truncate"
                  style={{ color: design.bodyTextColor }}
                >
                  {supportEmail ?? brand?.primaryEmail}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {visibleGroups.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-3">
            {visibleGroups.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="overflow-hidden rounded-[1.45rem] border px-0"
                style={{ borderColor: design.borderColor, backgroundColor: `${design.logoBackgroundColor}14` }}
              >
                <AccordionTrigger
                  className="px-4 py-4 text-left text-[0.9rem] font-semibold uppercase tracking-[0.14em] no-underline hover:no-underline"
                  style={{ color: design.titleColor }}
                >
                  {group.title}
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="space-y-1 px-2">
                    {group.links.map((item) => (
                      <FooterHref
                        key={`${group.id}:${item.label}:${item.href}`}
                        href={item.href}
                        className="flex min-h-[2.75rem] items-center justify-between gap-3 rounded-[1rem] px-3 py-2.5 text-[15px] transition-colors hover:bg-white/60"
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        <ChevronRight className="size-4 shrink-0" style={{ color: design.mutedTextColor }} />
                      </FooterHref>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : null}
      </div>

      <div className="mt-6 border-t" style={{ borderColor: design.borderColor }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            {footer.socialLinks.map((item) => {
              const Icon = getFooterSocialPlatformIcon(item.platform)

              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: design.socialButtonBackgroundColor,
                    borderColor: design.socialButtonBorderColor,
                    color: design.socialButtonIconColor,
                  }}
                >
                  <Icon className="size-[1.125rem]" />
                  <span className="sr-only">{item.label}</span>
                </a>
              )
            })}
          </div>

          <div className="text-[12px] leading-5 sm:text-right" style={{ color: design.mutedTextColor }}>
            {footer.legalLine}
          </div>
        </div>
      </div>
    </footer>
  )
}
