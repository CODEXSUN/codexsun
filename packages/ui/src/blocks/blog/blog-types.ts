import type { ReactNode } from 'react'

export type BlogPostAuthor = {
  readonly avatar?: string
  readonly bio?: string
  readonly name: string
  readonly role?: string
}

export type BlogPostSummary = {
  readonly author: BlogPostAuthor
  readonly category: string
  readonly coverImage: string
  readonly date: string
  readonly excerpt: string
  readonly href: string
  readonly id: string
  readonly isFeatured?: boolean
  readonly readingTime: string
  readonly tags?: readonly string[]
  readonly title: string
}

export type BlogPostArticle = BlogPostSummary & {
  readonly contentHtml?: string
  readonly relatedPosts?: readonly BlogPostSummary[]
  readonly tableOfContents?: readonly {
    readonly href: string
    readonly id: string
    readonly level: number
    readonly title: string
  }[]
}

export type BlogCardProps = {
  readonly className?: string
  readonly onSelect?: (postId: string) => void
  readonly post: BlogPostSummary
  readonly variant?: 'compact' | 'horizontal' | 'standard'
}

export type BlogReaderProps = {
  readonly article: BlogPostArticle
  readonly children?: ReactNode
  readonly className?: string
  readonly onShare?: (platform: 'twitter' | 'linkedin' | 'copy') => void
}
