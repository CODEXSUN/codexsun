import { useEffect, useState, type ReactNode } from 'react'
import {
  readZetroPreferences,
  writeZetroPreferences,
  ZetroPreferencesContext,
  type ZetroPreferences,
} from './settings.preferences'

export function ZetroSettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readZetroPreferences)

  useEffect(() => writeZetroPreferences(preferences), [preferences])

  function setPreference<Key extends keyof ZetroPreferences>(
    key: Key,
    value: ZetroPreferences[Key],
  ) {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  return (
    <ZetroPreferencesContext.Provider value={{ preferences, setPreference }}>
      {children}
    </ZetroPreferencesContext.Provider>
  )
}
