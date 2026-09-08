import { BellIcon, XIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { Button } from '@codexsun/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@codexsun/ui/components/popover'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker } from '../../features/interface-topology'

import { useMdiTopology } from './mdi-topology'
import type { MdiNotification } from './mdi-types'

export function MdiNotificationsMenu({
  count,
  notifications,
}: {
  count: number
  notifications: readonly MdiNotification[]
}) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const topology = useMdiTopology()
  const unreadCount =
    notifications.length > 0
      ? notifications.filter((notification) => !notification.read).length
      : count

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            className={cn(
              'relative size-10 p-0 text-foreground',
              topology.highlightClassName('01.4.1'),
            )}
            size="icon"
            variant="ghost"
            {...topology.regionProps('01.4.1')}
          />
        }
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 ? <UnreadIndicator reduceMotion={Boolean(reduceMotion)} /> : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          'w-88 gap-0 overflow-hidden rounded-3xl p-0',
          topology.highlightClassName('01.4.2'),
        )}
        sideOffset={9}
        {...topology.regionProps('01.4.2')}
      >
        <TopologyMarker id="01.4.2" topology={topology} />
        <header className="flex items-center gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
          <Button
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </header>
        <div
          className={cn('max-h-80 overflow-y-auto p-2', topology.highlightClassName('01.4.3'))}
          {...topology.regionProps('01.4.3')}
        >
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClose={() => setOpen(false)}
              />
            ))
          ) : (
            <div className="px-3 py-8 text-center">
              <BellIcon className="mx-auto size-5 text-muted-foreground" />
              <p className="pt-3 text-sm font-medium">
                {unreadCount > 0 ? 'A workspace update is ready' : 'No new notifications'}
              </p>
              <p className="pt-1 text-sm text-muted-foreground">
                {unreadCount > 0
                  ? 'Open the active workspace to review it.'
                  : 'New activity will appear here.'}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function UnreadIndicator({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <span className="absolute top-1.5 right-1.5 grid size-2 place-items-center" aria-hidden="true">
      {!reduceMotion ? (
        <>
          <motion.span
            animate={{ opacity: [0, 0.45, 0.16, 0], scale: [0.75, 1, 1.9, 2.5] }}
            className="absolute size-2 rounded-full border border-red-500"
            transition={{
              duration: 2.4,
              ease: [0.16, 1, 0.3, 1],
              repeat: Infinity,
              repeatDelay: 0.15,
              times: [0, 0.14, 0.72, 1],
            }}
          />
          <motion.span
            animate={{ opacity: [1, 0.78, 1], scale: [1, 1.18, 1] }}
            className="relative size-2 rounded-full border border-background bg-red-500"
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
          />
        </>
      ) : (
        <span className="relative size-2 rounded-full border border-background bg-red-500" />
      )}
    </span>
  )
}

function NotificationRow({
  notification,
  onClose,
}: {
  notification: MdiNotification
  onClose: () => void
}) {
  return (
    <button
      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => {
        notification.onSelect?.()
        onClose()
      }}
      type="button"
    >
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          notification.read ? 'bg-muted-foreground/30' : 'bg-red-500',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{notification.title}</span>
        {notification.description ? (
          <span className="block pt-1 text-sm leading-5 text-muted-foreground">
            {notification.description}
          </span>
        ) : null}
      </span>
      {notification.time ? (
        <span className="shrink-0 text-xs text-muted-foreground">{notification.time}</span>
      ) : null}
    </button>
  )
}
