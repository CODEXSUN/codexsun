"use client"

import type { SystemVersion } from '@shared/index'
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  RefreshCcw,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { buildAdminPortalPath } from '@framework-core/web/auth/lib/portal-routing'

function toInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CN'
}

export function NavUser({
  user,
  onLogout,
  systemVersion,
  showAdminLinks,
}: {
  user: {
    name: string
    email: string
    avatar: string | null
    actorType: string
  }
  onLogout: () => void
  systemVersion: SystemVersion | null
  showAdminLinks: boolean
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar ?? ''} alt={user.name} />
                <AvatarFallback className="rounded-lg">{toInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar ?? ''} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{toInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                  <span className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {user.actorType}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            {systemVersion ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="space-y-1 normal-case tracking-normal">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">App</span>
                    <span className="font-medium text-foreground">v{systemVersion.application.version}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Database</span>
                    <span className="font-medium text-foreground">
                      {systemVersion.database.currentVersionId ?? 'not-ready'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {systemVersion.database.pendingMigrations === 0
                      ? 'Schema current'
                      : `${systemVersion.database.pendingMigrations} pending migration(s)`}
                  </div>
                </DropdownMenuLabel>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to={buildAdminPortalPath('/system-update')}>
                  <BadgeCheck className="size-4" />
                  Version status
                </Link>
              </DropdownMenuItem>
              {showAdminLinks ? (
                <DropdownMenuItem asChild>
                  <Link to={buildAdminPortalPath('/system-update')}>
                    <RefreshCcw className="size-4" />
                    System update
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {showAdminLinks ? (
                <DropdownMenuItem asChild>
                  <Link to={buildAdminPortalPath('/settings')}>
                    <Sparkles className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {showAdminLinks ? (
                <DropdownMenuItem asChild>
                  <Link to={buildAdminPortalPath('/settings')}>
                    <Settings2 className="size-4" />
                    Update source
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
