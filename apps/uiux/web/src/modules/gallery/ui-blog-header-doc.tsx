import { useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { BlogHeader } from '@codexsun/ui/layouts/blog-header'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleTopics = [
  { active: true, href: '#all', id: 'all', label: 'All Stories', postCount: 24 },
  { href: '#architecture', id: 'architecture', label: 'Architecture & Systems', postCount: 10 },
  { href: '#product-design', id: 'design', label: 'Product Design', postCount: 8 },
  { href: '#tutorials', id: 'tutorials', label: 'Tutorials & Guides', postCount: 6 },
]

export function UiBlogHeaderDocumentation() {
  const topology = useMdiTopology()
  const [readingProgress, setReadingProgress] = useState(40)
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { BlogHeader } from '@codexsun/ui/layouts/blog-header'

export function EditorialJournal() {
  return <BlogHeader brand={{ title: 'Codex Editorial' }} />
}`}
      importPath="@codexsun/ui/layouts/blog-header"
      kind="Layout"
      name="Editorial Blog Header"
      navigation={{
        previous: { href: '/?layout=ecommerce-header', name: 'E-Commerce Header' },
      }}
      preview={
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Reading Progress:</span>
              {[20, 50, 80, 100].map((pct) => (
                <Button
                  key={pct}
                  size="sm"
                  variant={readingProgress === pct ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => {
                    setReadingProgress(pct)
                    setFeedback(`Reading progress set to ${pct}%.`)
                  }}
                >
                  {pct}%
                </Button>
              ))}
            </div>
            {feedback && <span className="text-muted-foreground italic">{feedback}</span>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs">
            <BlogHeader
              backToStoreHref="/?layout=ecommerce-header"
              backToStoreLabel="Back to CodexMart"
              brand={{
                badge: 'Journal & Stories',
                title: 'Codex Editorial',
              }}
              readingProgress={readingProgress}
              topics={sampleTopics}
              onNewsletterClick={() => setFeedback('Newsletter modal trigger opened.')}
              onSearch={(q) => setFeedback(`Article search query: "${q}".`)}
            />
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '32', preview: '32.1', usage: '32.2' }}
      usageDescription={
        <p>
          Editorial and journal publication header with pinned scroll progress indicator, topic navigation chips,
          article search overlay, and store bridge.
        </p>
      }
    />
  )
}
