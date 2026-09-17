import { CheckCircle2, CircleX, LoaderCircle, PlugZap } from 'lucide-react'
import { Button } from './button'
import { NativeSelect, NativeSelectOption } from './native-select'

export type CompactModelSwitcherOption = {
  disabled?: boolean
  id: string
  label: string
}

export function CompactModelSwitcher({
  connections,
  disabled,
  models,
  reasoningLevels,
  selectedConnectionId,
  selectedModelId,
  selectedReasoningLevel,
  connecting,
  unavailable,
  unavailableLabel,
  verified,
  onConnect,
  onConnectionChange,
  onModelChange,
  onReasoningChange,
}: {
  connections: CompactModelSwitcherOption[]
  disabled?: boolean
  connecting?: boolean
  models: CompactModelSwitcherOption[]
  reasoningLevels: CompactModelSwitcherOption[]
  selectedConnectionId: string
  selectedModelId?: string
  selectedReasoningLevel: string
  unavailable?: boolean
  unavailableLabel?: string
  verified?: boolean
  onConnect(): void
  onConnectionChange(id: string): void
  onModelChange(id: string): void
  onReasoningChange(id: string): void
}) {
  return (
    <div className="ml-auto flex min-w-0 items-center gap-2" aria-label="Model connection">
      <NativeSelect
        aria-label="Provider connection"
        className="max-w-44"
        disabled={disabled}
        size="sm"
        value={selectedConnectionId}
        onChange={(event) => onConnectionChange(event.target.value)}
      >
        {connections.map((option) => (
          <NativeSelectOption disabled={option.disabled} key={option.id} value={option.id}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Model"
        className="max-w-48"
        disabled={disabled || models.length === 0}
        size="sm"
        value={selectedModelId ?? ''}
        onChange={(event) => onModelChange(event.target.value)}
      >
        {models.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Reasoning"
        className="max-w-28"
        disabled={disabled || reasoningLevels.length === 0}
        size="sm"
        value={selectedReasoningLevel}
        onChange={(event) => onReasoningChange(event.target.value)}
      >
        {reasoningLevels.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button
        aria-label={
          unavailable
            ? `${unavailableLabel ?? 'Provider'} unavailable`
            : verified
              ? 'Connection verified'
              : 'Connect and verify selection'
        }
        className={
          unavailable
            ? 'border-red-200 bg-red-50 text-red-700 shadow-[0_0_0_3px_rgba(239,68,68,0.14)] hover:bg-red-100'
            : verified
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_0_0_3px_rgba(16,185,129,0.16)] hover:bg-emerald-100'
              : undefined
        }
        disabled={disabled || connecting || !selectedModelId}
        size="icon-sm"
        title={
          unavailable
            ? `${unavailableLabel ?? 'Provider'} is unavailable. Start the runtime, then retry.`
            : verified
              ? 'Connection verified by live smoke test'
              : 'Connect and run smoke test'
        }
        type="button"
        variant="outline"
        onClick={onConnect}
      >
        {connecting ? (
          <LoaderCircle className="animate-spin" />
        ) : unavailable ? (
          <CircleX />
        ) : verified ? (
          <CheckCircle2 />
        ) : (
          <PlugZap />
        )}
      </Button>
    </div>
  )
}
