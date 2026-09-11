export type ComparisonProduct = {
  readonly attributes: Record<string, string | boolean | number>
  readonly badge?: string
  readonly id: string
  readonly image: string
  readonly inStock: boolean
  readonly price: string
  readonly rating: number
  readonly reviewsCount?: number
  readonly title: string
}

export type ComparisonFeatureGroup = {
  readonly features: readonly {
    readonly description?: string
    readonly key: string
    readonly label: string
  }[]
  readonly groupName: string
}

export type ProductComparisonProps = {
  readonly className?: string
  readonly featureGroups: readonly ComparisonFeatureGroup[]
  readonly onAddToCart?: (productId: string) => void
  readonly onRemoveProduct?: (productId: string) => void
  readonly products: readonly ComparisonProduct[]
}
