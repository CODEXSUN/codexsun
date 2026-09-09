import { createContext, useContext } from 'react'

export type ZetroDefaultWorkflow = 'deliver' | 'develop' | 'document' | 'review' | 'test'

export type ZetroPreferences = {
  defaultWorkflow: ZetroDefaultWorkflow
  interfaceTopology: boolean
}

export type ZetroPreferencesContextValue = {
  preferences: ZetroPreferences
  setPreference<Key extends keyof ZetroPreferences>(key: Key, value: ZetroPreferences[Key]): void
}

const storageKey = 'zetro.settings.preferences.v1'
const defaults: ZetroPreferences = {
  defaultWorkflow: 'develop',
  interfaceTopology: false,
}
const workflows: readonly ZetroDefaultWorkflow[] = [
  'develop',
  'deliver',
  'review',
  'test',
  'document',
]

export const ZetroPreferencesContext = createContext<ZetroPreferencesContextValue | null>(null)

export function useZetroPreferences() {
  const context = useContext(ZetroPreferencesContext)
  if (!context) throw new Error('useZetroPreferences must be used inside ZetroSettingsProvider.')
  return context
}

export function readZetroPreferences(): ZetroPreferences {
  if (typeof window === 'undefined') return defaults

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey) ?? '{}',
    ) as Partial<ZetroPreferences>
    const legacyWorkflow = window.localStorage.getItem('zetro.agent-chat.workflow')
    const defaultWorkflow = isWorkflow(stored.defaultWorkflow)
      ? stored.defaultWorkflow
      : isWorkflow(legacyWorkflow)
        ? legacyWorkflow
        : defaults.defaultWorkflow

    return {
      defaultWorkflow,
      interfaceTopology:
        typeof stored.interfaceTopology === 'boolean'
          ? stored.interfaceTopology
          : defaults.interfaceTopology,
    }
  } catch {
    return defaults
  }
}

export function writeZetroPreferences(preferences: ZetroPreferences) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // In-memory settings remain usable when browser storage is unavailable.
  }
}

function isWorkflow(value: unknown): value is ZetroDefaultWorkflow {
  return typeof value === 'string' && workflows.includes(value as ZetroDefaultWorkflow)
}
