import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select'
import { Separator } from '../../components/separator'
import { Button } from '../../components/button'
import { RefreshCwIcon } from 'lucide-react'

export type ChatRuntimeControlsProps = {
  connected: boolean
  message: string
  model: string
  models: readonly string[]
  onModelChange: (value: string) => void
  onProviderChange: (value: string) => void
  onReasoningChange: (value: string) => void
  onReconnect: () => void
  provider: string
  providers: readonly string[]
  reasoning: string
  reasoningLevels: readonly string[]
}

export function ChatRuntimeControls({
  connected,
  message,
  model,
  models,
  onModelChange,
  onProviderChange,
  onReasoningChange,
  onReconnect,
  provider,
  providers,
  reasoning,
  reasoningLevels,
}: ChatRuntimeControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <RuntimeSelect ariaLabel="Provider" disabled={!connected} items={providers} onValueChange={onProviderChange} value={provider} />
      <Separator className="-mx-1 h-4 bg-muted-foreground/40" orientation="vertical" />
      <RuntimeSelect ariaLabel="Model" disabled={!connected} items={models} onValueChange={onModelChange} value={model} />
      <Separator className="-mx-1 h-4 bg-muted-foreground/40" orientation="vertical" />
      <RuntimeSelect ariaLabel="Reasoning" disabled={!connected} items={reasoningLevels} onValueChange={onReasoningChange} value={reasoning} />
      {connected ? <span aria-label="Connected to local Codex" className="size-2.5 rounded-full bg-green-500 shadow-[0_0_9px_2px_rgb(34_197_94_/_0.7)]" role="status" title={message} /> : <Button aria-label="Reconnect to local Codex" className="h-7 gap-1 rounded-sm px-2 text-xs" size="sm" variant="outline" onClick={onReconnect}><RefreshCwIcon className="size-3" />Reconnect</Button>}
    </div>
  )
}

function RuntimeSelect({ ariaLabel, disabled, items, onValueChange, value }: { ariaLabel: string; disabled: boolean; items: readonly string[]; onValueChange: (value: string) => void; value: string }) {
  return (
    <Select disabled={disabled} onValueChange={(nextValue) => { if (nextValue) onValueChange(nextValue) }} value={value}>
      <SelectTrigger aria-label={ariaLabel} className="max-w-32 rounded-sm border-transparent bg-transparent px-2 hover:bg-accent" size="sm"><SelectValue /></SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="rounded-sm" side="bottom" sideOffset={6}>
        {items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
