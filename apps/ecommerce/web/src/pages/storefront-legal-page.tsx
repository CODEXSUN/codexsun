import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontLegalPage as StorefrontLegalPageItem } from "@ecommerce/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { storefrontApi } from "../api/storefront-api"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

type StorefrontLegalPageProps = {
  pageId: StorefrontLegalPageItem["id"]
}

const pageButtonOrder: Array<{
  id: StorefrontLegalPageItem["id"]
  label: string
}> = [
  { id: "shipping", label: "Shipping" },
  { id: "returns", label: "Returns" },
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "contact", label: "Contact" },
]

export function StorefrontLegalPage({ pageId }: StorefrontLegalPageProps) {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.storefrontLegalPage(pageId),
    queryFn: () => storefrontApi.getLegalPage(pageId),
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  })

  const page = data?.item
  const settings = data?.settings
  const supportPhone = settings?.supportPhone?.trim() ?? ""
  const supportEmail = settings?.supportEmail?.trim() ?? ""
  const pickup = settings?.pickupLocation
  const pickupAddress = pickup
    ? [pickup.line1, pickup.line2, pickup.city, pickup.state, pickup.country, pickup.pincode]
        .filter((value) => value && value.trim().length > 0)
        .join(", ")
    : ""

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="grid w-full max-w-none gap-6 px-5 pt-8 lg:px-10 xl:px-16 2xl:px-20">
        <section className="space-y-4">
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link to={storefrontPaths.catalog()}>
              <ArrowLeft className="size-4" />
              Back to catalog
            </Link>
          </Button>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {page?.eyebrow ?? "Storefront trust"}
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-[#221712] sm:text-[2.85rem]">
              {page?.title ?? "Loading page..."}
            </h1>
            <p className="max-w-3xl text-[15px] leading-7 text-[#6d5645]">
              {page?.summary ?? "Loading policy content."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pageButtonOrder.map((item) => (
              <Button
                key={item.id}
                asChild
                variant={item.id === pageId ? "default" : "outline"}
                className={
                  item.id === pageId
                    ? "rounded-full bg-[#221812] text-white hover:bg-[#31231b]"
                    : "rounded-full border-[#e5d8ca] bg-white/90 text-[#2d211b] hover:border-[#d4c2b0] hover:bg-white"
                }
              >
                <Link to={storefrontPaths.legalPage(item.id)}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </section>

        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load page."}
            </CardContent>
          </Card>
        ) : null}

        {isLoading && !page ? (
          <Card className="rounded-[2rem] border-[#e8dbce] py-0 shadow-sm">
            <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
              <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
              <div className="h-20 animate-pulse rounded-[1.5rem] bg-muted" />
              <div className="h-20 animate-pulse rounded-[1.5rem] bg-muted" />
            </CardContent>
          </Card>
        ) : null}

        {page ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="space-y-4">
              {page.supportLabel ? (
                <Card className="rounded-[1.8rem] border-[#e7d8ca] bg-[linear-gradient(180deg,#fffdf9,#fbf6f0)] py-0 shadow-sm">
                  <CardContent className="p-5 text-sm leading-7 text-[#5d493c]">
                    {page.supportLabel}
                  </CardContent>
                </Card>
              ) : null}

              <Accordion
                type="multiple"
                defaultValue={page.sections.map((section) => section.id)}
                className="rounded-[2rem] border border-[#eadfd3] bg-white/95 px-5 py-2 shadow-[0_24px_60px_-48px_rgba(48,31,19,0.18)]"
              >
                {page.sections.map((section) => (
                  <AccordionItem key={section.id} value={section.id} className="border-[#efe4d9]">
                    <AccordionTrigger className="gap-4 py-5 text-left no-underline hover:no-underline">
                      <div className="space-y-1 text-left">
                        <div className="text-base font-semibold text-[#251a14]">{section.title}</div>
                        {section.summary ? (
                          <div className="text-sm font-normal leading-6 text-[#816857]">
                            {section.summary}
                          </div>
                        ) : null}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-5 text-[15px] leading-7 text-[#5f4b3f]">
                      {section.body.map((paragraph, index) => (
                        <p key={`${section.id}:${index}`}>{paragraph}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {page.faqs.length > 0 ? (
                <Card className="rounded-[2rem] border-[#e7d8ca] bg-white/95 py-0 shadow-sm">
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-1">
                      <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#221712]">
                        Frequently asked questions
                      </h2>
                      <p className="text-sm text-[#826a5a]">
                        Common clarifications for this storefront policy.
                      </p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {page.faqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border-[#efe4d9]">
                          <AccordionTrigger className="py-4 text-left text-[15px] font-semibold text-[#251a14] no-underline hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 text-[15px] leading-7 text-[#5f4b3f]">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-4 xl:sticky xl:top-28">
              <Card className="rounded-[1.8rem] border-[#e7d8ca] bg-[linear-gradient(180deg,#fffdf9,#fbf6f0)] py-0 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[#251a14]">Support desk</h2>
                    <p className="text-sm leading-6 text-[#7a6251]">
                      Reach the storefront team for dispatch, returns, policy, or account help.
                    </p>
                  </div>
                  <ul className="space-y-3 text-sm text-[#5f4b3f]">
                    {supportPhone ? (
                      <li className="flex items-start gap-3">
                        <Phone className="mt-0.5 size-4 text-[#8a6e5b]" />
                        <span>{supportPhone}</span>
                      </li>
                    ) : null}
                    {supportEmail ? (
                      <li className="flex items-start gap-3">
                        <Mail className="mt-0.5 size-4 text-[#8a6e5b]" />
                        <span>{supportEmail}</span>
                      </li>
                    ) : null}
                    {pickup?.enabled && pickupAddress ? (
                      <li className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-4 text-[#8a6e5b]" />
                        <span>{pickupAddress}</span>
                      </li>
                    ) : null}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="rounded-full bg-[#221812] text-white hover:bg-[#31231b]">
                      <Link to={storefrontPaths.trackOrder()}>Track order</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full border-[#decebf] bg-white/90 text-[#241913] hover:border-[#cdb9a6] hover:bg-white">
                      <Link to={storefrontPaths.contact()}>Contact support</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </StorefrontLayout>
  )
}
