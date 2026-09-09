import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/button'

export function UiTemplateCode({
  code,
  copyLabel = 'Copy code',
}: {
  code: string
  copyLabel?: string
}) {
  const [copyState, setCopyState] = useState<'copied' | 'failed' | 'idle'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 4000)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-xs text-zinc-400">tsx</span>
        <Button
          className="text-zinc-300 hover:bg-white/10 hover:text-white"
          onClick={copyCode}
          size="sm"
          variant="ghost"
        >
          {copyState === 'copied' ? <Check /> : <Copy />}
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : copyLabel}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto p-5 text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  )
}
