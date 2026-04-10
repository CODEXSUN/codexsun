import { Check, MoonStar, SunMedium } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ThemeMode = "light" | "dark" | "system"
type AccentTheme = "neutral" | "orange" | "blue" | "green" | "purple"

const appearanceModes: ThemeMode[] = ["light", "dark", "system"]
const accentThemes: AccentTheme[] = ["neutral", "orange", "blue", "green", "purple"]

function getPreferredThemeMode() {
  if (typeof window === "undefined") {
    return "system"
  }

  const storedTheme = window.localStorage.getItem("codexsun-theme-mode")

  if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system") {
    return storedTheme
  }

  return "system"
}

function getPreferredAccentTheme() {
  if (typeof window === "undefined") {
    return "neutral"
  }

  const storedAccent = window.localStorage.getItem("codexsun-theme-accent")

  if (
    storedAccent === "neutral" ||
    storedAccent === "orange" ||
    storedAccent === "blue" ||
    storedAccent === "green" ||
    storedAccent === "purple"
  ) {
    return storedAccent
  }

  return "neutral"
}

function resolveDarkMode(mode: ThemeMode) {
  if (mode === "dark") {
    return true
  }

  if (mode === "light") {
    return false
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyTheme(mode: ThemeMode, accent: AccentTheme) {
  const isDarkMode = resolveDarkMode(mode)

  document.documentElement.classList.toggle("dark", isDarkMode)
  document.documentElement.dataset.accent = accent
}

export function StorefrontThemeMenu() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system")
  const [accentTheme, setAccentTheme] = useState<AccentTheme>("neutral")

  useEffect(() => {
    const preferredThemeMode = getPreferredThemeMode()
    const preferredAccentTheme = getPreferredAccentTheme()

    setThemeMode(preferredThemeMode)
    setAccentTheme(preferredAccentTheme)
    applyTheme(preferredThemeMode, preferredAccentTheme)
  }, [])

  useEffect(() => {
    if (themeMode !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => {
      applyTheme("system", accentTheme)
    }

    mediaQuery.addEventListener("change", sync)

    return () => {
      mediaQuery.removeEventListener("change", sync)
    }
  }, [accentTheme, themeMode])

  function setAppearanceMode(mode: ThemeMode) {
    setThemeMode(mode)
    window.localStorage.setItem("codexsun-theme-mode", mode)
    applyTheme(mode, accentTheme)
  }

  function setAccentMode(accent: AccentTheme) {
    setAccentTheme(accent)
    window.localStorage.setItem("codexsun-theme-accent", accent)
    applyTheme(themeMode, accent)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-full border-[#ddd4c9] bg-white/88 text-[#2b241f] shadow-[0_16px_30px_-24px_rgba(58,34,18,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.06] hover:border-[#111111] hover:bg-[#111111] hover:text-white active:scale-[0.97] data-[state=open]:border-[#111111] data-[state=open]:bg-[#111111] data-[state=open]:text-white"
        >
          {themeMode === "dark" ? <MoonStar className="size-5" /> : <SunMedium className="size-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-[1.35rem] border-[#e2ddd6] bg-white p-0 shadow-[0_22px_44px_-26px_rgba(44,26,14,0.35)]"
      >
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#241913]">Appearance</p>
        </div>
        <div className="pb-2">
          {appearanceModes.map((mode) => (
            <DropdownMenuItem
              key={mode}
              className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
              onSelect={() => {
                setAppearanceMode(mode)
              }}
            >
              <span className="capitalize">{mode}</span>
              {themeMode === mode ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="mx-0 my-0 bg-[#ece6df]" />
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#241913]">Accent</p>
        </div>
        <div className="pb-2">
          {accentThemes.map((accent) => (
            <DropdownMenuItem
              key={accent}
              className="mx-2 rounded-xl px-3 py-3 text-[15px] text-[#241913] focus:bg-[#f6efe8] focus:text-[#8b5e34]"
              onSelect={() => {
                setAccentMode(accent)
              }}
            >
              <span className="capitalize">{accent}</span>
              {accentTheme === accent ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
