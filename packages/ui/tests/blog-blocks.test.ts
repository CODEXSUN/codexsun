import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BlogCard, BlogReader } from '../src/blocks/blog/index'

test('blog card renders cover, category, title, and author', () => {
  const html = renderToStaticMarkup(
    createElement(BlogCard, {
      post: {
        author: { name: 'Elena Rostova' },
        category: 'Architecture',
        coverImage: '/blog-1.jpg',
        date: 'Sep 10, 2026',
        excerpt: 'How modular workspaces optimize frontend engineering velocity.',
        href: '/blog/modular-workspaces',
        id: 'post-1',
        readingTime: '6 min read',
        title: 'Building Modular Workspace Systems',
      },
      variant: 'standard',
    }),
  )

  assert.match(html, /Architecture/)
  assert.match(html, /Building Modular Workspace Systems/)
  assert.match(html, /Elena Rostova/)
  assert.match(html, /6 min read/)
})

test('blog reader renders article header, author, and table of contents', () => {
  const html = renderToStaticMarkup(
    createElement(
      BlogReader,
      {
        article: {
          author: { bio: 'Principal Architect at Codex', name: 'Elena Rostova', role: 'Staff Engineer' },
          category: 'Architecture',
          coverImage: '/hero.jpg',
          date: 'Sep 10, 2026',
          excerpt: 'Deep dive into event-driven frontend blocks.',
          href: '/blog/event-driven',
          id: 'post-2',
          readingTime: '8 min read',
          tableOfContents: [
            { href: '#intro', id: 'intro', level: 1, title: 'Introduction' },
            { href: '#blocks', id: 'blocks', level: 2, title: 'Modular Blocks' },
          ],
          tags: ['frontend', 'react', 'design-systems'],
          title: 'Deep Dive into Event-Driven Frontend Blocks',
        },
      },
      createElement('p', null, 'Article body paragraph content goes here.'),
    ),
  )

  assert.match(html, /Deep Dive into Event-Driven Frontend Blocks/)
  assert.match(html, /Elena Rostova/)
  assert.match(html, /Staff Engineer/)
  assert.match(html, /Introduction/)
  assert.match(html, /Modular Blocks/)
  assert.match(html, /Article body paragraph content goes here\./)
  assert.match(html, /#frontend/)
})
