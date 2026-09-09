import { BellIcon, CheckCheckIcon } from 'lucide-react'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'

export type NotificationCenterItem = {
  description: string
  id: string
  read?: boolean
  time: string
  title: string
  onSelect?: () => void
}

export function NotificationCenterPage({
  embedded = false,
  items,
  onMarkAllRead,
}: {
  embedded?: boolean
  items: readonly NotificationCenterItem[]
  onMarkAllRead?: () => void
}) {
  const unreadCount = items.filter(({ read }) => !read).length

  return (
    <main className={cn('bg-background px-6 py-10', embedded ? 'min-h-[620px]' : 'min-h-screen')}>
      <div className="mx-auto grid w-full max-w-3xl gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <BellIcon className="size-5" />
              <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
              {unreadCount > 0 ? <Badge>{unreadCount} new</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Review activity from your connected CODEXSUN applications.
            </p>
          </div>
          <Button onClick={onMarkAllRead} variant="outline">
            <CheckCheckIcon /> Mark all as read
          </Button>
        </header>

        <section className="divide-y" aria-label="Recent notifications">
          {items.map((item) => (
            <button
              className="flex w-full cursor-pointer items-start gap-4 px-2 py-5 text-left transition-colors hover:bg-muted/50"
              key={item.id}
              onClick={item.onSelect}
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-2 size-2 shrink-0 rounded-full',
                  item.read ? 'bg-muted' : 'bg-primary',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">{item.time}</span>
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}
