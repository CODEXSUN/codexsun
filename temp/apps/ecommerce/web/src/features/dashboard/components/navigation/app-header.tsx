import type { Notification } from '@shared/index'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronDown, Home, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { frontendTarget } from '@/config/frontend'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { useDesk } from '@/features/framework/desk/desk-provider'
import { ThemeSwitcher } from '@/shared/theme/theme-switcher'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/shared/api/client'

function formatDateTime(value: string) {
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedValue)
}

function getTaskNotificationHref(notification: Notification) {
  if (!notification.taskId) {
    return null
  }

  const searchParams = new URLSearchParams()
  if (notification.type === 'task_review_requested') {
    searchParams.set('tab', 'progress')
  } else if (notification.type === 'task_due_soon' || notification.type === 'task_overdue') {
    searchParams.set('tab', 'details')
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return `/admin/dashboard/task/tasks/${notification.taskId}${suffix}`
}

export function AppHeader() {
  const navigate = useNavigate()
  const { logout, session } = useAuth()
  const { apps, currentApp, locationMeta } = useDesk()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const storefrontAction = frontendTarget === 'shop'
    ? { label: 'Shop', href: '/', icon: Store }
    : { label: 'Home', href: '/', icon: Home }
  const StorefrontIcon = storefrontAction.icon

  useEffect(() => {
    if (!session?.accessToken) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const accessToken = session.accessToken
    let cancelled = false

    async function load() {
      const response = await listNotifications(accessToken).catch(() => null)
      if (!cancelled && response) {
        setNotifications(response.items)
        setUnreadCount(response.unreadCount)
      }
    }

    void load()
    const timer = setInterval(() => {
      void load()
    }, 60_000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [session?.accessToken])

  async function handleNotificationClick(notification: Notification) {
    if (!session?.accessToken) {
      return
    }

    const response = await markNotificationRead(session.accessToken, notification.id).catch(() => null)
    if (response) {
      setNotifications(response.items)
      setUnreadCount(response.unreadCount)
    }

    const taskHref = getTaskNotificationHref(notification)
    if (taskHref) {
      void navigate(taskHref)
    }
  }

  async function handleMarkAllRead() {
    if (!session?.accessToken) {
      return
    }

    const response = await markAllNotificationsRead(session.accessToken).catch(() => null)
    if (response) {
      setNotifications(response.items)
      setUnreadCount(response.unreadCount)
    }
  }

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border/60 px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="hidden h-5 md:block" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  {currentApp ? <currentApp.icon className="size-4" /> : <Home className="size-4" />}
                  <span>{currentApp?.name ?? 'Framework'}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Switch app</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard" className="flex items-center gap-2">
                    <Home className="size-4" />
                    <span className="flex-1">Framework</span>
                    {!currentApp ? <Check className="size-4" /> : null}
                  </Link>
                </DropdownMenuItem>
                {apps.map((app) => (
                  <DropdownMenuItem key={app.id} asChild>
                    <Link to={app.route} className="flex items-center gap-2">
                      <app.icon className="size-4" />
                      <span className="flex-1">{app.name}</span>
                      {currentApp?.id === app.id ? <Check className="size-4" /> : null}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">/</span>
            <h1 className="truncate text-lg font-semibold text-foreground">{locationMeta.title}</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Bell className="size-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[24rem]">
            <DropdownMenuLabel className="flex items-center justify-between gap-3">
              <span>Notifications</span>
              <Button type="button" variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => { void handleMarkAllRead() }}>
                Mark all read
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No actionable notifications right now.</div>
            ) : notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="items-start"
                onSelect={(event) => {
                  event.preventDefault()
                  void handleNotificationClick(notification)
                }}
              >
                <div className="flex w-full items-start gap-3">
                  <div className={`mt-1.5 size-2 rounded-full ${notification.isRead ? 'bg-muted-foreground/30' : 'bg-foreground'}`} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-1 font-medium text-foreground">{notification.title}</p>
                      {!notification.isRead ? <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">New</span> : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" asChild>
          <Link to={storefrontAction.href}>
            <StorefrontIcon className="size-4" />
            {storefrontAction.label}
          </Link>
        </Button>
        <ThemeSwitcher />
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
