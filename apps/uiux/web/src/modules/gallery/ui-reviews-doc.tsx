import { useState } from 'react'
import { ReviewsSection, type CustomerReview } from '@codexsun/ui/blocks/ecommerce/reviews'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleReviews: CustomerReview[] = [
  {
    author: 'David Chen',
    comment: 'The noise cancellation completely blocks office chatter. Battery lasts multiple days between charges without any issues.',
    date: '3 days ago',
    helpfulCount: 28,
    id: 'r1',
    isVerifiedBuyer: true,
    rating: 5,
    title: 'Flawless soundstage and ergonomics',
  },
  {
    author: 'Sarah Jenkins',
    comment: 'Great audio profile right out of the box. Cushion memory foam is very soft for extended coding sessions.',
    date: '1 week ago',
    helpfulCount: 14,
    id: 'r2',
    isVerifiedBuyer: true,
    rating: 4,
    title: 'Solid daily driver headset',
  },
  {
    author: 'Marcus Vance',
    comment: 'Fast delivery, well packaged. Build quality feels very premium.',
    date: '2 weeks ago',
    helpfulCount: 6,
    id: 'r3',
    isVerifiedBuyer: true,
    rating: 5,
  },
]

export function UiReviewsDocumentation() {
  const topology = useMdiTopology()
  const [reviews, setReviews] = useState(sampleReviews)
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { ReviewsSection } from '@codexsun/ui/blocks/ecommerce/reviews'

export function ProductReviews({ reviews, averageRating, distribution }) {
  return <ReviewsSection reviews={reviews} averageRating={averageRating} distribution={distribution} totalReviews={100} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/reviews"
      kind="Block"
      name="Reviews & Ratings"
      navigation={{
        previous: { href: '/?block=price-history', name: 'Price History' },
      }}
      preview={
        <div className="space-y-6 max-w-3xl mx-auto">
          {feedback && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary font-semibold">
              {feedback}
            </div>
          )}

          <ReviewsSection
            averageRating={4.8}
            distribution={{ 1: 1, 2: 2, 3: 4, 4: 25, 5: 98 }}
            reviews={reviews}
            totalReviews={130}
            onHelpfulVote={(id) => setFeedback(`Voted helpful for review #${id}.`)}
            onSubmitReview={(newRev) => {
              const added: CustomerReview = {
                author: 'You (Current User)',
                comment: newRev.comment,
                date: 'Just now',
                helpfulCount: 0,
                id: `r-${Date.now()}`,
                isVerifiedBuyer: true,
                rating: newRev.rating,
                title: newRev.title || undefined,
              }
              setReviews([added, ...reviews])
              setFeedback('Your review has been submitted and published!')
            }}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '41', preview: '41.1', usage: '41.2' }}
      usageDescription={
        <p>
          Customer reviews and ratings section with overall score, 5-star distribution bars with interactive
          star filter, verified buyer review cards, and submit review form.
        </p>
      }
    />
  )
}
