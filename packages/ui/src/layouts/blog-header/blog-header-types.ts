import type { ReactNode } from 'react'

export type BlogTopicTag = {
  readonly active?: boolean | undefined
  readonly href: string
  readonly id: string
  readonly label: string
  readonly postCount?: number | undefined
}

export type BlogHeaderProps = {
  readonly backToStoreHref?: string | undefined
  readonly backToStoreLabel?: string | undefined
  readonly brand: {
    readonly badge?: string | undefined
    readonly href?: string | undefined
    readonly logo?: ReactNode | undefined
    readonly title: string
  }
  readonly className?: string | undefined
  readonly onNewsletterClick?: (() => void) | undefined
  readonly onSearch?: ((query: string) => void) | undefined
  readonly readingProgress?: number | undefined
  readonly topics?: readonly BlogTopicTag[] | undefined
}
