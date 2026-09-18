import { Badge } from '../../components/badge'
import { Separator } from '../../components/separator'

export type ChatResponseProgressProps = {
  elapsedSeconds: number
  label?: string
  tone?: 'default' | 'orange'
}

export type ChatDateDividerProps = {
  label: string
}

export function ChatDateDivider({ label }: ChatDateDividerProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Separator className="w-auto flex-1 basis-0 border-t border-muted-foreground/35 bg-transparent" />
      <Badge className="rounded-sm px-2 text-muted-foreground" variant="outline">{label}</Badge>
      <Separator className="w-auto flex-1 basis-0 border-t border-muted-foreground/35 bg-transparent" />
    </div>
  )
}

export function ChatResponseProgress({ elapsedSeconds, label = 'Working', tone = 'default' }: ChatResponseProgressProps) {
  return (
    <div aria-live="polite" className="py-0 text-left">
      <span className={`shimmer text-xs font-medium ${tone === 'orange' ? 'shimmer-orange' : ''}`}>{label} for {elapsedSeconds}s</span>
    </div>
  )
}

export function ChatTurnDivider() {
  return <Separator className="w-full border-t border-muted-foreground/20 bg-transparent" />
}
