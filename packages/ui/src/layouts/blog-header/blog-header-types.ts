import type { ReactNode } from 'react'

export type BlogTopicTag = {
  readonly active?: boolean
  readonly href: string
  readonly id: string
  readonly label: string
  readonly postCount?: number
}

export type BlogHeaderProps = {
  readonly backToStoreHref?: string
  readonly backToStoreLabel?: string
  readonly brand: {
    readonly badge?: string
    readonly href?: string
    readonly logo?: ReactNode
    readonly title: string
  }
  readonly className?: string
  readonly onNewsletterClick?: () => void
  readonly onSearch?: (query: string) => void
  readonly readingProgress?: number
  readonly topics?: readonly BlogTopicTag[]
}
