import { useMemo, useState } from "react"
import { LayoutList, X } from "lucide-react"

import type { StorefrontProductDetail } from "@ecommerce/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"

type StorefrontProductSpecificationsProps = {
  product: StorefrontProductDetail
}

function splitSpecificationGroups(groups: StorefrontProductDetail["specificationGroups"]) {
  return groups.filter((group) => group.items.length > 0)
}

export function StorefrontProductSpecifications({
  product,
}: StorefrontProductSpecificationsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const groups = useMemo(
    () => splitSpecificationGroups(product.specificationGroups),
    [product.specificationGroups]
  )

  if (groups.length === 0) {
    return null
  }

  return (
    <>
      <Card className="rounded-[1.75rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,242,0.92))] py-0 shadow-[0_18px_40px_-30px_rgba(48,31,19,0.16)]">
        <CardContent className="p-0">
          <Accordion
            type="single"
            collapsible
            defaultValue={groups[0]?.id}
            className="px-5 sm:px-6"
          >
            <div className="flex justify-end border-b border-[#ede1d6] py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-[#d9c7b8] bg-white/92 text-[#2f241d] hover:border-[#cbb29d] hover:bg-white"
                onClick={() => setDrawerOpen(true)}
              >
                <LayoutList className="size-4" />
                See all specifications
              </Button>
            </div>
            {groups.map((group) => (
              <AccordionItem key={group.id} value={group.id} className="border-[#ede1d6]">
                <AccordionTrigger className="py-5 text-[#241913] hover:no-underline">
                  <div className="min-w-0 space-y-1 text-left">
                    <p className="truncate text-base font-semibold">{group.title}</p>
                    {group.summary ? (
                      <p className="truncate text-xs font-medium uppercase tracking-[0.16em] text-[#8a6e5b]">
                        {group.summary}
                      </p>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.2rem] border border-[#eadfd4] bg-white/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6e5b]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#241913]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="h-screen overflow-hidden border-l border-[#e2d4c5] bg-[#fffdfa] text-[#241913] data-[vaul-drawer-direction=right]:w-screen data-[vaul-drawer-direction=right]:max-w-none data-[vaul-drawer-direction=right]:rounded-none sm:data-[vaul-drawer-direction=right]:w-[560px]">
          <DrawerHeader className="border-b border-[#eadfd4] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DrawerTitle className="font-heading text-[1.35rem] tracking-tight text-[#241913]">
                  Product details
                </DrawerTitle>
                <DrawerDescription className="text-sm text-[#675242]">
                  {product.name}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-full border-[#d9c7b8] bg-white/92 text-[#2f241d] hover:border-[#cbb29d] hover:bg-white"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-[#eadfd4] bg-[#fffdfa] px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#d9c7b8] bg-white text-[#2f241d] hover:border-[#cbb29d] hover:bg-white"
                  >
                    <a href={`#spec-group-${group.id}`}>{group.title}</a>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-6 px-5 py-5">
                {groups.map((group) => (
                  <section
                    key={group.id}
                    id={`spec-group-${group.id}`}
                    className="space-y-3"
                  >
                    <h3 className="font-heading text-[1.05rem] tracking-tight text-[#241913]">
                      {group.title}
                    </h3>
                    <Separator className="bg-[#eadfd4]" />
                    <ul className="list-none divide-y divide-[#eadfd4] rounded-[1rem] border border-[#eadfd4] bg-white">
                      {group.items.map((item) => (
                        <li
                          key={item.id}
                          className="grid grid-cols-[132px_minmax(0,1fr)]"
                        >
                          <div className="border-r border-[#eadfd4] bg-[#faf2ea] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6e5b]">
                              {item.label}
                            </p>
                          </div>
                          <div className="px-3 py-3">
                            <p className="text-sm leading-6 text-[#241913]">{item.value}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
