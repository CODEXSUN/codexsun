'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

import {
  COLOR_THEME_ATTRIBUTE,
  COLOR_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isColorThemeId,
  type ColorThemeId,
} from './theme-config'

type ColorThemeContextValue = {
  colorTheme: ColorThemeId
  setColorTheme: (theme: ColorThemeId) => void
}

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider> & {
  colorStorageKey?: string
  defaultColorTheme?: ColorThemeId
}

const ColorThemeContext = React.createContext<ColorThemeContextValue | null>(null)

export function ThemeProvider({
  attribute = 'class',
  children,
  colorStorageKey = COLOR_THEME_STORAGE_KEY,
  defaultColorTheme = 'neutral',
  defaultTheme = 'system',
  disableTransitionOnChange = true,
  enableSystem = true,
  storageKey = THEME_STORAGE_KEY,
  ...props
}: ThemeProviderProps) {
  const [colorTheme, setColorThemeState] = React.useState<ColorThemeId>(() =>
    readColorTheme(colorStorageKey, defaultColorTheme),
  )

  const setColorTheme = React.useCallback(
    (theme: ColorThemeId) => {
      setColorThemeState(theme)
      writeColorTheme(colorStorageKey, theme)
    },
    [colorStorageKey],
  )

  React.useEffect(() => {
    document.documentElement.setAttribute(COLOR_THEME_ATTRIBUTE, colorTheme)
  }, [colorTheme])

  React.useEffect(() => {
    function syncColorTheme(event: StorageEvent) {
      if (event.key !== colorStorageKey) return
      setColorThemeState(isColorThemeId(event.newValue) ? event.newValue : defaultColorTheme)
    }

    window.addEventListener('storage', syncColorTheme)
    return () => window.removeEventListener('storage', syncColorTheme)
  }, [colorStorageKey, defaultColorTheme])

  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      disableTransitionOnChange={disableTransitionOnChange}
      enableSystem={enableSystem}
      storageKey={storageKey}
      {...props}
    >
      <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
        {children}
      </ColorThemeContext.Provider>
    </NextThemesProvider>
  )
}

export function useColorTheme(): ColorThemeContextValue {
  const context = React.useContext(ColorThemeContext)
  if (!context) throw new Error('useColorTheme must be used inside ThemeProvider.')
  return context
}

function readColorTheme(storageKey: string, fallback: ColorThemeId): ColorThemeId {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(storageKey)
    return isColorThemeId(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

function writeColorTheme(storageKey: string, theme: ColorThemeId) {
  try {
    window.localStorage.setItem(storageKey, theme)
  } catch {
    // The active session still keeps the selected color when storage is unavailable.
  }
}
