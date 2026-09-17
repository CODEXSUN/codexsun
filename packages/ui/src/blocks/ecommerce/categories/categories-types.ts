import type { ReactNode } from 'react'

export type StoreCategoryCard = {
  readonly badge?: string
  readonly href: string
  readonly icon?: ReactNode
  readonly id: string
  readonly image?: string
  readonly itemCount?: number
  readonly subtitle?: string
  readonly tags?: readonly string[]
  readonly title: string
}

export type CategoryShowcaseProps = {
  readonly categories: readonly StoreCategoryCard[]
  readonly className?: string
  readonly columns?: 2 | 3 | 4 | 6
  readonly description?: string
  readonly onSelectCategory?: (categoryId: string) => void
  readonly title?: string
  readonly variant?: 'cards' | 'minimal' | 'pills'
}
