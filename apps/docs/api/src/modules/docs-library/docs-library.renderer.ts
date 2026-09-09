import { evaluate } from '@mdx-js/mdx'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import * as runtime from 'react/jsx-runtime'
import type { DocumentRecord } from './docs-library.types.js'

const unsafeMdxPattern = /(^|\n)\s*(import|export)\s|[{}]/m
const fencedCodePattern = /```[\s\S]*?```/g
const inlineCodePattern = /`[^`\n]*`/g

export class DocsRenderer {
  public async render(document: DocumentRecord): Promise<string> {
    if (document.path.endsWith('.txt')) {
      return renderToStaticMarkup(
        createElement(
          'pre',
          null,
          createElement('code', { className: 'language-text' }, document.source),
        ),
      )
    }
    this.assertSafe(document.source)
    const source = this.replaceWikiLinks(document.source)
    const module = await evaluate(source, {
      ...runtime,
      development: false,
      rehypePlugins: [[rehypeHighlight, { plainText: ['mermaid'] }]],
      remarkPlugins: [remarkGfm],
    })
    return renderToStaticMarkup(createElement(module.default))
  }

  private assertSafe(source: string): void {
    const expressionSurface = source.replace(fencedCodePattern, '').replace(inlineCodePattern, '')

    if (unsafeMdxPattern.test(expressionSurface)) {
      throw new Error(
        'Docs MDX allows Markdown and component markup, but not executable expressions.',
      )
    }
  }

  private replaceWikiLinks(source: string): string {
    return source.replace(
      /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g,
      (_match, target, _heading, label) => {
        const slug = target.trim().replaceAll(' ', '-').toLowerCase()
        return `[${label?.trim() ?? target.trim()}](#${slug})`
      },
    )
  }
}
