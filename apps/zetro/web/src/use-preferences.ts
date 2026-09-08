import { useEffect, useState } from 'react'

export type Accent = 'cobalt' | 'ember' | 'forest'
export type Density = 'focused' | 'relaxed'

interface Preferences {
  accent: Accent
  autoSpeak: boolean
  density: Density
  showTasks: boolean
}

const storageKey = 'zetro.preferences.v1'
const defaults: Preferences = {
  accent: 'cobalt',
  autoSpeak: false,
  density: 'relaxed',
  showTasks: true,
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences))
  }, [preferences])

  return {
    ...preferences,
    setAccent: (accent: Accent) => setPreferences((current) => ({ ...current, accent })),
    setAutoSpeak: (autoSpeak: boolean) => setPreferences((current) => ({ ...current, autoSpeak })),
    setDensity: (density: Density) => setPreferences((current) => ({ ...current, density })),
    setShowTasks: (showTasks: boolean) => setPreferences((current) => ({ ...current, showTasks })),
  }
}

function readPreferences(): Preferences {
  try {
    return {
      ...defaults,
      ...(JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as Partial<Preferences>),
    }
  } catch {
    return defaults
  }
}
