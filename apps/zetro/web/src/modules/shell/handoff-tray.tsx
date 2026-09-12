import { Button } from '@codexsun/ui/components/button'
import { Layers3, Send, Sparkles, X } from 'lucide-react'
import type { ChatHandoffItem } from '@codexsun/zetro-contracts'

export function HandoffTrayButton({ count, onClick }: { count: number; onClick(): void }) {
  return (
    <Button
      aria-label={`Open Handoff Tray, ${count} selected`}
      className="relative mr-2 cursor-pointer"
      onClick={onClick}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <Layers3 />
      {count ? (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Button>
  )
}

export function HandoffTray({
  items,
  onClose,
  onHandOff,
  onRemove,
  onReview,
  open,
}: {
  items: ChatHandoffItem[]
  onClose(): void
  onHandOff(): void
  onRemove(item: ChatHandoffItem): void
  onReview(): void
  open: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="presentation">
      <aside
        aria-label="Handoff Tray"
        className="flex h-full w-full max-w-md flex-col border-l bg-background shadow-xl"
        role="dialog"
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Handoff Tray</p>
            <p className="text-xs text-muted-foreground">{items.length} selected response{items.length === 1 ? '' : 's'}</p>
          </div>
          <Button aria-label="Close Handoff Tray" onClick={onClose} size="icon-sm" type="button" variant="ghost"><X /></Button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length ? <div className="grid gap-3">{items.map((item) => <article className="rounded-lg border p-3" key={item.turnId}><div className="flex gap-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.conversationTitle}</p><p className="mt-1 line-clamp-4 text-xs leading-5 text-muted-foreground">{item.response}</p></div><Button aria-label={`Remove ${item.conversationTitle}`} onClick={() => onRemove(item)} size="icon-xs" type="button" variant="ghost"><X /></Button></div></article>)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">Add completed responses from any chat to prepare one refined task.</p>}
        </div>
        <footer className="grid gap-2 border-t p-4">
          <Button disabled={!items.length} onClick={onReview} type="button" variant="outline"><Sparkles />Review in chat</Button>
          <Button disabled={!items.length} onClick={onHandOff} type="button"><Send />Hand off to Task</Button>
        </footer>
      </aside>
    </div>
  )
}
