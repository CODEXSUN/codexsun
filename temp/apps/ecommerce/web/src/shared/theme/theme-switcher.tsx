import { Check, MoonStar, Palette, SunMedium } from 'lucide-react'
import { accentOptions, modeOptions } from '@/lib/site'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useThemeSettings } from '@framework-core/web/theme/theme-provider'

export function ThemeSwitcher() {
  const { accent, mode, resolvedMode, setAccent, setMode } = useThemeSettings()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-border/70 bg-card/80 backdrop-blur"
          aria-label="Open theme controls"
        >
          {resolvedMode === 'dark' ? (
            <MoonStar className="size-4" />
          ) : (
            <SunMedium className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        {modeOptions.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => setMode(option.value)}>
            <span>{option.label}</span>
            {mode === option.value ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="size-4" />
          Accent
        </DropdownMenuLabel>
        {accentOptions.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => setAccent(option.value)}>
            <span>{option.label}</span>
            {accent === option.value ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
