import type { ReactNode } from 'react'

export type StoreCategoryCard = {
  readonly badge?: string | undefined
  readonly href: string
  readonly icon?: ReactNode | undefined
  readonly id: string
  readonly image?: string | undefined
  readonly itemCount?: number | undefined
  readonly subtitle?: string | undefined
  readonly tags?: readonly string[] | undefined
  readonly title: string
}

export type CategoryShowcaseProps = {
  readonly categories: readonly StoreCategoryCard[]
  readonly className?: string | undefined
  readonly columns?: 2 | 3 | 4 | 6 | undefined
  readonly description?: string | undefined
  readonly onSelectCategory?: ((categoryId: string) => void) | undefined
  readonly title?: string | undefined
  readonly variant?: 'cards' | 'minimal' | 'pills' | undefined
}
