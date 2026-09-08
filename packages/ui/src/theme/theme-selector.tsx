'use client'

import { LaptopIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '../lib/utils'
import { colorThemes, isThemeMode, themeModes, type ThemeMode } from './theme-config'
import { useColorTheme } from './theme-provider'

const modeIcons: Record<ThemeMode, LucideIcon> = {
  dark: MoonIcon,
  light: SunIcon,
  system: LaptopIcon,
}

export function ThemeSelector({ className }: { className?: string }) {
  const { colorTheme, setColorTheme } = useColorTheme()
  const { setTheme, theme } = useTheme()
  const activeMode = isThemeMode(theme) ? theme : 'system'

  return (
    <div className={cn('grid gap-4', className)}>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Mode</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {themeModes.map((mode) => {
            const Icon = modeIcons[mode.id]
            const active = activeMode === mode.id
            return (
              <button
                aria-pressed={active}
                className={cn(
                  'flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={mode.id}
                onClick={() => setTheme(mode.id)}
                type="button"
              >
                <Icon className="size-3.5" />
                <span>{mode.name}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Color</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {colorThemes.map((color) => {
            const active = colorTheme === color.id
            return (
              <button
                aria-label={`${color.name} color theme`}
                aria-pressed={active}
                className={cn(
                  'grid size-9 place-items-center rounded-lg border bg-background transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active && 'border-primary ring-2 ring-primary/25',
                )}
                key={color.id}
                onClick={() => setColorTheme(color.id)}
                title={color.name}
                type="button"
              >
                <span className={cn('size-4 rounded-full', color.swatchClassName)} />
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
