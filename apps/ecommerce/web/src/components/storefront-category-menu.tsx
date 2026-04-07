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
        "group shrink-0 origin-bottom transform-gpu rounded-[1.55rem] transition-[transform,padding] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        compact ? "duration-[420ms]" : "duration-[620ms]",
        compact
          ? "w-20 px-1 py-1 hover:-translate-y-0.5 sm:w-24 lg:w-28"
          : "w-20 px-1 py-1.5 hover:-translate-y-1 sm:w-24 lg:w-28"
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center transition-[gap] ease-[cubic-bezier(0.22,1,0.36,1)]",
          compact ? "duration-[420ms]" : "duration-[620ms]",
          compact ? "gap-0.5" : "gap-3"
        )}
      >
        <div
          className={cn(
            "origin-bottom flex aspect-square items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f5ebe1_0%,#fbf7f1_100%)] ring-1 [transform:perspective(900px)_rotateX(0deg)_scaleY(1)_translateY(0)] transition-[max-height,opacity,border-radius,box-shadow,transform,margin,filter] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            compact ? "duration-[440ms]" : "duration-[680ms]",
            compact
              ? "pointer-events-none -mb-1 m-0 max-h-0 w-full rounded-[0.9rem] opacity-0 shadow-none delay-[70ms] [filter:blur(0.6px)] [transform:perspective(900px)_rotateX(72deg)_scaleY(0.36)_translateY(0.55rem)]"
              : "w-full rounded-[1.4rem] shadow-[0_16px_40px_-28px_rgba(60,35,20,0.28)]",
            isActive
              ? "ring-[#8b5e34] shadow-[0_20px_44px_-26px_rgba(91,56,31,0.34)]"
              : "ring-[#eadbca]"
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className={cn(
                "h-full w-full origin-bottom object-cover transition-[transform,filter] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105",
                compact ? "duration-[440ms]" : "duration-[680ms]",
                compact
                  ? "translate-y-1 scale-[1.04] [filter:saturate(0.92)]"
                  : "[filter:saturate(1)]"
              )}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className={cn(
                "font-semibold uppercase tracking-[0.16em] text-[#6d5140] transition-[font-size,transform,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]",
                compact ? "duration-[420ms]" : "duration-[620ms]",
                compact ? "text-[10px]" : "text-xs"
              )}
            >
              {label.slice(0, 2)}
            </div>
          )}
        </div>
        <span
          className={cn(
            "line-clamp-2 text-center font-medium leading-tight transition-[transform,color,font-size,letter-spacing] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#241913]",
            compact ? "duration-[440ms]" : "duration-[680ms]",
            compact
              ? isActive
                ? "-translate-y-0.5 scale-100 text-[13px] font-semibold tracking-[0.01em] text-[#241913] sm:text-[13.5px]"
                : "-translate-y-0.5 text-[13px] tracking-[0.01em] text-[#5a4639] group-hover:scale-[1.02] sm:text-[13.5px]"
              : isActive
                ? "text-[11px] text-[#241913] sm:text-xs"
                : "text-[11px] text-[#4e3b2e] sm:text-xs"
          )}
        >
          {label}
        </span>
      </div>
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
        "border-b border-[#eadbca] transform-gpu transition-[background-color,box-shadow,padding] ease-[cubic-bezier(0.22,1,0.36,1)]",
        isScrolled ? "duration-[420ms]" : "duration-[620ms]",
        isScrolled
          ? "bg-[#fcf8f3]/88 backdrop-blur-xl shadow-[0_16px_36px_-28px_rgba(43,26,12,0.36)]"
          : "bg-[#fcf8f3]/94",
        className
      )}
    >
      <div className="group relative mx-auto w-full max-w-[96rem] px-3 sm:px-4 lg:px-6 2xl:px-8">
        <div
          ref={scrollRef}
          className={cn(
            "w-full overflow-x-auto px-3 transition-[padding] ease-[cubic-bezier(0.22,1,0.36,1)] [scrollbar-color:#c9b7a5_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccb9a6] [&::-webkit-scrollbar-track]:bg-transparent lg:px-4",
            isScrolled ? "duration-[420ms]" : "duration-[620ms]",
            isScrolled ? "py-2.5" : "py-4"
          )}
        >
          <div
            className={cn(
              "mx-auto flex min-w-max items-end transition-[gap] ease-[cubic-bezier(0.22,1,0.36,1)]",
              isScrolled ? "duration-[420ms]" : "duration-[620ms]",
              isScrolled
                ? "justify-center gap-5 px-6 sm:gap-6 lg:gap-8"
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
