import { Button } from '@codexsun/ui/components/button'
import { NativeSelect, NativeSelectOption } from '@codexsun/ui/components/native-select'
import { Layers3, Send, Sparkles, X } from 'lucide-react'
import type { ChatHandoffItem, ChatWorkingSetCategory } from '@codexsun/zetro-contracts'

export function HandoffTrayButton({ count, onClick }: { count: number; onClick(): void }) {
  return (
    <Button
      aria-label={`Open Working Set, ${count} selected`}
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
  onClear,
  onHandOff,
  onRemove,
  onReview,
  onUpdate,
  open,
}: {
  items: ChatHandoffItem[]
  onClose(): void
  onClear(): void
  onHandOff(): void
  onRemove(item: ChatHandoffItem): void
  onReview(): void
  onUpdate(item: ChatHandoffItem, category: ChatWorkingSetCategory): void
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
            <p className="text-sm font-semibold">Working set</p>
            <p className="text-xs text-muted-foreground">{items.length} selected evidence item{items.length === 1 ? '' : 's'}</p>
          </div>
          <Button aria-label="Close Working Set" onClick={onClose} size="icon-sm" type="button" variant="ghost"><X /></Button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length ? <div className="grid gap-3">{items.map((item) => <article className="rounded-lg border p-3" key={item.id}><div className="flex gap-2"><Button aria-label={`Leave off ${item.conversationTitle}`} className="mt-0.5 shrink-0" onClick={() => onRemove(item)} size="icon-xs" title="Leave off this item" type="button" variant="ghost"><X /></Button><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium">{item.conversationTitle}</p><span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{item.sourceKind}</span></div><NativeSelect aria-label={`Category for ${item.conversationTitle}`} className="mt-2 h-8 text-xs" disabled={item.sourceKind === 'decision'} onChange={(event) => onUpdate(item, event.target.value as ChatWorkingSetCategory)} value={item.category}><NativeSelectOption value="idea">Idea</NativeSelectOption><NativeSelectOption value="requirement">Requirement</NativeSelectOption><NativeSelectOption value="decision">Decision</NativeSelectOption><NativeSelectOption value="visual-reference">Visual reference</NativeSelectOption><NativeSelectOption value="reference">Reference</NativeSelectOption></NativeSelect><p className="mt-2 line-clamp-4 text-xs leading-5 text-muted-foreground">{item.content}</p></div></div></article>)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">Add prompts or completed responses from any chat. Classify each item before consolidating.</p>}
        </div>
        <footer className="grid grid-cols-3 gap-2 border-t p-4">
          <Button aria-label="Clear the complete Working Set" disabled={!items.length} onClick={onClear} size="sm" title="Remove every selected item" type="button" variant="ghost"><X />Clear all</Button>
          <Button aria-label="Review and consolidate the selected Working Set" disabled={!items.length} onClick={onReview} size="sm" title="Review and consolidate" type="button" variant="outline"><Sparkles />Review</Button>
          <Button aria-label="Create a task draft from the selected Working Set" disabled={!items.length} onClick={onHandOff} size="sm" title="Create task draft" type="button"><Send />Task draft</Button>
        </footer>
      </aside>
    </div>
  )
}
