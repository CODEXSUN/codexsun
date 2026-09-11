export type DeliveryMilestone = {
  readonly date?: string
  readonly description?: string
  readonly id: string
  readonly location?: string
  readonly status: 'completed' | 'current' | 'pending'
  readonly time?: string
  readonly title: string
}

export type DeliveryTrackerProps = {
  readonly carrierName?: string
  readonly className?: string
  readonly deliveryAddress?: string
  readonly estimatedDelivery: string
  readonly milestones: readonly DeliveryMilestone[]
  readonly orderId: string
  readonly onTrackCarrier?: () => void
  readonly trackingNumber: string
}
