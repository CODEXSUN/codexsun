import { useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { BlogCard, BlogReader, type BlogPostArticle } from '@codexsun/ui/blocks/blog'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleArticle: BlogPostArticle = {
  author: {
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    bio: 'Elena is a Principal Architect leading frontend infrastructure and modular design systems at Codex.',
    name: 'Elena Rostova',
    role: 'Principal Systems Architect',
  },
  category: 'Frontend Architecture',
  coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80',
  date: 'Sep 11, 2026',
  excerpt:
    'How decoupling business entities from shared UI primitives unlocks scalable multi-product e-commerce architectures without bundle bloat.',
  href: '#',
  id: 'post-101',
  readingTime: '6 min read',
  relatedPosts: [
    {
      author: { name: 'Marcus Vance' },
      category: 'Design Systems',
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
      date: 'Aug 28, 2026',
      excerpt: 'Building high-performance data tables and micro-charts.',
      href: '#',
      id: 'post-102',
      readingTime: '4 min read',
      title: 'Real-time Sparklines & Financial Micro-Charts',
    },
    {
      author: { name: 'Alex Morgan' },
      category: 'Engineering',
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
      date: 'Aug 14, 2026',
      excerpt: 'Managing headless payment tokens with strict PCI compliance.',
      href: '#',
      id: 'post-103',
      readingTime: '5 min read',
      title: 'Modern Headless Checkout Architecture',
    },
  ],
  tableOfContents: [
    { href: '#the-problem', id: 'the-problem', level: 1, title: '1. The Monolith Problem' },
    { href: '#modular-blocks', id: 'modular-blocks', level: 1, title: '2. Modular Block Isolation' },
    { href: '#bundle-budget', id: 'bundle-budget', level: 2, title: '2.1 Keeping Chunks Under 400 KB' },
    { href: '#summary', id: 'summary', level: 1, title: '3. Architectural Takeaways' },
  ],
  tags: ['architecture', 'design-systems', 'ecommerce', 'typescript'],
  title: 'Engineering Modular Storefront & Blog Suites in Modern Monorepos',
}

export function UiBlogDocumentation() {
  const topology = useMdiTopology()
  const [viewMode, setViewMode] = useState<'reader' | 'cards'>('reader')
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { BlogCard, BlogReader } from '@codexsun/ui/blocks/blog'

export function EditorialArticle({ article }) {
  return <BlogReader article={article} />
}`}
      importPath="@codexsun/ui/blocks/blog"
      kind="Block"
      name="Blog & Editorial"
      navigation={{
        previous: { href: '/?block=footer', name: 'Site Footer' },
      }}
      preview={
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">View Specimen:</span>
              <Button
                size="sm"
                variant={viewMode === 'reader' ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setViewMode('reader')}
              >
                Article Reader View
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setViewMode('cards')}
              >
                Card Layouts Grid
              </Button>
            </div>
            {feedback && <span className="text-muted-foreground italic">{feedback}</span>}
          </div>

          {viewMode === 'reader' ? (
            <div className="rounded-2xl border border-border/80 bg-background shadow-xs">
              <BlogReader
                article={sampleArticle}
                onShare={(p) => setFeedback(`Article link copied for ${p} share.`)}
              >
                <div className="space-y-4">
                  <h2 id="the-problem" className="text-xl font-bold text-foreground">
                    1. The Monolith Problem
                  </h2>
                  <p>
                    As enterprise e-commerce platforms expand, combining UI components directly inside business applications
                    leads to dependency tangles, bloated bundle chunks, and brittle maintenance cycles.
                  </p>
                  <h2 id="modular-blocks" className="text-xl font-bold text-foreground pt-4">
                    2. Modular Block Isolation
                  </h2>
                  <p>
                    By extracting decoupled blocks—such as storefront carts, delivery trackers, comparison matrices, and
                    editorial readers—into a package-owned design system (`@codexsun/ui`), applications retain control
                    over business state while UI primitives remain strictly reusable and testable.
                  </p>
                  <h3 id="bundle-budget" className="text-base font-semibold text-foreground pt-2">
                    2.1 Keeping Chunks Under 400 KB
                  </h3>
                  <p>
                    With route-level code splitting and lazy loading (`React.lazy`), users only download the precise code needed
                    for the active view, keeping entry chunks below 30 KB.
                  </p>
                </div>
              </BlogReader>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Horizontal Featured Card
                </h4>
                <BlogCard post={sampleArticle} variant="horizontal" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Standard Grid Cards
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <BlogCard post={sampleArticle} variant="standard" />
                  {sampleArticle.relatedPosts?.map((p) => (
                    <BlogCard key={p.id} post={p} variant="standard" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      }
      topology={topology}
      topologyIds={{ page: '44', preview: '44.1', usage: '44.2' }}
      usageDescription={
        <p>
          Editorial blog block suite featuring responsive post cards (standard, horizontal, and compact)
          and a rich article reader view with table of contents and author byline.
        </p>
      }
    />
  )
}
