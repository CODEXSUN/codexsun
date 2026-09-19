'use client'

import * as React from 'react'

import {
  COLOR_THEME_ATTRIBUTE,
  COLOR_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isColorThemeId,
  isThemeMode,
  type ColorThemeId,
  type ThemeMode,
} from './theme-config'

type ColorThemeContextValue = {
  colorTheme: ColorThemeId
  setColorTheme: (theme: ColorThemeId) => void
}

type ThemeContextValue = {
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: ThemeMode) => void
  theme: ThemeMode
}

type ThemeProviderProps = {
  children: React.ReactNode
  colorStorageKey?: string
  defaultColorTheme?: ColorThemeId
  defaultTheme?: ThemeMode
  storageKey?: string
}

const ColorThemeContext = React.createContext<ColorThemeContextValue | null>(null)
const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  colorStorageKey = COLOR_THEME_STORAGE_KEY,
  defaultColorTheme = 'neutral',
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [colorTheme, setColorThemeState] = React.useState<ColorThemeId>(() =>
    readColorTheme(colorStorageKey, defaultColorTheme),
  )
  const [theme, setThemeState] = React.useState<ThemeMode>(() => readTheme(storageKey, defaultTheme))
  const resolvedTheme = resolveTheme(theme)

  const setColorTheme = React.useCallback(
    (nextTheme: ColorThemeId) => {
      setColorThemeState(nextTheme)
      writeStorage(colorStorageKey, nextTheme)
    },
    [colorStorageKey],
  )
  const setTheme = React.useCallback(
    (nextTheme: ThemeMode) => {
      setThemeState(nextTheme)
      writeStorage(storageKey, nextTheme)
    },
    [storageKey],
  )

  React.useEffect(() => {
    document.documentElement.setAttribute(COLOR_THEME_ATTRIBUTE, colorTheme)
  }, [colorTheme])
  React.useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(resolvedTheme)
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])
  React.useEffect(() => subscribeToStorage(colorStorageKey, defaultColorTheme, setColorThemeState), [colorStorageKey, defaultColorTheme])
  React.useEffect(() => subscribeToStorage(storageKey, defaultTheme, setThemeState), [defaultTheme, storageKey])
  React.useEffect(() => subscribeToSystemTheme(theme, setThemeState), [theme])

  return (
    <ThemeContext.Provider value={{ resolvedTheme, setTheme, theme }}>
      <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>{children}</ColorThemeContext.Provider>
    </ThemeContext.Provider>
  )
}

export function useColorTheme(): ColorThemeContextValue {
  const context = React.useContext(ColorThemeContext)
  if (!context) throw new Error('useColorTheme must be used inside ThemeProvider.')
  return context
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.')
  return context
}

function readColorTheme(storageKey: string, fallback: ColorThemeId): ColorThemeId {
  const value = readStorage(storageKey)
  return isColorThemeId(value) ? value : fallback
}

function readTheme(storageKey: string, fallback: ThemeMode): ThemeMode {
  const value = readStorage(storageKey)
  return isThemeMode(value ?? undefined) ? (value as ThemeMode) : fallback
}

function resolveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme !== 'system') return theme
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function subscribeToStorage<T extends string>(storageKey: string, fallback: T, setValue: (value: T) => void) {
  function sync(event: StorageEvent) {
    if (event.key === storageKey) setValue((event.newValue ?? fallback) as T)
  }
  window.addEventListener('storage', sync)
  return () => window.removeEventListener('storage', sync)
}

function subscribeToSystemTheme(theme: ThemeMode, setTheme: (theme: ThemeMode) => void) {
  if (theme !== 'system') return undefined
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const sync = () => setTheme('system')
  media.addEventListener('change', sync)
  return () => media.removeEventListener('change', sync)
}

function readStorage(storageKey: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function writeStorage(storageKey: string, value: string) {
  try {
    window.localStorage.setItem(storageKey, value)
  } catch {
    // Keep the active theme when browser storage is unavailable.
  }
}
