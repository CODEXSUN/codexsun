import { useEffect, useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { NativeSelect, NativeSelectOption } from '@codexsun/ui/components/native-select'
import type {
  ProviderDeviceLoginResponse,
  ProviderModel,
  ProviderReasoningEffort,
  ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'
import {
  fetchProviderModels,
  refreshCodexAccount,
  saveProviderSelection,
  startCodexDeviceLogin,
  testProvider,
} from './provider.services'

const efforts: ProviderReasoningEffort[] = [
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
  'ultra',
]

export function ProviderSettings({
  settings,
  onChange,
}: {
  settings: ProviderSettingsResponse
  onChange(settings: ProviderSettingsResponse): void
}) {
  const active = settings.connections.find(({ id }) => id === settings.selectedConnectionId)!
  const [models, setModels] = useState<ProviderModel[]>([])
  const [login, setLogin] = useState<ProviderDeviceLoginResponse>()
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMessage('')
    fetchProviderModels(active.id)
      .then(setModels)
      .catch((error: unknown) => setMessage(errorMessage(error)))
  }, [active.id])

  useEffect(() => {
    if (!login) return
    const timer = window.setInterval(() => {
      void refreshCodexAccount(active.id)
        .then((next) => {
          onChange(next)
          const codex = next.connections.find(({ id }) => id === active.id)
          if (codex?.authStatus === 'authenticated') {
            setLogin(undefined)
            setMessage('Codex device login is authenticated.')
          }
        })
        .catch(() => undefined)
    }, 2_000)
    return () => window.clearInterval(timer)
  }, [active.id, login, onChange])

  async function select(
    connectionId: string,
    model = active.model,
    reasoningEffort = active.reasoningEffort,
  ) {
    try {
      onChange(await saveProviderSelection({ connectionId, model, reasoningEffort }))
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  function selectConnection(connectionId: string) {
    const target = settings.connections.find(({ id }) => id === connectionId)
    if (target) void select(target.id, target.model, target.reasoningEffort)
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Models and providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The selected connection, model, and reasoning level are stored in Zetro SQLite.
        </p>
      </div>
      <div className="space-y-4 rounded-xl border p-5">
        <label className="grid gap-2 text-sm font-medium">
          Connection
          <NativeSelect
            value={active.id}
            onChange={(event) => selectConnection(event.target.value)}
          >
            {settings.connections.map((item) => (
              <NativeSelectOption disabled={!item.enabled} key={item.id} value={item.id}>
                {item.label}
                {item.enabled ? '' : ' (coming later)'}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Model
          <NativeSelect
            value={active.model ?? ''}
            onChange={(event) => void select(active.id, event.target.value)}
          >
            {models.map((model) => (
              <NativeSelectOption key={model.id} value={model.id}>
                {model.displayName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Reasoning
          <NativeSelect
            value={active.reasoningEffort}
            onChange={(event) =>
              void select(active.id, active.model, event.target.value as ProviderReasoningEffort)
            }
          >
            {efforts.map((effort) => (
              <NativeSelectOption key={effort} value={effort}>
                {effort}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <div className="border-t pt-4 text-sm">
          <p className="font-medium">Image processing</p>
          {active.kind === 'codex-app-server' ? (
            <p className="mt-1 text-muted-foreground">
              Connected Codex Vision is ready for private PNG, JPEG, and WebP attachments. Docker OCR remains optional and is not installed.
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              CXZ image input needs the planned shared artifact mount. Use Local Codex to discuss an image now.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              void testProvider(active.id)
                .then((result) => setMessage(result.message))
                .catch((error: unknown) => setMessage(errorMessage(error)))
            }
          >
            Test connection
          </Button>
          {active.kind === 'codex-app-server' || active.kind === 'cxz-codex' ? (
            <>
              <Button
                onClick={() =>
                  void startCodexDeviceLogin(active.id)
                    .then(setLogin)
                    .catch((error: unknown) => setMessage(errorMessage(error)))
                }
              >
                Device login
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  void refreshCodexAccount(active.id)
                    .then(onChange)
                    .catch((error: unknown) => setMessage(errorMessage(error)))
                }
              >
                Refresh account
              </Button>
            </>
          ) : null}
        </div>
        {active.accountLabel ? (
          <p className="text-sm text-muted-foreground">{active.accountLabel}</p>
        ) : null}
        {login ? (
          <div className="rounded-lg bg-muted p-4 text-sm">
            <a className="underline" href={login.verificationUrl} rel="noreferrer" target="_blank">
              Open verification page
            </a>
            <p className="mt-2 font-mono text-xl font-semibold tracking-widest">{login.userCode}</p>
          </div>
        ) : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </section>
  )
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The provider action failed.'
}
