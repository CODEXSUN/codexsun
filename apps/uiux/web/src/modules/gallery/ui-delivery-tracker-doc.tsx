import { useState } from 'react'
import { DeliveryTracker, type DeliveryMilestone } from '@codexsun/ui/blocks/ecommerce/delivery-tracker'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleMilestones: DeliveryMilestone[] = [
  {
    date: 'Oct 10, 2026',
    description: 'Order confirmed and inventory reserved in California Fulfillment Center.',
    id: 'm1',
    location: 'Ontario, CA',
    status: 'completed',
    time: '09:20 AM',
    title: 'Order Confirmed',
  },
  {
    date: 'Oct 11, 2026',
    description: 'Package sorted and transferred to FedEx Express sorting hub.',
    id: 'm2',
    location: 'Oakland, CA',
    status: 'completed',
    time: '02:45 PM',
    title: 'Carrier Picked Up',
  },
  {
    date: 'Oct 12, 2026',
    description: 'Driver out for local delivery in San Francisco metro area.',
    id: 'm3',
    location: 'San Francisco, CA',
    status: 'current',
    time: '08:15 AM',
    title: 'Out for Delivery',
  },
  {
    date: 'Oct 12, 2026 by 5:00 PM',
    description: 'Direct doorstep delivery with signature verification.',
    id: 'm4',
    status: 'pending',
    title: 'Delivered',
  },
]

export function UiDeliveryTrackerDocumentation() {
  const topology = useMdiTopology()
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { DeliveryTracker } from '@codexsun/ui/blocks/ecommerce/delivery-tracker'

export function TrackingStatus({ milestones, orderId, trackingNumber }) {
  return <DeliveryTracker milestones={milestones} orderId={orderId} trackingNumber={trackingNumber} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/delivery-tracker"
      kind="Block"
      name="Delivery Tracker"
      navigation={{
        previous: { href: '/?block=coupon-wallet', name: 'Coupon Wallet' },
      }}
      preview={
        <div className="space-y-6 max-w-3xl mx-auto">
          {feedback && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary font-semibold">
              {feedback}
            </div>
          )}

          <DeliveryTracker
            carrierName="FedEx Express"
            deliveryAddress="450 Mission Street, Suite 800, San Francisco, CA 94107"
            estimatedDelivery="Today, Oct 12 by 5:00 PM"
            milestones={sampleMilestones}
            orderId="CX-842918"
            trackingNumber="FDX-9982-1402-US"
            onTrackCarrier={() => setFeedback('Redirecting to official FedEx tracking portal...')}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '38', preview: '38.1', usage: '38.2' }}
      usageDescription={
        <p>
          Chronological shipment tracking block with visual milestone nodes, courier integration links,
          and checkpoint location history.
        </p>
      }
    />
  )
}
