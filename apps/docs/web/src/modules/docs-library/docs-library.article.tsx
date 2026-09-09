import { useEffect, useMemo, useRef } from 'react'
import { getDocumentAssetUrl } from './docs-library.services'
import { getDocumentHeadings } from './docs-library.utils'

export function DocsLibraryArticle({
  html,
  path,
  source,
}: {
  html: string
  path: string
  source: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const headings = useMemo(() => getDocumentHeadings(source), [source])

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    assignHeadingIds(content, headings)
    resolveArticleImages(content, path)
    addCodeControls(content)

    let disposed = false
    void renderMermaidDiagrams(content, () => disposed)
    return () => {
      disposed = true
    }
  }, [headings, html, path])

  return <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
}

function assignHeadingIds(content: HTMLDivElement, headings: ReturnType<typeof getDocumentHeadings>) {
  content.querySelectorAll('h2, h3').forEach((element, index) => {
    const heading = headings[index]
    if (heading) element.id = heading.id
  })
}

function resolveArticleImages(content: HTMLDivElement, documentPath: string) {
  content.querySelectorAll('img').forEach((image) => {
    const assetPath = resolveAssetPath(documentPath, image.getAttribute('src'))
    if (assetPath) image.src = getDocumentAssetUrl(assetPath)
  })
}

function resolveAssetPath(documentPath: string, source: string | null): string | undefined {
  if (!source || /^(?:#|data:|https?:|\/)/i.test(source)) return undefined

  const segments = [...documentPath.split('/').slice(0, -1), ...source.split('/')]
  const resolved = segments.reduce<string[]>((result, segment) => {
    if (!segment || segment === '.') return result
    if (segment === '..') return result.slice(0, -1)
    return [...result, segment]
  }, [])
  return resolved.length ? resolved.join('/') : undefined
}

function addCodeControls(content: HTMLDivElement) {
  content.querySelectorAll('pre').forEach((pre) => {
    if (pre.dataset.docsCodeReady) return
    const code = pre.querySelector('code')
    if (!code || isMermaidBlock(code)) return

    pre.dataset.docsCodeReady = 'true'
    const language = getCodeLanguage(code)
    if (language) pre.append(createLanguageLabel(language))
    pre.append(createCopyButton(code))
  })
}

function createLanguageLabel(language: string): HTMLSpanElement {
  const label = document.createElement('span')
  label.className = 'docs-code-language'
  label.textContent = language
  return label
}

function createCopyButton(code: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.className = 'docs-code-copy'
  button.textContent = 'Copy'
  button.type = 'button'
  button.addEventListener('click', () => {
    void navigator.clipboard.writeText(code.textContent ?? '').then(() => {
      button.textContent = 'Copied'
      window.setTimeout(() => {
        button.textContent = 'Copy'
      }, 1_400)
    })
  })
  return button
}

async function renderMermaidDiagrams(content: HTMLDivElement, isDisposed: () => boolean) {
  const blocks = [...content.querySelectorAll('pre > code')].filter(isMermaidBlock)
  if (!blocks.length) return

  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    securityLevel: 'strict',
    startOnLoad: false,
    theme: 'neutral',
  })

  await Promise.all(
    blocks.map(async (code, index) => {
      const pre = code.parentElement
      if (!pre || isDisposed()) return

      const diagram = document.createElement('div')
      diagram.className = 'docs-mermaid-diagram'
      try {
        const { svg } = await mermaid.render(`docs-mermaid-${Date.now()}-${index}`, code.textContent ?? '')
        if (!isDisposed()) {
          diagram.innerHTML = svg
          pre.replaceWith(diagram)
        }
      } catch {
        diagram.className = 'docs-mermaid-error'
        diagram.textContent = 'This Mermaid diagram has invalid syntax.'
        if (!isDisposed()) pre.replaceWith(diagram)
      }
    }),
  )
}

function getCodeLanguage(code: Element): string | undefined {
  return [...code.classList]
    .find((value) => value.startsWith('language-'))
    ?.slice('language-'.length)
}

function isMermaidBlock(code: Element): boolean {
  return getCodeLanguage(code) === 'mermaid'
}
