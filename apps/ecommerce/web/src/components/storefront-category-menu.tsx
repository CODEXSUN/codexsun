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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const topMenuCategories = categories
    .filter((item) => item.showInTopMenu)
    .sort(
      (left, right) =>
        left.positionOrder - right.positionOrder || left.name.localeCompare(right.name)
    )
  const activeCategory = searchParams.get("category")?.trim().toLowerCase() ?? ""
  const isCatalogRoute = location.pathname === storefrontPaths.catalog()

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
      <div
        className={cn(
          "w-full overflow-x-auto px-5 transition-all duration-300 lg:px-8 xl:px-10",
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
    </div>
  )
}
