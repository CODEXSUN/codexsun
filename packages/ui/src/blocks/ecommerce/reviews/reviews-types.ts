export type CustomerReview = {
  readonly author: string
  readonly authorAvatar?: string
  readonly comment: string
  readonly date: string
  readonly helpfulCount?: number
  readonly id: string
  readonly isVerifiedBuyer?: boolean
  readonly photos?: readonly string[]
  readonly rating: number
  readonly title?: string
}

export type RatingDistribution = {
  readonly [star: number]: number
}

export type ReviewsSectionProps = {
  readonly averageRating: number
  readonly className?: string
  readonly distribution: RatingDistribution
  readonly onHelpfulVote?: (reviewId: string) => void
  readonly onSubmitReview?: (review: { comment: string; rating: number; title: string }) => void
  readonly reviews: readonly CustomerReview[]
  readonly totalReviews: number
}
