export type DesignSystemCategory =
  | 'Actions'
  | 'Communication'
  | 'Data display'
  | 'Feedback'
  | 'Forms'
  | 'Layout'
  | 'Navigation'
  | 'Overlays'

export type DesignSystemVariantDefinition = {
  description: string
  id: string
  name: string
}

export type DesignSystemComponentDefinition = {
  category: DesignSystemCategory
  defaultVariantId: string
  id: string
  name: string
  source: string
  variants: readonly DesignSystemVariantDefinition[]
}

export type DesignSystemBlockDefinition = {
  defaultVariantId: string
  description: string
  id: string
  name: string
  source: string
  variants: readonly DesignSystemVariantDefinition[]
}

export type DesignSystemPageDefinition = {
  defaultVariantId: string
  description: string
  id: string
  name: string
  source: string
  variants: readonly DesignSystemVariantDefinition[]
}

export type DesignSystemSelection = {
  blocks: Readonly<Record<string, string>>
  components: Readonly<Record<string, string>>
  pages: Readonly<Record<string, string>>
}

export type DesignSystemSelectionInput = {
  blocks?: Readonly<Record<string, string>>
  components?: Readonly<Record<string, string>>
  pages?: Readonly<Record<string, string>>
}
