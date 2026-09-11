import { useState } from 'react'
import { PriceHistoryChart, type PriceDataPoint } from '@codexsun/ui/blocks/ecommerce/price-history'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleHistory: PriceDataPoint[] = [
  { date: 'May 1', price: 249 },
  { date: 'Jun 1', price: 239 },
  { date: 'Jul 1', price: 219 },
  { date: 'Aug 1', price: 249 },
  { date: 'Sep 1', price: 199 },
  { date: 'Oct 1', price: 179 },
]

export function UiPriceHistoryDocumentation() {
  const topology = useMdiTopology()
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { PriceHistoryChart } from '@codexsun/ui/blocks/ecommerce/price-history'

export function PriceTrends({ history, currentPrice }) {
  return <PriceHistoryChart history={history} currentPrice={currentPrice} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/price-history"
      kind="Block"
      name="Price History Tracker"
      navigation={{
        previous: { href: '/?block=payment-methods', name: 'Payment Methods' },
      }}
      preview={
        <div className="space-y-6 max-w-2xl mx-auto">
          {feedback && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {feedback}
            </div>
          )}

          <PriceHistoryChart
            currentPrice={179}
            history={sampleHistory}
            lowestPrice={179}
            peakPrice={249}
            productTitle="Studio ANC Wireless Headset"
            onSetPriceAlert={() => setFeedback('Price drop alert enabled! We will notify you if this drops below $179.')}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '40', preview: '40.1', usage: '40.2' }}
      usageDescription={
        <p>
          Historical price tracker chart with visual trend curve, all-time low price alerts, peak delta calculations,
          and price-drop notification alerts.
        </p>
      }
    />
  )
}
