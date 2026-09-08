export const themeModes = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'system', name: 'System' },
] as const

export type ThemeMode = (typeof themeModes)[number]['id']

export const colorThemes = [
  { id: 'neutral', name: 'Neutral', swatchClassName: 'bg-zinc-700 dark:bg-zinc-300' },
  { id: 'blue', name: 'Blue', swatchClassName: 'bg-blue-600' },
  { id: 'violet', name: 'Violet', swatchClassName: 'bg-violet-600' },
  { id: 'emerald', name: 'Emerald', swatchClassName: 'bg-emerald-600' },
  { id: 'orange', name: 'Orange', swatchClassName: 'bg-orange-600' },
] as const

export type ColorThemeId = (typeof colorThemes)[number]['id']

export const COLOR_THEME_ATTRIBUTE = 'data-color-theme'
export const COLOR_THEME_STORAGE_KEY = 'codexsun.ui.color-theme'
export const THEME_STORAGE_KEY = 'codexsun.ui.theme'

export function isColorThemeId(value: string | null): value is ColorThemeId {
  return colorThemes.some((theme) => theme.id === value)
}

export function isThemeMode(value: string | undefined): value is ThemeMode {
  return themeModes.some((mode) => mode.id === value)
}
