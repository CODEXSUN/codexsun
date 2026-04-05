import { Link } from "react-router-dom"

import type { StorefrontCategorySummary } from "@ecommerce/shared"
import { cn } from "@/lib/utils"

import { normalizeStorefrontHref, storefrontPaths } from "../lib/storefront-routes"

function CategoryPill({
  href,
  imageUrl,
  label,
}: {
  href: string
  imageUrl: string | null
  label: string
}) {
  return (
    <Link
      to={href}
      className="group flex w-20 shrink-0 flex-col items-center gap-3 transition-transform duration-300 hover:-translate-y-1 sm:w-24 lg:w-28"
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.4rem] bg-[linear-gradient(180deg,#f5ebe1_0%,#fbf7f1_100%)] shadow-[0_16px_40px_-28px_rgba(60,35,20,0.28)] ring-1 ring-[#eadbca]">
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
      <span className="text-center text-[11px] font-medium leading-tight text-[#4e3b2e] transition-colors group-hover:text-[#241913] sm:text-xs">
        {label}
      </span>
    </Link>
  )
}

export function StorefrontCategoryRail({
  categories,
  className,
}: {
  categories: StorefrontCategorySummary[]
  className?: string
}) {
  const topMenuCategories = categories
    .filter((item) => item.showInTopMenu)
    .sort(
      (left, right) =>
        left.positionOrder - right.positionOrder || left.name.localeCompare(right.name)
    )

  if (topMenuCategories.length === 0) {
    return null
  }

  return (
    <div className={cn("border-b border-[#eadbca] bg-[#fcf8f3]/94", className)}>
      <div className="mx-auto w-full max-w-7xl overflow-x-auto px-5 py-4 lg:px-8">
        <div className="flex min-w-max items-start gap-4 lg:gap-6">
          <CategoryPill href={storefrontPaths.catalog()} imageUrl={null} label="All Products" />
          {topMenuCategories.map((category) => (
            <CategoryPill
              key={category.id}
              href={normalizeStorefrontHref(category.href) ?? storefrontPaths.catalog()}
              imageUrl={category.imageUrl}
              label={category.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
