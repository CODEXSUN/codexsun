import { useEffect, useState } from 'react'
import { CircleAlertIcon, CircleCheckIcon, EyeIcon, FilePenLineIcon, LoaderCircleIcon, MessageSquareIcon, SearchIcon, TerminalIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/collapsible'
import { cn } from '../../lib/utils'

export type ChatRuntimeTraceEvent = {
  message: string
  raw?: string
  type: string
}

export type ChatRuntimeTraceProps = {
  className?: string
  elapsedSeconds: number
  events: readonly ChatRuntimeTraceEvent[]
  isWorking: boolean
}

export function ChatRuntimeTrace({ className, elapsedSeconds, events, isWorking }: ChatRuntimeTraceProps) {
  const [open, setOpen] = useState(isWorking)

  useEffect(() => setOpen(isWorking), [isWorking])

  if (!events.length) return null

  return (
    <Collapsible className={cn("w-full shrink-0 border-y border-border/50", className)} open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group/runtime-trace flex w-full items-center gap-2 py-2 text-left text-xs text-muted-foreground hover:text-foreground">
        <TerminalIcon className="size-3 shrink-0" />
        <span className={isWorking ? 'shimmer shimmer-orange font-medium' : 'font-medium'}>{isWorking ? `Compacting auto · Working for ${elapsedSeconds}s` : `Compacted · Worked for ${elapsedSeconds}s`}</span>
        <span className="ml-auto">{events.length} events</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-2">
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar]:w-1">
          {events.map((event, index) => <TraceEvent key={`${event.raw ?? event.message}-${index}`} event={event} />)}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TraceEvent({ event }: { event: ChatRuntimeTraceEvent }) {
  const [open, setOpen] = useState(false)
  const content = event.raw ?? event.message

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group/runtime-event flex w-full items-center gap-2 rounded-sm px-1 py-1 text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground">
        <EventIcon type={event.type} />
        <span className="truncate">{event.message}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pb-1">
        <pre className="max-h-32 overflow-auto rounded-sm bg-muted/50 p-2 font-mono text-[11px] leading-4 text-foreground [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1">{content}</pre>
      </CollapsibleContent>
    </Collapsible>
  )
}

function EventIcon({ type }: { type: string }) {
  const Icon = type === 'command' ? TerminalIcon : type === 'response' ? MessageSquareIcon : type === 'request' ? SearchIcon : type === 'review' ? EyeIcon : type === 'change' ? FilePenLineIcon : type === 'complete' ? CircleCheckIcon : type === 'error' ? CircleAlertIcon : LoaderCircleIcon
  return <Icon aria-label={type} className={cn('size-3 shrink-0', type === 'processing' && 'animate-spin')} />
}
