import { useState } from 'react'
import { SiteFooter } from '@codexsun/ui/blocks/footer'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

export function UiFooterDocumentation() {
  const topology = useMdiTopology()
  const [subscribedFeedback, setSubscribedFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { SiteFooter } from '@codexsun/ui/blocks/footer'

export function Footer() {
  return <SiteFooter brand={{ title: 'CodexMart' }} />
}`}
      importPath="@codexsun/ui/blocks/footer"
      kind="Block"
      name="Site Footer"
      navigation={{
        previous: { href: '/?block=wishlist', name: 'Wishlist Grid' },
      }}
      preview={
        <div className="space-y-6">
          {subscribedFeedback && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {subscribedFeedback}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs">
            <SiteFooter
              brand={{
                description:
                  'Codex designs precision hardware tools, acoustics, and modular workspace systems for creators and software engineers.',
                title: 'Codex Technologies',
              }}
              newsletter={{
                description: 'Subscribe to our weekly dispatch for firmware updates, architecture essays, and drops.',
                onSubscribe: (email) => setSubscribedFeedback(`Successfully subscribed ${email} to weekly newsletter!`),
                placeholder: 'alex@example.com',
                title: 'Join our weekly design newsletter',
              }}
            />
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '43', preview: '43.1', usage: '43.2' }}
      usageDescription={
        <p>
          Multi-column storefront and publication footer with newsletter signup, certified payment partner badges,
          and copyright notes.
        </p>
      }
    />
  )
}
