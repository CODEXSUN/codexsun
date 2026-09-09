import { EditorContent, useEditor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import type { Document } from '@codexsun/docs-contracts'
import { ArrowLeft, Bold, Code2, FilePenLine, Italic, List, Redo2, Save, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Button } from '@codexsun/ui/components/button'
import { cn } from '@codexsun/ui/lib/utils'

type EditorMode = 'markdown' | 'write'

export function DocsLibraryEditor({
  document,
  onBack,
  onSave,
}: {
  document: Document
  onBack: () => void
  onSave: (input: { source: string; sourceHash: string; title?: string }) => Promise<void>
}) {
  const [mode, setMode] = useState<EditorMode>('write')
  const [source, setSource] = useState(document.source)
  const [title, setTitle] = useState(document.title)
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const initialSource = useMemo(() => document.source, [document.source])

  const editor = useEditor({
    content: markdownToHtml(document.source),
    editorProps: {
      attributes: {
        class:
          'min-h-[28rem] px-5 py-5 text-base leading-7 text-foreground outline-none [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-50',
      },
    },
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Write documentation…' })],
    onUpdate: ({ editor: activeEditor }) => setSource(htmlToMarkdown(activeEditor.getHTML())),
  })

  useEffect(() => {
    setSource(document.source)
    setTitle(document.title)
    setError(undefined)
    editor?.commands.setContent(markdownToHtml(document.source), { emitUpdate: false })
  }, [document, editor])

  const changed = source !== initialSource || title.trim() !== document.title

  async function save() {
    if (!changed || saving) return
    setSaving(true)
    setError(undefined)
    try {
      await onSave({
        source,
        sourceHash: document.sourceHash,
        ...(title.trim() !== document.title ? { title: title.trim() } : {}),
      })
      onBack()
    } catch (saveError) {
      setError(toMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex size-full min-h-0 flex-col bg-background">
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Edit document</p>
        </div>
        <Button disabled={!changed || saving} size="sm" onClick={() => void save()}>
          {saving ? <FilePenLine className="animate-pulse" /> : <Save />}
          {saving ? 'Saving' : 'Save'}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-4/5 max-w-[120rem] flex-col gap-6 py-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="document-title">
              Title
            </label>
            <input
              className="h-10 rounded-md border bg-background px-3 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">{document.path}</p>
          </div>

          <div className="flex items-center justify-between gap-3 border-b">
            <div className="flex items-center gap-1" role="tablist" aria-label="Editor mode">
              <EditorModeButton
                active={mode === 'write'}
                icon={FilePenLine}
                onClick={() => setMode('write')}
              >
                Write
              </EditorModeButton>
              <EditorModeButton
                active={mode === 'markdown'}
                icon={Code2}
                onClick={() => setMode('markdown')}
              >
                Markdown
              </EditorModeButton>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:block">
              Markdown is the saved source format
            </span>
          </div>

          {mode === 'write' && editor ? <EditorToolbar editor={editor} /> : null}
          {mode === 'write' && editor ? (
            <div className="overflow-hidden rounded-lg border bg-card">
              <EditorContent editor={editor} />
            </div>
          ) : null}
          {mode === 'markdown' ? (
            <textarea
              aria-label="Markdown source"
              className="min-h-[32rem] w-full resize-y rounded-lg border bg-card p-5 font-mono text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={source}
              onChange={(event) => {
                const nextSource = event.target.value
                setSource(nextSource)
                editor?.commands.setContent(markdownToHtml(nextSource), { emitUpdate: false })
              }}
            />
          ) : null}
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function EditorToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/20 p-1.5">
      <EditorToolbarButton
        active={editor.isActive('bold')}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </EditorToolbarButton>
      <EditorToolbarButton
        active={editor.isActive('italic')}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </EditorToolbarButton>
      <EditorToolbarButton
        active={editor.isActive('bulletList')}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </EditorToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <EditorToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </EditorToolbarButton>
      <EditorToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </EditorToolbarButton>
    </div>
  )
}

function EditorModeButton({
  active,
  children,
  icon: Icon,
  onClick,
}: {
  active: boolean
  children: string
  icon: typeof FilePenLine
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'inline-flex h-9 cursor-pointer items-center gap-2 border-b-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
        active && 'border-foreground text-foreground',
        !active && 'border-transparent',
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4" />
      {children}
    </button>
  )
}

function EditorToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={label}
      className={cn(active && 'bg-muted')}
      disabled={disabled}
      size="icon-sm"
      title={label}
      type="button"
      variant="ghost"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function markdownToHtml(markdown: string): string {
  const blocks = markdown
    .trim()
    .split(/\n{2,}/u)
    .filter(Boolean)
  return blocks
    .map((block) => {
      const heading = block.match(/^(#{1,6})\s+(.+)$/u)
      if (heading)
        return `<h${heading[1]!.length}>${escapeHtml(heading[2]!)}</h${heading[1]!.length}>`
      const code = block.match(/^```(?:[^\n]*)\n([\s\S]*)\n```$/u)
      if (code) return `<pre><code>${escapeHtml(code[1]!)}</code></pre>`
      if (block.split('\n').every((line) => line.startsWith('- '))) {
        return `<ul>${block
          .split('\n')
          .map((line) => `<li>${escapeHtml(line.slice(2))}</li>`)
          .join('')}</ul>`
      }
      return `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`
    })
    .join('')
}

function htmlToMarkdown(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  return [...parsed.body.childNodes]
    .map((node) => markdownNode(node))
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

function markdownNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (!(node instanceof HTMLElement)) return ''
  const content = [...node.childNodes].map(markdownNode).join('')
  if (/^H[1-6]$/u.test(node.tagName)) return `${'#'.repeat(Number(node.tagName[1]))} ${content}`
  if (node.tagName === 'P') return content
  if (node.tagName === 'STRONG' || node.tagName === 'B') return `**${content}**`
  if (node.tagName === 'EM' || node.tagName === 'I') return `*${content}*`
  if (node.tagName === 'CODE' && node.parentElement?.tagName !== 'PRE') return `\`${content}\``
  if (node.tagName === 'PRE') return `\`\`\`\n${node.textContent ?? ''}\n\`\`\``
  if (node.tagName === 'LI') return `- ${content}\n`
  if (node.tagName === 'UL') return content.trimEnd()
  if (node.tagName === 'BR') return '\n'
  return content
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not save this document.'
}
