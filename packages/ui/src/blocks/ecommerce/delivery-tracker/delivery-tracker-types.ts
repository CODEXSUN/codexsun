export type DeliveryMilestone = {
  readonly date?: string | undefined
  readonly description?: string | undefined
  readonly id: string
  readonly location?: string | undefined
  readonly status: 'completed' | 'current' | 'pending'
  readonly time?: string | undefined
  readonly title: string
}

export type DeliveryTrackerProps = {
  readonly carrierName?: string | undefined
  readonly className?: string | undefined
  readonly deliveryAddress?: string | undefined
  readonly estimatedDelivery: string
  readonly milestones: readonly DeliveryMilestone[]
  readonly orderId: string
  readonly onTrackCarrier?: (() => void) | undefined
  readonly trackingNumber: string
}
