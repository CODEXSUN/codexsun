import { useState } from 'react'
import { CheckIcon, ClockIcon, CopyIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import { BlogCard } from './blog-card'
import type { BlogReaderProps } from './blog-types'

export function BlogReader({
  article,
  children,
  className,
  onShare,
}: BlogReaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    onShare?.('copy')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className={cn('mx-auto max-w-5xl space-y-10 px-4 py-8', className)}>
      {/* 1. Article Header */}
      <header className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-bold text-xs">
            {article.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" />
            <span>{article.readingTime}</span>
            <span>•</span>
            <span>{article.date}</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          {article.excerpt}
        </p>

        {/* Author Byline */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-3">
            {article.author.avatar ? (
              <img src={article.author.avatar} alt={article.author.name} className="size-10 rounded-full object-cover" />
            ) : (
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {article.author.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-foreground">{article.author.name}</div>
              {article.author.role && (
                <div className="text-xs text-muted-foreground">{article.author.role}</div>
              )}
            </div>
          </div>

          {/* Share Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={handleCopyLink}
            >
              {copied ? <CheckIcon className="size-3.5 text-emerald-600" /> : <CopyIcon className="size-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Cover Hero Image */}
      <div className="aspect-16/9 w-full overflow-hidden rounded-3xl bg-muted border border-border/60 shadow-xs">
        <img
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 3. Main Reading Content + Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Table of Contents (Sticky on desktop) */}
        {article.tableOfContents && article.tableOfContents.length > 0 && (
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-24 space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-4 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                On This Page
              </h4>
              <nav className="space-y-1">
                {article.tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="block py-1 text-muted-foreground hover:text-foreground transition-colors truncate"
                    style={{ paddingLeft: `${(item.level - 1) * 8}px` }}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Content Body */}
        <div
          className={cn(
            'space-y-6 text-foreground leading-relaxed text-sm order-1 lg:order-2',
            article.tableOfContents && article.tableOfContents.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'
          )}
        >
          {children}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">Tags:</span>
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-medium">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Author Bio Box */}
          {article.author.bio && (
            <div className="flex items-start gap-4 rounded-2xl border border-border/80 bg-muted/30 p-5 mt-8">
              {article.author.avatar ? (
                <img src={article.author.avatar} alt={article.author.name} className="size-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                  {article.author.name.charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <div className="text-sm font-bold text-foreground">About {article.author.name}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{article.author.bio}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Posts */}
      {article.relatedPosts && article.relatedPosts.length > 0 && (
        <section className="pt-10 border-t border-border/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Related Stories</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {article.relatedPosts.map((post) => (
              <BlogCard key={post.id} post={post} variant="standard" />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
