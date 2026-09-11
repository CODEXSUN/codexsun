import { useState } from 'react'
import { PricingTable, type PricingTierItem } from '@codexsun/ui/blocks/pricing'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleTiers: readonly PricingTierItem[] = [
  {
    annualPrice: 0,
    ctaLabel: 'Start Free',
    ctaVariant: 'outline',
    description: 'Perfect for side projects, prototypes, and learning.',
    features: [
      { label: 'Up to 3 active projects' },
      { label: 'Community forum support' },
      { label: '1 GB public file storage' },
      { label: 'Standard build queue' },
      { excluded: true, label: 'Custom domain integration' },
      { excluded: true, label: 'Audit logs and analytics' },
    ],
    id: 'starter',
    monthlyPrice: 0,
    name: 'Starter',
  },
  {
    annualPrice: 24,
    badge: 'Most Popular',
    ctaLabel: 'Upgrade to Pro',
    ctaVariant: 'default',
    description: 'Everything required for growing teams and serious products.',
    features: [
      { highlight: true, label: 'Unlimited active projects' },
      { highlight: true, label: 'Priority 24/7 Slack & email support' },
      { label: '50 GB high-speed NVMe storage' },
      { label: 'High-priority parallel build runners' },
      { label: 'Custom domain and SSL certificates' },
      { label: 'Advanced MariaDB advisory lock manager' },
    ],
    id: 'pro',
    isPopular: true,
    monthlyPrice: 29,
    name: 'Professional',
  },
  {
    annualPrice: 79,
    badge: 'Enterprise',
    ctaLabel: 'Contact Sales',
    ctaVariant: 'secondary',
    description: 'Dedicated infrastructure, custom SLAs, and white-glove onboarding.',
    features: [
      { highlight: true, label: 'Custom dedicated isolated deployments' },
      { highlight: true, label: '99.99% uptime guaranteed SLA' },
      { label: 'Unlimited storage with S3 backup sync' },
      { label: 'Custom security audit and SAML SSO' },
      { label: 'Dedicated technical account architect' },
      { label: 'Custom contract & invoicing terms' },
    ],
    id: 'enterprise',
    monthlyPrice: 99,
    name: 'Enterprise',
  },
]

const pricingCode = `import { PricingTable, type PricingTierItem } from '@codexsun/ui/blocks/pricing'

export function PricingPage() {
  return (
    <PricingTable
      tiers={tiers}
      title="Transparent, predictable pricing"
      subtitle="Upgrade or cancel at any time. All plans include automated daily backups."
      onSelectTier={(tier, interval) => handleCheckout(tier.id, interval)}
    />
  )
}`

export function UiPricingDocumentation() {
  const topology = useMdiTopology()
  const [feedback, setFeedback] = useState('Pricing table loaded. Toggle between Monthly & Annual billing.')

  return (
    <UiTemplatePage
      code={pricingCode}
      importPath="@codexsun/ui/blocks/pricing"
      kind="Block"
      name="Pricing Table"
      navigation={{
        next: { href: '/?component=button', name: 'Button' },
        previous: { href: '/?block=product-card', name: 'Product Card' },
      }}
      preview={
        <div className="flex flex-col gap-4">
          <PricingTable
            annualDiscountLabel="Save ~18%"
            subtitle="Choose the perfect plan for your product or portfolio showcase."
            tiers={sampleTiers}
            title="Flexible Plans for Modern Builders"
            onSelectTier={(tier, interval) =>
              setFeedback(`Selected "${tier.name}" tier with ${interval} billing.`)
            }
          />
          <p className="text-xs text-muted-foreground text-center" aria-live="polite">
            {feedback}
          </p>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '30', preview: '30.1', usage: '30.2' }}
      usageDescription={
        <p>
          Supply tiered plans, price intervals, and feature arrays. The Pricing Table block provides
          monthly/annual billing switches with discount indicators, highlighted popular tier borders,
          feature checklist items with excluded/highlight states, and CTA actions.
        </p>
      }
    />
  )
}
