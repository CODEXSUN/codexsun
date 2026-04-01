import type { StorefrontReview } from '@/features/store/types/storefront'
import { RatingStars } from './RatingStars'

export function ReviewList({ reviews }: { reviews: StorefrontReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
        No reviews yet. Be the first customer to add one.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-[1.6rem] border border-border/60 bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{review.title ?? 'Customer review'}</div>
              <div className="text-sm text-muted-foreground">
                {review.username}
                {review.verifiedPurchase ? ' · Verified' : ''}
              </div>
            </div>
            <div className="text-right">
              <RatingStars rating={review.rating} size="sm" />
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{review.review ?? 'No review copy provided.'}</p>
        </article>
      ))}
    </div>
  )
}
