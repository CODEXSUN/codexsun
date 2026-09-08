import { LogOutIcon, UserRoundIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback } from '@codexsun/ui/components/avatar'
import { Button } from '@codexsun/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@codexsun/ui/components/popover'

import type { MdiUser } from './mdi-types'

export function MdiProfileMenu({ user }: { user: MdiUser }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full bg-background p-0.5 shadow-sm"
            aria-label="Open profile"
          />
        }
      >
        <Avatar className="size-full">
          <AvatarFallback className="text-sm font-medium text-foreground">
            {user.initials}
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={9} className="w-[352px] gap-4 rounded-3xl p-3">
        <div className="flex items-center justify-end">
          <span className="mr-auto truncate pl-3 text-sm text-muted-foreground">
            {user.email ?? 'Local account'}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
            <XIcon />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 px-3">
          <Avatar className="size-20 border-4 border-background ring-2 ring-border">
            <AvatarFallback className="text-2xl text-foreground">{user.initials}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">Hi, {user.name}!</h2>
          <Button variant="outline" className="rounded-full px-5" onClick={user.onManageProfile}>
            <UserRoundIcon />
            Manage your profile
          </Button>
        </div>
        <Button
          variant="outline"
          className="h-12 justify-start rounded-xl px-4"
          onClick={user.onSignOut}
        >
          <LogOutIcon />
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  )
}
