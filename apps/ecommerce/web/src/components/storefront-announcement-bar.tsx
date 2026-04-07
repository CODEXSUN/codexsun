import { useEffect, useEffectEvent, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ShieldCheck, Sparkles, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { normalizeStorefrontHref } from "../lib/storefront-routes"

type StorefrontAnnouncementBarProps = {
  landing: StorefrontLandingResponse | null
}

type AnnouncementItem = {
  id: string
  text: string
  fullText: string
  href?: string
}

function clampAnnouncementText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`
}

export function StorefrontAnnouncementBar({
  landing,
}: StorefrontAnnouncementBarProps) {
  const settings = landing?.settings
  const visibility = settings?.visibility
  const items = useMemo<AnnouncementItem[]>(() => {
    if (!visibility?.announcement) {
      return []
    }

    return (settings?.announcementItems ?? [])
      .filter((item) => item.text.trim().length > 0)
      .map((item) => ({
        id: item.id,
        text: clampAnnouncementText(item.text.trim(), 78),
        fullText: item.text.trim(),
        href: item.href?.trim() || undefined,
      }))
  }, [settings, visibility?.announcement])

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
  const design = settings?.announcementDesign
  const Icon =
    design?.iconKey === "truck"
      ? Truck
      : design?.iconKey === "shield"
        ? ShieldCheck
        : Sparkles
  const roundedClass =
    design?.cornerStyle === "rounded"
      ? "rounded-[1.4rem]"
      : design?.cornerStyle === "soft"
        ? "rounded-[1rem]"
        : "rounded-[999px]"

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
        className="flex w-full min-w-0 items-center gap-2.5"
        title={activeItem.fullText}
      >
        <Icon
          className="size-4 shrink-0"
          style={{ color: design?.iconColor ?? "#f6c453" }}
        />
        <span className="min-w-0 flex-1 truncate">{activeItem.text}</span>
      </motion.span>
    </AnimatePresence>
  )

  return (
    <section
      className={`${roundedClass} w-full overflow-hidden border px-4 py-3 text-[13px] shadow-lg sm:px-5 sm:text-sm`}
      style={{
        borderColor: "rgba(214, 200, 182, 0.8)",
        backgroundColor: design?.backgroundColor ?? "#221812",
        color: design?.textColor ?? "#f5efe8",
      }}
    >
      {activeItem.href ? (
        <Link
          to={normalizeStorefrontHref(activeItem.href) ?? activeItem.href}
          className="flex w-full min-w-0 items-center overflow-hidden whitespace-nowrap"
          title={activeItem.fullText}
        >
          {content}
        </Link>
      ) : (
        <div className="flex w-full min-w-0 items-center overflow-hidden whitespace-nowrap">
          {content}
        </div>
      )}
    </section>
  )
}
