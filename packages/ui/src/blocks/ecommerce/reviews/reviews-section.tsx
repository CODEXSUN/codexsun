import { useState } from 'react'
import { CheckCircle2Icon, MessageSquareIcon, PenToolIcon, StarIcon, ThumbsUpIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { ReviewsSectionProps } from './reviews-types'

export function ReviewsSection({
  averageRating,
  className,
  distribution,
  onHelpfulVote,
  onSubmitReview,
  reviews,
  totalReviews,
}: ReviewsSectionProps) {
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null)
  const [newRating, setNewRating] = useState(5)
  const [newTitle, setNewTitle] = useState('')
  const [newComment, setNewComment] = useState('')
  const [votedSet, setVotedSet] = useState<Set<string>>(new Set())

  const filteredReviews = selectedStarFilter
    ? reviews.filter((r) => r.rating === selectedStarFilter)
    : reviews

  const handleVote = (id: string) => {
    if (votedSet.has(id)) return
    setVotedSet(new Set(votedSet).add(id))
    onHelpfulVote?.(id)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    onSubmitReview?.({
      comment: newComment,
      rating: newRating,
      title: newTitle,
    })
    setShowWriteModal(false)
    setNewTitle('')
    setNewComment('')
  }

  return (
    <div className={cn('space-y-8 rounded-2xl border border-border/80 bg-card p-6 shadow-xs', className)}>
      {/* 1. Rating Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-border/60 pb-8">
        {/* Big Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/20 border border-border/60 text-center">
          <span className="text-4xl font-black tracking-tight text-foreground">{averageRating.toFixed(1)}</span>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon
                key={s}
                className={cn(
                  'size-4',
                  s <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-muted text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Based on {totalReviews.toLocaleString()} verified ratings</span>

          <Button
            size="sm"
            className="gap-2 mt-4 text-xs"
            onClick={() => setShowWriteModal(true)}
          >
            <PenToolIcon className="size-3.5" />
            <span>Write a Review</span>
          </Button>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] ?? 0
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
            const isSelected = selectedStarFilter === star

            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-1 transition-all text-left group',
                  isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted/40 text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-1 w-12 shrink-0">
                  <span className="font-semibold text-foreground">{star}</span>
                  <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                </div>

                <div className="h-2 flex-1 rounded-full bg-border overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-300', isSelected ? 'bg-primary' : 'bg-amber-400')}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-12 text-right text-[11px] font-mono text-muted-foreground">
                  {pct}%
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Write Review Modal / Inline Form */}
      {showWriteModal && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-4 animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-sm font-bold text-foreground">Write Customer Review</h4>
            <button
              type="button"
              onClick={() => setShowWriteModal(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Overall Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewRating(s)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <StarIcon
                    className={cn('size-5', s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-border')}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Review Title (optional)</label>
            <input
              type="text"
              placeholder="e.g. Exceeded expectations! Great battery life."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Your Feedback</label>
            <textarea
              rows={3}
              required
              placeholder="What did you like or dislike about this product?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" size="sm" className="text-xs">
            Submit Review
          </Button>
        </form>
      )}

      {/* 3. Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="size-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Customer Feedback ({filteredReviews.length})
            </h4>
          </div>
          {selectedStarFilter && (
            <Badge
              variant="outline"
              className="cursor-pointer gap-1 text-xs"
              onClick={() => setSelectedStarFilter(null)}
            >
              <span>Showing {selectedStarFilter}-star only</span>
              <span>✕</span>
            </Badge>
          )}
        </div>

        <div className="space-y-4 divide-y divide-border/60">
          {filteredReviews.map((rev) => {
            const hasVoted = votedSet.has(rev.id)

            return (
              <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    {rev.authorAvatar ? (
                      <img src={rev.authorAvatar} alt={rev.author} className="size-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {rev.author.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">{rev.author}</span>
                        {rev.isVerifiedBuyer && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2Icon className="size-3" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIcon
                        key={s}
                        className={cn(
                          'size-3.5',
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {rev.title && <h5 className="text-xs font-bold text-foreground">{rev.title}</h5>}
                <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>

                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {rev.photos.map((ph, idx) => (
                      <img
                        key={idx}
                        src={ph}
                        alt="Customer photo"
                        className="size-14 rounded-lg object-cover border border-border"
                      />
                    ))}
                  </div>
                )}

                {/* Helpful Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={hasVoted}
                    onClick={() => handleVote(rev.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                      hasVoted
                        ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-600'
                        : 'border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <ThumbsUpIcon className="size-3" />
                    <span>Helpful ({((rev.helpfulCount ?? 0) + (hasVoted ? 1 : 0))})</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
