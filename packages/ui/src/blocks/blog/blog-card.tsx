import { ClockIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '../../components/badge'
import type { BlogCardProps } from './blog-types'

export function BlogCard({
  className,
  onSelect,
  post,
  variant = 'standard',
}: BlogCardProps) {
  if (variant === 'compact') {
    return (
      <div
        onClick={() => onSelect?.(post.id)}
        className={cn(
          'group flex items-center gap-3 cursor-pointer rounded-xl p-2 transition-colors hover:bg-muted/40',
          className
        )}
      >
        <img
          src={post.coverImage}
          alt={post.title}
          className="size-16 rounded-lg object-cover bg-muted shrink-0 border border-border/40"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold">
            {post.category}
          </Badge>
          <h5 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h5>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'horizontal') {
    return (
      <div
        onClick={() => onSelect?.(post.id)}
        className={cn(
          'group grid grid-cols-1 sm:grid-cols-12 gap-5 cursor-pointer rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-primary/50 hover:shadow-md',
          className
        )}
      >
        <div className="sm:col-span-5 aspect-16/10 overflow-hidden rounded-xl bg-muted border border-border/40">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="sm:col-span-7 flex flex-col justify-between space-y-2 py-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold">
                {post.category}
              </Badge>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ClockIcon className="size-3" />
                <span>{post.readingTime}</span>
              </div>
            </div>

            <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h4>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-border/40">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} className="size-6 rounded-full object-cover" />
            ) : (
              <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {post.author.name.charAt(0)}
              </div>
            )}
            <div className="text-[11px] font-semibold text-foreground">
              {post.author.name} <span className="font-normal text-muted-foreground">• {post.date}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard Card
  return (
    <div
      onClick={() => onSelect?.(post.id)}
      className={cn(
        'group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-primary/50 hover:shadow-md',
        className
      )}
    >
      <div>
        <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-muted mb-3 border border-border/40">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] font-bold bg-background/90 backdrop-blur-sm">
            {post.category}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ClockIcon className="size-3" />
            <span>{post.readingTime}</span>
            <span>•</span>
            <span>{post.date}</span>
          </div>

          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h4>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/40">
        {post.author.avatar ? (
          <img src={post.author.avatar} alt={post.author.name} className="size-6 rounded-full object-cover" />
        ) : (
          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
            {post.author.name.charAt(0)}
          </div>
        )}
        <span className="text-[11px] font-medium text-foreground">{post.author.name}</span>
      </div>
    </div>
  )
}
