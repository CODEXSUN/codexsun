import { Bell, ChevronDown, Home } from "lucide-react"
import { Link } from "react-router-dom"

import { ThemeToggle } from "@/components/ux/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"

function formatDateTime(value: string) {
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedValue)
}

export function AppHeader() {
  const {
    apps,
    currentApp,
    goToNotification,
    links,
    locationMeta,
    logout,
    markAllNotificationsRead,
    notifications,
    unreadCount,
  } = useDashboardShell()

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="hidden h-5 md:block" />
          <div className="flex min-w-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  {currentApp ? (
                    <currentApp.icon className="size-4" />
                  ) : (
                    <Home className="size-4" />
                  )}
                  <span className="truncate">{currentApp?.name ?? "Framework"}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Switch app</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={links.dashboard} className="flex items-center gap-2">
                    <Home className="size-4" />
                    <span className="flex-1">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                {apps.map((app) => (
                  <DropdownMenuItem key={app.id} asChild>
                    <Link to={app.route} className="flex items-center gap-2">
                      <app.icon className="size-4" />
                      <span className="flex-1">{app.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">/</span>
            <h1 className="truncate text-lg font-semibold text-foreground">
              {locationMeta.title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[24rem]">
              <DropdownMenuLabel className="flex items-center justify-between gap-3">
                <span>Notifications</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No actionable notifications right now.
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="items-start"
                    onSelect={() => {
                      goToNotification(notification.id)
                    }}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div
                        className={`mt-1.5 size-2 rounded-full ${
                          notification.isRead
                            ? "bg-muted-foreground/30"
                            : "bg-foreground"
                        }`}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-1 font-medium text-foreground">
                            {notification.title}
                          </p>
                          {!notification.isRead ? (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" asChild>
            <Link to={links.home}>Home</Link>
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
