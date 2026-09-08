import { evaluate } from '@mdx-js/mdx'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'
import type { DocumentRecord } from './docs-library.types.js'

const unsafeMdxPattern = /(^|\n)\s*(import|export)\s|[{}]/m

export class DocsRenderer {
  public async render(document: DocumentRecord): Promise<string> {
    this.assertSafe(document.source)
    const source = this.replaceWikiLinks(document.source)
    const module = await evaluate(source, { ...runtime, development: false })
    return renderToStaticMarkup(createElement(module.default))
  }

  private assertSafe(source: string): void {
    if (unsafeMdxPattern.test(source)) {
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
