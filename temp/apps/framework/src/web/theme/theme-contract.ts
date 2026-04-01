export type AccentTheme = 'neutral' | 'orange' | 'blue' | 'purple'
export type ColorMode = 'light' | 'dark' | 'system'

export const modeOptions: { value: ColorMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export const accentOptions: { value: AccentTheme; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'orange', label: 'Orange' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
]
