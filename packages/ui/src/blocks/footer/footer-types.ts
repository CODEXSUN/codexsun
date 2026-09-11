import type { ReactNode } from 'react'

export type FooterLink = {
  readonly badge?: string
  readonly href: string
  readonly label: string
}

export type FooterColumn = {
  readonly links: readonly FooterLink[]
  readonly title: string
}

export type SiteFooterProps = {
  readonly brand: {
    readonly description?: string
    readonly logo?: ReactNode
    readonly title: string
  }
  readonly className?: string
  readonly columns?: readonly FooterColumn[]
  readonly copyright?: string
  readonly newsletter?: {
    readonly description?: string
    readonly onSubscribe?: (email: string) => void
    readonly placeholder?: string
    readonly title?: string
  }
  readonly paymentBadges?: readonly string[]
  readonly socialLinks?: readonly {
    readonly href: string
    readonly icon: ReactNode
    readonly label: string
  }[]
}
