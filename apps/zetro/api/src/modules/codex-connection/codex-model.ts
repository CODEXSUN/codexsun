export const codexModels = [
  'gpt-6-astra',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'gpt-5.5',
  'gpt-5.3-codex-spark',
] as const

export const codexReasoningEfforts = ['low', 'medium', 'high'] as const

export type CodexModel = (typeof codexModels)[number]
export type CodexReasoningEffort = (typeof codexReasoningEfforts)[number]
