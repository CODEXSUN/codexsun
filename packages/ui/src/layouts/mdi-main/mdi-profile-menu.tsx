import {
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserRoundIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@codexsun/ui/components/avatar'
import { Button } from '@codexsun/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@codexsun/ui/components/popover'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker } from '../../features/interface-topology'
import { isThemeMode, useTheme, type ThemeMode } from '../../theme'

import { mdiTopMenuButtonClassName } from './mdi-top-menu-control'
import { useMdiTopology } from './mdi-topology'
import type { MdiUser } from './mdi-types'

export function MdiProfileMenu({ user }: { user: MdiUser }) {
  const [open, setOpen] = useState(false)
  const topology = useMdiTopology()
  const fallback = user.name.trim().charAt(0).toUpperCase() || user.initials.charAt(0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn(
              mdiTopMenuButtonClassName,
              'p-0.5',
              topology.highlightClassName('01.6.1'),
            )}
            aria-label="Open profile"
            {...topology.regionProps('01.6.1')}
          />
        }
      >
        <Avatar className="size-full">
          {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
          <AvatarFallback className="bg-foreground/10 text-sm font-medium text-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={9}
        className={cn('w-88 gap-4 rounded-3xl p-3', topology.highlightClassName('01.6.2'))}
        {...topology.regionProps('01.6.2')}
      >
        <TopologyMarker id="01.6.2" topology={topology} />
        <div className="flex items-center justify-end">
          <span className="mr-auto truncate pl-3 text-sm text-muted-foreground">
            {user.email ?? 'Local account'}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
            <XIcon />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 px-3">
          <div className="grid w-full grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
            <ProfileThemeToggle />
            <Avatar
              className={cn(
                'size-20 justify-self-center border-4 border-background ring-2 ring-border',
                topology.highlightClassName('01.6.3'),
              )}
              {...topology.regionProps('01.6.3')}
            >
              {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
              <AvatarFallback className="bg-foreground/10 text-2xl text-foreground">
                {fallback}
              </AvatarFallback>
            </Avatar>
            <span aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold">Hi, {user.name}!</h2>
          <Button variant="outline" className="rounded-full px-5" onClick={user.onManageProfile}>
            <UserRoundIcon />
            Manage your profile
          </Button>
        </div>
        <div
          className={cn('grid gap-2', topology.highlightClassName('01.6.4'))}
          {...topology.regionProps('01.6.4')}
        >
          <Button
            variant="outline"
            className="h-12 justify-start rounded-xl px-4"
            onClick={user.onSignOut}
          >
            <LogOutIcon />
            Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const themeModeIcons: Record<ThemeMode, LucideIcon> = {
  dark: MoonIcon,
  light: SunIcon,
  system: LaptopIcon,
}

const nextThemeMode: Record<ThemeMode, ThemeMode> = {
  dark: 'system',
  light: 'dark',
  system: 'light',
}

function ProfileThemeToggle() {
  const { setTheme, theme } = useTheme()
  const topology = useMdiTopology()
  const activeMode = isThemeMode(theme) ? theme : 'system'
  const nextMode = nextThemeMode[activeMode]
  const Icon = themeModeIcons[activeMode]
  const label = `Theme: ${toThemeLabel(activeMode)}. Switch to ${toThemeLabel(nextMode)}`

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(mdiTopMenuButtonClassName, topology.highlightClassName('01.6.5'))}
      onClick={() => setTheme(nextMode)}
      aria-label={label}
      title={label}
      {...topology.regionProps('01.6.5')}
    >
      <Icon />
    </Button>
  )
}

function toThemeLabel(mode: ThemeMode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}
