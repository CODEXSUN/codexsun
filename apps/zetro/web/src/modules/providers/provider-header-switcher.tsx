import { useEffect, useState } from 'react'
import { CompactModelSwitcher } from '@codexsun/ui/components/compact-model-switcher'
import type {
  ProviderModel,
  ProviderReasoningEffort,
  ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'
import { fetchProviderModels, saveProviderSelection, testProvider } from './provider.services'

type Availability = 'unknown' | 'available' | 'unavailable'

export function ProviderHeaderSwitcher({
  disabled,
  settings,
  onChange,
  onError,
}: {
  disabled?: boolean
  settings: ProviderSettingsResponse
  onChange(settings: ProviderSettingsResponse): void
  onError(message: string): void
}) {
  const active = settings.connections.find(({ id }) => id === settings.selectedConnectionId)!
  const [draft, setDraft] = useState(() => ({
    connectionId: active.id,
    model: active.model,
    reasoningEffort: active.reasoningEffort,
  }))
  const [models, setModels] = useState<ProviderModel[]>([])
  const [confirmation, setConfirmation] = useState(settings.confirmation)
  const [switching, setSwitching] = useState(false)
  const [availability, setAvailability] = useState<Availability>('unknown')
  const draftConnection = settings.connections.find(({ id }) => id === draft.connectionId) ?? active
  const selectedModel = models.find(({ id }) => id === draft.model)
  const reasoningLevels = selectedModel?.supportedReasoningEfforts ?? []
  const verified = Boolean(
    availability !== 'unavailable' &&
    confirmation?.smoke.ok &&
    confirmation.connectionId === draft.connectionId &&
    confirmation.model === draft.model &&
    confirmation.reasoningEffort === draft.reasoningEffort,
  )

  useEffect(() => {
    setDraft({
      connectionId: active.id,
      model: active.model,
      reasoningEffort: active.reasoningEffort,
    })
    setConfirmation(settings.confirmation)
  }, [active.id, active.model, active.reasoningEffort, settings.confirmation])

  useEffect(() => {
    let current = true
    if (!draftConnection.enabled) {
      setModels([])
      return
    }
    fetchProviderModels(draftConnection.id)
      .then((nextModels) => {
        if (!current) return
        setAvailability('available')
        setModels(nextModels)
        const nextModel =
          nextModels.find(({ id }) => id === draft.model) ??
          nextModels.find(({ id }) => id === draftConnection.model) ??
          nextModels.find(({ isDefault }) => isDefault) ??
          nextModels[0]
        if (!nextModel) return
        setDraft((currentDraft) => {
          if (currentDraft.connectionId !== draftConnection.id) return currentDraft
          const effort = nextModel.supportedReasoningEfforts.includes(currentDraft.reasoningEffort)
            ? currentDraft.reasoningEffort
            : (nextModel.supportedReasoningEfforts[0] ?? currentDraft.reasoningEffort)
          return { ...currentDraft, model: nextModel.id, reasoningEffort: effort }
        })
      })
      .catch((error: unknown) => {
        if (!current) return
        setAvailability('unavailable')
        setModels([])
        onError(message(error, draftConnection.label))
      })
    return () => {
      current = false
    }
  }, [draftConnection.id, draftConnection.enabled, draftConnection.model, onError])

  useEffect(() => {
    if (draftConnection.kind !== 'cxz-codex') return
    let current = true
    const check = () => {
      void testProvider(draftConnection.id)
        .then((result) => {
          if (current) setAvailability(result.ok ? 'available' : 'unavailable')
        })
        .catch(() => {
          if (current) setAvailability('unavailable')
        })
    }
    check()
    const timer = window.setInterval(check, 5_000)
    return () => {
      current = false
      window.clearInterval(timer)
    }
  }, [draftConnection.id, draftConnection.kind])

  async function connect() {
    if (!draftConnection.enabled || !draft.model) return
    setSwitching(true)
    setConfirmation(undefined)
    setAvailability('unknown')
    try {
      const next = await saveProviderSelection({
        connectionId: draft.connectionId,
        model: draft.model,
        reasoningEffort: draft.reasoningEffort,
      })
      if (!next.confirmation?.smoke.ok)
        throw new Error('The provider smoke test was not confirmed.')
      onChange(next)
      setConfirmation(next.confirmation)
      setAvailability('available')
      onError('')
    } catch (error) {
      setAvailability('unavailable')
      onError(message(error, draftConnection.label))
    } finally {
      setSwitching(false)
    }
  }

  function selectModel(modelId: string) {
    const model = models.find(({ id }) => id === modelId)
    const reasoningEffort = model?.supportedReasoningEfforts.includes(draft.reasoningEffort)
      ? draft.reasoningEffort
      : model?.supportedReasoningEfforts[0]
    if (!reasoningEffort) return
    setConfirmation(undefined)
    setDraft((current) => ({ ...current, model: modelId, reasoningEffort }))
  }

  return (
    <div className="ml-auto flex min-w-0 items-center">
      <CompactModelSwitcher
        connections={settings.connections.map(({ enabled, id, label }) => ({
          disabled: !enabled,
          id,
          label,
        }))}
        disabled={disabled || switching}
        models={models.map(({ displayName, id }) => ({ id, label: displayName }))}
        reasoningLevels={reasoningLevels.map((effort) => ({ id: effort, label: effort }))}
        connecting={switching}
        selectedConnectionId={draft.connectionId}
        selectedModelId={draft.model}
        selectedReasoningLevel={draft.reasoningEffort}
        unavailable={availability === 'unavailable'}
        unavailableLabel={draftConnection.label}
        verified={verified}
        onConnect={() => void connect()}
        onConnectionChange={(id) => {
          const target = settings.connections.find((connection) => connection.id === id)
          if (!target?.enabled) return
          setConfirmation(undefined)
          setAvailability('unknown')
          setDraft({
            connectionId: target.id,
            model: target.model,
            reasoningEffort: target.reasoningEffort,
          })
        }}
        onModelChange={selectModel}
        onReasoningChange={(effort) => {
          setConfirmation(undefined)
          setDraft((current) => ({
            ...current,
            reasoningEffort: effort as ProviderReasoningEffort,
          }))
        }}
      />
    </div>
  )
}

function message(error: unknown, providerLabel: string) {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return `${providerLabel} is unavailable.`
  }
  return error instanceof Error ? error.message : `${providerLabel} is unavailable.`
}
