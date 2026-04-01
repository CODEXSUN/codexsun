import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { AccentTheme, ColorMode } from './theme-contract'

const MODE_STORAGE_KEY = 'codexsun-color-mode'
const ACCENT_STORAGE_KEY = 'codexsun-accent-theme'

interface ThemeContextValue {
  mode: ColorMode
  resolvedMode: Exclude<ColorMode, 'system'>
  accent: AccentTheme
  setMode: (mode: ColorMode) => void
  setAccent: (accent: AccentTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredMode(): ColorMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedValue = window.localStorage.getItem(MODE_STORAGE_KEY)
  if (storedValue === 'light' || storedValue === 'dark' || storedValue === 'system') {
    return storedValue
  }

  return 'system'
}

function getStoredAccent(): AccentTheme {
  if (typeof window === 'undefined') {
    return 'neutral'
  }

  const storedValue = window.localStorage.getItem(ACCENT_STORAGE_KEY)
  if (
    storedValue === 'neutral' ||
    storedValue === 'orange' ||
    storedValue === 'blue' ||
    storedValue === 'purple'
  ) {
    return storedValue
  }

  return 'neutral'
}

function getSystemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ColorMode>(() => getStoredMode())
  const [accent, setAccent] = useState<AccentTheme>(() => getStoredAccent())
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(() => getSystemMode())

  const resolvedMode = mode === 'system' ? systemMode : mode

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateMode = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', updateMode)

    return () => mediaQuery.removeEventListener('change', updateMode)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode)
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent)

    const root = document.documentElement
    root.dataset.mode = resolvedMode
    root.dataset.theme = accent
    root.dataset.accent = accent
    root.style.colorScheme = resolvedMode
  }, [accent, mode, resolvedMode])

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      accent,
      setMode,
      setAccent,
    }),
    [accent, mode, resolvedMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeSettings() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeSettings must be used within ThemeProvider')
  }

  return context
}
