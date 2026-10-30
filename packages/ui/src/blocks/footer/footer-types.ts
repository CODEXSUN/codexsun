import type { ReactNode } from 'react'

export type FooterLink = {
  readonly badge?: string | undefined
  readonly href: string
  readonly label: string
}

export type FooterColumn = {
  readonly links: readonly FooterLink[]
  readonly title: string
}

export type SiteFooterProps = {
  readonly brand: {
    readonly description?: string | undefined
    readonly logo?: ReactNode | undefined
    readonly title: string
  }
  readonly className?: string | undefined
  readonly columns?: readonly FooterColumn[] | undefined
  readonly copyright?: string | undefined
  readonly newsletter?: {
    readonly description?: string | undefined
    readonly onSubscribe?: ((email: string) => void) | undefined
    readonly placeholder?: string | undefined
    readonly title?: string | undefined
  }
  readonly paymentBadges?: readonly string[] | undefined
  readonly socialLinks?: readonly {
    readonly href: string
    readonly icon: ReactNode
    readonly label: string
  }[]
}
