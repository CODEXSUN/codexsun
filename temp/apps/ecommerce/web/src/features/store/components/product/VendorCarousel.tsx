import { Link } from "react-router-dom"

import type { StorefrontBrand } from "@/features/store/types/storefront"

export function VendorCarousel({ vendors }: { vendors: StorefrontBrand[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {vendors.map((vendor) => (
        <Link
          key={vendor.id}
          to={`/search?q=${encodeURIComponent(vendor.name)}`}
          className="overflow-hidden rounded-[1.8rem] border border-border/60 bg-card p-5 shadow-[0_24px_50px_-38px_rgba(45,29,19,0.26)] transition hover:-translate-y-1"
        >
          <div className="mb-4 flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
            {vendor.image ? (
              <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <span>{vendor.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="text-lg font-semibold">{vendor.name}</div>
          <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">{vendor.description ?? 'Brand catalog label'}</div>
          <div className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">Featured label</div>
        </Link>
      ))}
    </div>
  )
}
