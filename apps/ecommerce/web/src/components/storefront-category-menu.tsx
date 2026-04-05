import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"

import type { StorefrontCategorySummary } from "@ecommerce/shared"
import { cn } from "@/lib/utils"

import { normalizeStorefrontHref, storefrontPaths } from "../lib/storefront-routes"

function CategoryPill({
  compact = false,
  href,
  imageUrl,
  isActive = false,
  label,
}: {
  compact?: boolean
  href: string
  imageUrl: string | null
  isActive?: boolean
  label: string
}) {
  return (
    <Link
      to={href}
      className={cn(
        "group shrink-0 transition-all duration-500",
        compact
          ? "flex items-center justify-center rounded-full px-3 py-2 hover:bg-[#eadfce]/96"
          : "flex w-20 flex-col items-center gap-3 hover:-translate-y-1 sm:w-24 lg:w-28"
      )}
    >
      {!compact ? (
        <div
          className={cn(
            "flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.4rem] bg-[linear-gradient(180deg,#f5ebe1_0%,#fbf7f1_100%)] shadow-[0_16px_40px_-28px_rgba(60,35,20,0.28)] ring-1 transition-all duration-300",
            isActive
              ? "ring-[#8b5e34] shadow-[0_20px_44px_-26px_rgba(91,56,31,0.34)]"
              : "ring-[#eadbca]"
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d5140]">
              {label.slice(0, 2)}
            </div>
          )}
        </div>
      ) : null}
      <span
        className={cn(
          "text-center font-medium leading-tight transition-all duration-500 ease-out group-hover:text-[#241913]",
          compact
            ? isActive
              ? "origin-center -rotate-[2deg] scale-[1.08] text-base font-semibold text-[#241913]"
              : "origin-center rotate-0 scale-100 text-base text-[#5a4639] group-hover:-rotate-[1deg] group-hover:scale-[1.04] group-hover:font-semibold"
            : isActive
              ? "text-[11px] text-[#241913] sm:text-xs"
              : "text-[11px] text-[#4e3b2e] sm:text-xs"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

export function StorefrontCategoryMenu({
  categories,
  className,
  isScrolled = false,
}: {
  categories: StorefrontCategorySummary[]
  className?: string
  isScrolled?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [showLeftChevron, setShowLeftChevron] = useState(false)
  const [showRightChevron, setShowRightChevron] = useState(false)
  const topMenuCategories = categories
    .filter((item) => item.showInTopMenu)
    .sort(
      (left, right) =>
        left.positionOrder - right.positionOrder || left.name.localeCompare(right.name)
    )
  const activeCategory = searchParams.get("category")?.trim().toLowerCase() ?? ""
  const isCatalogRoute = location.pathname === storefrontPaths.catalog()

  useEffect(() => {
    const container = scrollRef.current

    if (!container) {
      return
    }

    const updateChevron = () => {
      setShowLeftChevron(container.scrollLeft > 16)
      const remaining =
        container.scrollWidth - container.clientWidth - container.scrollLeft
      setShowRightChevron(remaining > 16)
    }

    updateChevron()
    container.addEventListener("scroll", updateChevron, { passive: true })
    window.addEventListener("resize", updateChevron)

    return () => {
      container.removeEventListener("scroll", updateChevron)
      window.removeEventListener("resize", updateChevron)
    }
  }, [topMenuCategories.length, isScrolled])

  function scrollRight() {
    scrollRef.current?.scrollBy({
      left: isScrolled ? 220 : 320,
      behavior: "smooth",
    })
  }

  function scrollLeft() {
    scrollRef.current?.scrollBy({
      left: isScrolled ? -220 : -320,
      behavior: "smooth",
    })
  }

  return (
    <div
      className={cn(
        "border-b border-[#eadbca] transition-all duration-300",
        isScrolled
          ? "bg-[#fcf8f3]/88 backdrop-blur-xl shadow-[0_16px_36px_-28px_rgba(43,26,12,0.36)]"
          : "bg-[#fcf8f3]/94",
        className
      )}
    >
      <div className="group relative mx-auto w-full max-w-[75%]">
        <div
          ref={scrollRef}
          className={cn(
            "w-full overflow-x-auto px-3 transition-all duration-300 [scrollbar-color:#c9b7a5_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccb9a6] [&::-webkit-scrollbar-track]:bg-transparent lg:px-4",
            isScrolled ? "py-2.5" : "py-4"
          )}
        >
          <div
            className={cn(
              "mx-auto flex min-w-max items-center",
              isScrolled
                ? "justify-center gap-4 px-6 sm:gap-5 lg:gap-6"
                : "justify-center gap-5 px-6 sm:gap-6 lg:gap-8"
            )}
          >
            {topMenuCategories.map((category) => (
              <CategoryPill
                key={category.id}
                compact={isScrolled}
                href={normalizeStorefrontHref(category.href) ?? storefrontPaths.catalog()}
                imageUrl={category.imageUrl}
                isActive={isCatalogRoute && activeCategory === category.name.trim().toLowerCase()}
                label={category.name}
              />
            ))}
          </div>
        </div>
        {showLeftChevron ? (
          <button
            type="button"
            aria-label="Scroll categories left"
            className={cn(
              "absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100",
              isScrolled ? "ml-1" : "ml-2"
            )}
            onClick={scrollLeft}
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}
        {showRightChevron ? (
          <button
            type="button"
            aria-label="Scroll categories right"
            className={cn(
              "absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-[#dfc9b3] bg-[#fcf8f3]/92 p-2 text-[#705440] shadow-[0_14px_28px_-18px_rgba(43,26,12,0.38)] opacity-0 transition-all duration-300 hover:border-[#8b5e34] hover:bg-[#8b5e34] hover:text-white group-hover:opacity-100",
              isScrolled ? "mr-1" : "mr-2"
            )}
            onClick={scrollRight}
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
