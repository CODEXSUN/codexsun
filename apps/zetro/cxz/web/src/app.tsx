import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { NativeSelect, NativeSelectOption } from '@codexsun/ui/components/native-select'
import { Check, Clipboard, ExternalLink, RefreshCw, SlidersHorizontal } from 'lucide-react'
import {
  providerDeviceLoginResponseSchema,
  providerModelListResponseSchema,
  providerSettingsResponseSchema,
  type ProviderDeviceLoginResponse,
  type ProviderModel,
  type ProviderReasoningEffort,
  type ProviderSelectionConfirmation,
} from '@codexsun/zetro-contracts'

type Account = { authenticated: boolean; label?: string }
type SavedSelection = { model: string; reasoningEffort: ProviderReasoningEffort }
const defaultEfforts: ProviderReasoningEffort[] = ['low', 'medium', 'high']

export function App() {
  const [account, setAccount] = useState<Account>({ authenticated: false })
  const [models, setModels] = useState<ProviderModel[]>([])
  const [modelId, setModelId] = useState('')
  const [effort, setEffort] = useState<ProviderReasoningEffort>('low')
  const [login, setLogin] = useState<ProviderDeviceLoginResponse>()
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [compact, setCompact] = useState(false)
  const [showTweaks, setShowTweaks] = useState(false)
  const [applying, setApplying] = useState(false)
  const [confirmation, setConfirmation] = useState<ProviderSelectionConfirmation>()
  const [savedSelection, setSavedSelection] = useState<SavedSelection>()
  const dirty = useRef(false)

  const selected = useMemo(() => models.find(({ id }) => id === modelId), [modelId, models])
  const efforts = selected?.supportedReasoningEfforts.length
    ? selected.supportedReasoningEfforts
    : defaultEfforts
  const hasPendingSelection =
    !savedSelection || savedSelection.model !== modelId || savedSelection.reasoningEffort !== effort

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => void synchronizeSelection(), 1_500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!login) return
    const timer = window.setInterval(() => {
      void readAccount().then((next) => {
        setAccount(next)
        if (next.authenticated) {
          setLogin(undefined)
          setMessage('CXZ Codex is authenticated.')
        }
      })
    }, 2_000)
    return () => window.clearInterval(timer)
  }, [login])

  async function refresh() {
    try {
      const [nextAccount, nextModels, settings] = await Promise.all([
        readAccount(),
        readModels(),
        readZetroSettings().catch(() => undefined),
      ])
      setAccount(nextAccount)
      setModels(nextModels)
      const saved = settings?.connections.find(({ id }) => id === 'cxz-codex')
      const nextModel =
        saved?.model ?? nextModels.find(({ isDefault }) => isDefault)?.id ?? nextModels[0]?.id ?? ''
      setModelId(nextModel)
      if (saved?.model) {
        setEffort(saved.reasoningEffort)
        setSavedSelection({ model: saved.model, reasoningEffort: saved.reasoningEffort })
        setConfirmation(settings?.confirmation)
      }
      dirty.current = false
      setMessage('')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  async function startLogin() {
    try {
      const response = await fetch('/codex/device-login', {
        body: '{}',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      setLogin(providerDeviceLoginResponseSchema.parse(await response.json()))
      setMessage('Copy the code, then open the activation page.')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  async function copyCode() {
    if (!login) return
    await navigator.clipboard.writeText(login.userCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  async function applySelection() {
    if (!modelId) return
    setApplying(true)
    setMessage('')
    try {
      const response = await fetch('/zetro/providers/default', {
        body: JSON.stringify({
          connectionId: 'cxz-codex',
          model: modelId,
          reasoningEffort: effort,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
      })
      const body = await response.json().catch(() => undefined)
      if (!response.ok) throw new Error(readError(body) ?? 'Zetro rejected the CXZ selection.')
      const settings = providerSettingsResponseSchema.parse(body)
      if (!settings.confirmation) throw new Error('Zetro did not confirm the CXZ selection.')
      setConfirmation(settings.confirmation)
      setSavedSelection({ model: settings.confirmation.model, reasoningEffort: effort })
      dirty.current = false
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setApplying(false)
    }
  }

  async function synchronizeSelection() {
    try {
      const settings = await readZetroSettings()
      const saved = settings.connections.find(({ id }) => id === 'cxz-codex')
      if (!saved?.model) return
      const next = { model: saved.model, reasoningEffort: saved.reasoningEffort }
      setSavedSelection(next)
      setConfirmation(settings.confirmation)
      if (!dirty.current) {
        setModelId(next.model)
        setEffort(next.reasoningEffort)
      }
    } catch {
      // The manual refresh action reports connection errors without noisy polling messages.
    }
  }

  function changeModel(nextModel: string) {
    setModelId(nextModel)
    dirty.current =
      !savedSelection ||
      savedSelection.model !== nextModel ||
      savedSelection.reasoningEffort !== effort
  }

  function changeEffort(nextEffort: ProviderReasoningEffort) {
    setEffort(nextEffort)
    dirty.current =
      !savedSelection ||
      savedSelection.model !== modelId ||
      savedSelection.reasoningEffort !== nextEffort
  }

  return (
    <main className={compact ? 'min-h-screen px-5 py-6' : 'min-h-screen px-6 py-12'}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Zetro runtime</p>
            <h1 className="text-2xl font-semibold tracking-tight">CXZ Codex</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`size-2 rounded-full ${account.authenticated ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {account.authenticated ? 'Connected' : 'Authentication required'}
          </div>
        </header>

        {!account.authenticated ? (
          <section className="flex flex-col gap-4" aria-labelledby="activation-title">
            <div>
              <h2 className="text-lg font-semibold" id="activation-title">
                Activate Codex
              </h2>
              <p className="text-sm text-muted-foreground">
                Authenticate this container once. The named Docker volume preserves the session.
              </p>
            </div>
            {login ? (
              <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
                <label className="text-sm font-medium" htmlFor="device-code">
                  Device code
                </label>
                <div className="flex gap-2">
                  <Input
                    className="font-mono text-base tracking-widest"
                    id="device-code"
                    readOnly
                    value={login.userCode}
                  />
                  <Button
                    aria-label="Copy device code"
                    onClick={() => void copyCode()}
                    variant="outline"
                  >
                    {copied ? <Check /> : <Clipboard />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <Button
                  className="self-start"
                  nativeButton={false}
                  render={<a href={login.verificationUrl} rel="noreferrer" target="_blank" />}
                >
                  Open activation <ExternalLink />
                </Button>
              </div>
            ) : (
              <Button className="self-start" onClick={() => void startLogin()}>
                Get device code
              </Button>
            )}
          </section>
        ) : null}

        <section className="flex flex-col gap-4 border-t pt-6" aria-labelledby="provider-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" id="provider-title">
                Connected provider
              </h2>
              <p className="text-sm text-muted-foreground">
                Codex app-server · streaming NDJSON · persistent credentials
              </p>
            </div>
            <Button
              aria-label="Refresh provider"
              onClick={() => void refresh()}
              size="icon"
              variant="ghost"
            >
              <RefreshCw />
            </Button>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Provider" value="CXZ Codex" />
            <Detail
              label="Account"
              value={
                account.label ?? (account.authenticated ? 'Authenticated' : 'Not authenticated')
              }
            />
          </dl>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Model
              <NativeSelect
                className="w-full"
                value={modelId}
                onChange={(event) => changeModel(event.target.value)}
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
                className="w-full"
                value={effort}
                onChange={(event) => changeEffort(event.target.value as ProviderReasoningEffort)}
              >
                {efforts.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {value}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              disabled={!account.authenticated || !modelId || applying || !hasPendingSelection}
              onClick={() => void applySelection()}
            >
              {applying ? <RefreshCw className="animate-spin" /> : <Check />}
              {applying ? 'Confirming' : 'Set connection'}
            </Button>
            {hasPendingSelection ? (
              <span className="text-sm text-muted-foreground">Selection is not applied yet.</span>
            ) : null}
          </div>
          {confirmation && !hasPendingSelection ? (
            <div
              className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800"
              role="status"
            >
              <Check className="mt-0.5 size-4 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Connected to Zetro through CXZ Codex</p>
                <p className="text-emerald-700">
                  {selected?.displayName ?? confirmation.model} · {confirmation.reasoningEffort}
                </p>
              </div>
            </div>
          ) : null}
          {selected?.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{selected.description}</p>
          ) : null}
        </section>

        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="fixed right-4 bottom-4 flex items-end gap-2">
        {showTweaks ? (
          <div className="flex gap-1 rounded-lg border bg-background p-1 shadow-sm">
            <Button
              onClick={() => setCompact(true)}
              size="sm"
              variant={compact ? 'secondary' : 'ghost'}
            >
              Compact
            </Button>
            <Button
              onClick={() => setCompact(false)}
              size="sm"
              variant={!compact ? 'secondary' : 'ghost'}
            >
              Comfortable
            </Button>
          </div>
        ) : null}
        <Button
          aria-label="Display density"
          onClick={() => setShowTweaks((value) => !value)}
          size="icon"
          variant="outline"
        >
          <SlidersHorizontal />
        </Button>
      </div>
    </main>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}

async function readAccount(): Promise<Account> {
  const response = await fetch('/codex/account')
  if (!response.ok) throw new Error('Could not read the CXZ Codex account.')
  return (await response.json()) as Account
}

async function readModels() {
  const response = await fetch('/codex/models')
  if (!response.ok) throw new Error('Could not load Codex models.')
  return providerModelListResponseSchema.parse(await response.json()).models
}

async function readZetroSettings() {
  const response = await fetch('/zetro/providers')
  if (!response.ok) throw new Error('Could not read the Zetro provider selection.')
  return providerSettingsResponseSchema.parse(await response.json())
}

function readError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = Reflect.get(body, 'error')
  return typeof value === 'string' ? value : undefined
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'CXZ could not complete the request.'
}
