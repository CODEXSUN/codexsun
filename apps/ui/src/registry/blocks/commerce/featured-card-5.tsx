import { FeaturedCardRowSurface } from "@/components/ux/featured-card-row-surface"

import { featuredCardSampleItems } from "./featured-card-sample"

export default function FeaturedCard5() {
  return (
    <div className="mx-auto w-full xl:w-9/12">
      <FeaturedCardRowSurface
        items={featuredCardSampleItems}
        cardsPerRow={5}
        previewLayout
      />
    </div>
  )
}
