import { motion } from "motion/react"
import { ArrowRightIcon } from "lucide-react"
import { Link } from "react-router-dom"

import type { StorefrontCategory } from "@/features/store/types/storefront"

export function CategoryMarquee({ categories }: { categories: StorefrontCategory[] }) {
  if (categories.length === 0) {
    return null
  }

  const items = [...categories, ...categories]

  return (
    <section className="overflow-hidden rounded-[2.2rem] border border-[#eadfce] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,242,234,0.9)_100%)] px-4 py-5 shadow-[0_24px_60px_-46px_rgba(45,29,19,0.24)] sm:px-5">
      <motion.div
        className="flex gap-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 34, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        {items.map((category, index) => (
          <Link
            key={`${category.id}-${index}`}
            to={`/category/${category.slug}`}
            className="group block w-[250px] shrink-0 overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/88 shadow-[0_18px_45px_-36px_rgba(45,29,19,0.24)] transition duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,#efe4d5,#f8f3ec)]">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground/60">
                  {category.name}
                </div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{category.name}</h3>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {category.description ?? `${category.name} catalog category.`}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{category.productCount} curated styles</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  Explore
                  <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  )
}
