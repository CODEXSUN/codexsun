import { CommerceProductCard } from "@/components/ux/commerce-product-card"

import { featuredCardSampleItems } from "./featured-card-sample"

export default function FeaturedCard1() {
  const item = featuredCardSampleItems[0]

  return item ? (
    <div className="mx-auto w-full xl:w-9/12">
      <div className="mx-auto w-full max-w-sm">
        <CommerceProductCard
          href={item.href}
          name={item.name}
          imageUrl={item.imageUrl}
          badge={item.badge}
          brandName={item.brandName}
          categoryName={item.categoryName}
          shortDescription={item.shortDescription}
          amount={item.amount}
          compareAtAmount={item.compareAtAmount}
          availableQuantity={item.availableQuantity}
        />
      </div>
    </div>
  ) : null
}
