import { FeaturedCardRowSurface } from "@/components/ux/featured-card-row-surface"

import { featuredCardSampleItems } from "./featured-card-sample"

export default function FeaturedCard4() {
  return <FeaturedCardRowSurface items={featuredCardSampleItems} cardsPerRow={4} />
}
