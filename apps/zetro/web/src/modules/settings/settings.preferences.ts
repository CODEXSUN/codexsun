import { createContext, useContext } from 'react'

export type ZetroDefaultWorkflow = 'plan' | 'deliver' | 'develop' | 'document' | 'review' | 'test'
export type ZetroCodexModel =
  | 'default'
  | 'gpt-6-astra'
  | 'gpt-5.6-sol'
  | 'gpt-5.6-terra'
  | 'gpt-5.6-luna'
  | 'gpt-5.5'
  | 'gpt-5.3-codex-spark'
export type ZetroReasoningLevel = 'hard' | 'light' | 'medium'
export type ZetroReasoningEffort = 'high' | 'low' | 'medium'

export type ZetroPreferences = {
  codexModel: ZetroCodexModel
  defaultWorkflow: ZetroDefaultWorkflow
  interfaceTopology: boolean
  reasoningLevel: ZetroReasoningLevel
}

export type ZetroPreferencesContextValue = {
  preferences: ZetroPreferences
  setPreference<Key extends keyof ZetroPreferences>(key: Key, value: ZetroPreferences[Key]): void
}

const storageKey = 'zetro.settings.preferences.v1'
const defaults: ZetroPreferences = {
  codexModel: 'default',
  defaultWorkflow: 'plan',
  interfaceTopology: false,
  reasoningLevel: 'medium',
}
export const zetroCodexModels: ReadonlyArray<{
  description: string
  label: string
  value: ZetroCodexModel
}> = [
  { description: 'Use the Codex account or server default.', label: 'Default', value: 'default' },
  { description: 'Most capable for complex work.', label: 'GPT-6 Astra', value: 'gpt-6-astra' },
  { description: 'Reliable for everyday agent work.', label: 'GPT-5.6 Sol', value: 'gpt-5.6-sol' },
  { description: 'Balanced for everyday coding.', label: 'GPT-5.6 Terra', value: 'gpt-5.6-terra' },
  { description: 'Fast for focused changes.', label: 'GPT-5.6 Luna', value: 'gpt-5.6-luna' },
  { description: 'Proven general coding model.', label: 'GPT-5.5', value: 'gpt-5.5' },
  {
    description: 'Fastest for small coding tasks.',
    label: 'GPT-5.3 Codex Spark',
    value: 'gpt-5.3-codex-spark',
  },
]
export const zetroReasoningLevels: ReadonlyArray<{
  description: string
  effort: ZetroReasoningEffort
  label: string
  value: ZetroReasoningLevel
}> = [
  { description: 'Faster response', effort: 'low', label: 'Light', value: 'light' },
  { description: 'Balanced depth', effort: 'medium', label: 'Medium', value: 'medium' },
  { description: 'Deeper reasoning', effort: 'high', label: 'Hard', value: 'hard' },
]
const modelIds = zetroCodexModels.map(({ value }) => value)
const reasoningLevels = zetroReasoningLevels.map(({ value }) => value)
const workflows: readonly ZetroDefaultWorkflow[] = [
  'plan',
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
      codexModel: isCodexModel(stored.codexModel) ? stored.codexModel : defaults.codexModel,
      defaultWorkflow,
      interfaceTopology:
        typeof stored.interfaceTopology === 'boolean'
          ? stored.interfaceTopology
          : defaults.interfaceTopology,
      reasoningLevel: isReasoningLevel(stored.reasoningLevel)
        ? stored.reasoningLevel
        : defaults.reasoningLevel,
    }
  } catch {
    return defaults
  }
}

export function toCodexTurnSelection(preferences: ZetroPreferences): {
  model?: Exclude<ZetroCodexModel, 'default'>
  reasoningEffort: ZetroReasoningEffort
} {
  const level = zetroReasoningLevels.find(({ value }) => value === preferences.reasoningLevel)
  return {
    model: preferences.codexModel === 'default' ? undefined : preferences.codexModel,
    reasoningEffort: level?.effort ?? 'medium',
  }
}

export function getCodexModelLabel(model: ZetroCodexModel): string {
  return zetroCodexModels.find(({ value }) => value === model)?.label ?? 'Default'
}

function isCodexModel(value: unknown): value is ZetroCodexModel {
  return typeof value === 'string' && modelIds.includes(value as ZetroCodexModel)
}

function isReasoningLevel(value: unknown): value is ZetroReasoningLevel {
  return typeof value === 'string' && reasoningLevels.includes(value as ZetroReasoningLevel)
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
