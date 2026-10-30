export type ComparisonProduct = {
  readonly attributes: Record<string, string | boolean | number>
  readonly badge?: string | undefined
  readonly id: string
  readonly image: string
  readonly inStock: boolean
  readonly price: string
  readonly rating: number
  readonly reviewsCount?: number | undefined
  readonly title: string
}

export type ComparisonFeatureGroup = {
  readonly features: readonly {
    readonly description?: string | undefined
    readonly key: string
    readonly label: string
  }[]
  readonly groupName: string
}

export type ProductComparisonProps = {
  readonly className?: string | undefined
  readonly featureGroups: readonly ComparisonFeatureGroup[]
  readonly onAddToCart?: ((productId: string) => void) | undefined
  readonly onRemoveProduct?: ((productId: string) => void) | undefined
  readonly products: readonly ComparisonProduct[]
}
