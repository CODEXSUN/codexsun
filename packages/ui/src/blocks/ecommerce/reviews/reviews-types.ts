export type CustomerReview = {
  readonly author: string
  readonly authorAvatar?: string | undefined
  readonly comment: string
  readonly date: string
  readonly helpfulCount?: number | undefined
  readonly id: string
  readonly isVerifiedBuyer?: boolean | undefined
  readonly photos?: readonly string[] | undefined
  readonly rating: number
  readonly title?: string | undefined
}

export type RatingDistribution = {
  readonly [star: number]: number
}

export type ReviewsSectionProps = {
  readonly averageRating: number
  readonly className?: string | undefined
  readonly distribution: RatingDistribution
  readonly onHelpfulVote?: ((reviewId: string) => void) | undefined
  readonly onSubmitReview?: (review: { comment: string; rating: number; title: string }) => void
  readonly reviews: readonly CustomerReview[]
  readonly totalReviews: number
}
