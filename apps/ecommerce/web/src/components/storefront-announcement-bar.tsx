import { useEffect, useEffectEvent, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { normalizeStorefrontHref, storefrontPaths } from "../lib/storefront-routes"

type StorefrontAnnouncementBarProps = {
  landing: StorefrontLandingResponse | null
  cartSubtotalAmount: number
}

type AnnouncementItem = {
  id: string
  text: string
  href?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function StorefrontAnnouncementBar({
  landing,
  cartSubtotalAmount,
}: StorefrontAnnouncementBarProps) {
  const items = useMemo<AnnouncementItem[]>(() => {
    const settings = landing?.settings
    const threshold = Math.max(settings?.freeShippingThreshold ?? 3999, 0)
    const remainingAmount = Math.max(threshold - cartSubtotalAmount, 0)
    const supportParts = [settings?.supportEmail?.trim(), settings?.supportPhone?.trim()].filter(
      (value): value is string => Boolean(value)
    )

    return [
      {
        id: "announcement",
        text:
          settings?.announcement?.trim() || "Storefront announcement will appear here.",
        href: storefrontPaths.catalog(),
      },
      {
        id: "shipping",
        text:
          remainingAmount > 0
            ? `Add ${formatCurrency(remainingAmount)} more to unlock free shipping on prepaid orders above ${formatCurrency(threshold)}.`
            : "Free shipping unlocked for your current cart.",
        href: remainingAmount > 0 ? storefrontPaths.catalog() : storefrontPaths.cart(),
      },
      {
        id: "support",
        text:
          supportParts.length > 0
            ? `Need help? Reach support at ${supportParts.join(" or ")}.`
            : "Need help? Track your order and reach the storefront support team.",
        href: storefrontPaths.trackOrder(),
      },
    ]
  }, [cartSubtotalAmount, landing])

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, items.length - 1))
  }, [items.length])

  const rotateToNext = useEffectEvent(() => {
    if (items.length <= 1) {
      return
    }

    setActiveIndex((current) => (current + 1) % items.length)
  })

  useEffect(() => {
    if (items.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      rotateToNext()
    }, 4500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [items.length, rotateToNext])

  const activeItem = items[activeIndex] ?? items[0]

  if (!activeItem) {
    return null
  }

  const content = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={activeItem.id}
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-w-0 items-center gap-3"
      >
        <Sparkles className="size-4 shrink-0 text-amber-300" />
        <span className="truncate">{activeItem.text}</span>
      </motion.span>
    </AnimatePresence>
  )

  return (
    <section className="rounded-[999px] border border-[#d6c8b6] bg-[#221812] px-5 py-3 text-sm text-stone-100 shadow-lg">
      {activeItem.href ? (
        <Link
          to={normalizeStorefrontHref(activeItem.href) ?? activeItem.href}
          className="flex items-center overflow-hidden whitespace-nowrap"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-center overflow-hidden whitespace-nowrap">
          {content}
        </div>
      )}
    </section>
  )
}
