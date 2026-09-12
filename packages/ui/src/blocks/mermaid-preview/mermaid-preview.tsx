import { Download, Minus, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Button } from '../../components/button'
import { Textarea } from '../../components/textarea'

type MermaidRuntime = {
  initialize: (config: Record<string, unknown>) => void
  render: (id: string, source: string) => Promise<{ svg: string }>
}

declare global {
  interface Window {
    mermaid?: MermaidRuntime
  }
}

let runtimePromise: Promise<MermaidRuntime> | undefined

function loadRuntime(scriptUrl: string) {
  runtimePromise ??= new Promise<MermaidRuntime>((resolve, reject) => {
    const existing = window.mermaid
    if (existing) {
      resolve(existing)
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => window.mermaid ? resolve(window.mermaid) : reject(new Error('Mermaid did not load.'))
    script.onerror = () => reject(new Error('Mermaid could not load.'))
    document.head.append(script)
  })
  return runtimePromise
}

export function MermaidPreview({ interactive = false, scriptUrl = '/vendor/mermaid.min.js', source }: { interactive?: boolean; scriptUrl?: string; source: string }) {
  const id = useId().replace(/:/g, '-')
  const [draft, setDraft] = useState(source)
  const [editing, setEditing] = useState(false)
  const [result, setResult] = useState<{ error?: string; svg?: string }>({})
  const [zoom, setZoom] = useState(1)

  useEffect(() => setDraft(source), [source])

  useEffect(() => {
    const value = draft.trim()
    if (!value) {
      setResult({})
      return
    }
    let active = true
    void loadRuntime(scriptUrl)
      .then((runtime) => {
        runtime.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
        return runtime.render(`mermaid-${id}`, value)
      })
      .then(({ svg }) => active && setResult({ svg }))
      .catch(() => active && setResult({ error: 'Mermaid could not render this diagram.' }))
    return () => {
      active = false
    }
  }, [draft, id, scriptUrl])

  if (!draft.trim()) return null
  if (result.error) return <p className="text-sm text-destructive">{result.error}</p>
  if (!result.svg) return <p className="text-sm text-muted-foreground">Rendering diagram…</p>
  return <section aria-label="Mermaid diagram" className="group/mermaid relative space-y-3 rounded-lg border bg-muted/20 p-3">
    {interactive ? <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-md border bg-background/95 p-1 opacity-0 shadow-sm transition-opacity group-focus-within/mermaid:opacity-100 group-hover/mermaid:opacity-100">
      <Button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} size="icon-xs" type="button" variant="ghost"><Minus /></Button>
      <Button aria-label="Reset diagram zoom" onClick={() => setZoom(1)} size="icon-xs" type="button" variant="ghost"><RotateCcw /></Button>
      <Button aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + 0.25))} size="icon-xs" type="button" variant="ghost"><Plus /></Button>
      <Button aria-label="Download diagram as PNG" onClick={() => void downloadPng(result.svg!, id)} size="icon-xs" type="button" variant="ghost"><Download /></Button>
      <Button aria-label="Open Mermaid editor" onClick={() => setEditing((value) => !value)} size="icon-xs" type="button" variant="ghost"><Pencil /></Button>
    </div> : null}
    {editing ? <div className="space-y-2"><p className="text-xs text-muted-foreground">Local draft. The saved chat response is unchanged.</p><Textarea aria-label="Mermaid source editor" className="min-h-36 font-mono text-xs" onChange={(event) => setDraft(event.target.value)} value={draft} /></div> : null}
    <div className="overflow-auto rounded-md" style={{ maxHeight: interactive ? '34rem' : undefined }}><div className="min-w-max origin-top-left" style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }} dangerouslySetInnerHTML={{ __html: result.svg }} /></div>
  </section>
}

async function downloadPng(svg: string, id: string) {
  const sourceUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('The diagram could not be exported.')); image.src = sourceUrl })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, image.width * 2); canvas.height = Math.max(1, image.height * 2)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('The diagram could not be exported.')
    context.scale(2, 2); context.drawImage(image, 0, 0)
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!png) throw new Error('The diagram could not be exported.')
    const link = document.createElement('a'); link.download = `mermaid-${id}.png`; link.href = URL.createObjectURL(png); link.click(); URL.revokeObjectURL(link.href)
  } finally { URL.revokeObjectURL(sourceUrl) }
}
