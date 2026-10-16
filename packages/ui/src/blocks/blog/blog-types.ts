import type { ReactNode } from 'react'

export type BlogPostAuthor = {
  readonly avatar?: string | undefined
  readonly bio?: string | undefined
  readonly name: string
  readonly role?: string | undefined
}

export type BlogPostSummary = {
  readonly author: BlogPostAuthor
  readonly category: string
  readonly coverImage: string
  readonly date: string
  readonly excerpt: string
  readonly href: string
  readonly id: string
  readonly isFeatured?: boolean | undefined
  readonly readingTime: string
  readonly tags?: readonly string[] | undefined
  readonly title: string
}

export type BlogPostArticle = BlogPostSummary & {
  readonly contentHtml?: string | undefined
  readonly relatedPosts?: readonly BlogPostSummary[] | undefined
  readonly tableOfContents?: readonly {
    readonly href: string
    readonly id: string
    readonly level: number
    readonly title: string
  }[]
}

export type BlogCardProps = {
  readonly className?: string | undefined
  readonly onSelect?: ((postId: string) => void) | undefined
  readonly post: BlogPostSummary
  readonly variant?: 'compact' | 'horizontal' | 'standard' | undefined
}

export type BlogReaderProps = {
  readonly article: BlogPostArticle
  readonly children?: ReactNode | undefined
  readonly className?: string | undefined
  readonly onShare?: ((platform: 'twitter' | 'linkedin' | 'copy') => void) | undefined
}
