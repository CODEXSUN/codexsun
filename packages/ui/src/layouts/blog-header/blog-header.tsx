import { useState, useEffect } from 'react'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  MailIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import type { BlogHeaderProps } from './blog-header-types'

export function BlogHeader({
  backToStoreHref = '/',
  backToStoreLabel = 'Back to Store',
  brand,
  className,
  onNewsletterClick,
  onSearch,
  readingProgress: explicitProgress,
  topics = [
    { active: true, href: '#all', id: 'all', label: 'All Stories' },
    { href: '#engineering', id: 'engineering', label: 'Engineering' },
    { href: '#product-design', id: 'product-design', label: 'Product Design' },
    { href: '#architecture', id: 'architecture', label: 'Architecture' },
    { href: '#guides', id: 'guides', label: 'Guides & Case Studies' },
  ],
}: BlogHeaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (explicitProgress !== undefined) return

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight <= 0) {
        setScrollProgress(0)
        return
      }
      const currentProgress = (window.scrollY / totalHeight) * 100
      setScrollProgress(Math.min(100, Math.max(0, currentProgress)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [explicitProgress])

  const progress = explicitProgress !== undefined ? explicitProgress : scrollProgress

  return (
    <header className={cn('sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md', className)}>
      {/* 1. Scroll / Reading Progress Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Top Bridge & Brand Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Back to Store link + Brand */}
        <div className="flex items-center gap-4">
          <a
            href={backToStoreHref}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>{backToStoreLabel}</span>
          </a>

          <div className="h-4 w-px bg-border/80 hidden sm:block" />

          <a href={brand.href ?? '/blog'} className="flex items-center gap-2">
            {brand.logo ?? <BookOpenIcon className="size-5 text-primary" />}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">{brand.title}</span>
              {brand.badge && (
                <Badge variant="secondary" className="text-[10px] font-semibold py-0">
                  {brand.badge}
                </Badge>
              )}
            </div>
          </a>
        </div>

        {/* Search & Newsletter CTA */}
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex items-center rounded-lg border border-input bg-muted/30 px-2.5 py-1">
              <SearchIcon className="size-3.5 text-muted-foreground mr-1.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch?.(searchQuery)
                }}
                placeholder="Search articles..."
                className="w-36 sm:w-48 bg-transparent text-xs placeholder:text-muted-foreground focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowSearch(true)}
            >
              <SearchIcon className="size-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="default"
            className="h-8 gap-1.5 text-xs font-medium"
            onClick={onNewsletterClick}
          >
            <MailIcon className="size-3.5" />
            <span>Subscribe</span>
          </Button>
        </div>
      </div>

      {/* 3. Topics Strip */}
      {topics.length > 0 && (
        <div className="border-t border-border/40 bg-muted/15 px-4 py-1.5">
          <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto no-scrollbar">
            {topics.map((t) => (
              <a
                key={t.id}
                href={t.href}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all',
                  t.active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span>{t.label}</span>
                {t.postCount !== undefined && (
                  <span className={cn('text-[10px] opacity-75', t.active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    ({t.postCount})
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
