import { useEffect, useState } from 'react'
import {
  Bot,
  Check,
  Clipboard,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  LogOut,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useCodexConnection } from './settings.hooks'

export function SettingsConnection() {
  const topology = useMdiTopology()
  const { activate, connection, deviceCode, disconnect, error, generate, isLoading, refresh } =
    useCodexConnection()
  const [activationCode, setActivationCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1_800)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyCode() {
    if (!deviceCode) return
    try {
      await navigator.clipboard.writeText(deviceCode.userCode)
      setCopied(true)
    } catch {
      setActivationCode(deviceCode.userCode)
    }
  }

  async function startLogin() {
    setActivationCode('')
    setCopied(false)
    setConfirmDisconnect(false)
    await generate()
  }

  async function signOut() {
    if (await disconnect()) setConfirmDisconnect(false)
  }

  const connected = connection?.state === 'connected'

  return (
    <TopologyRegion as="div" className="flex flex-col gap-7" id="15.1.5.3" topology={topology}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
            <Bot className="size-4" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Codex connection</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Use the Codex account managed on this device.
            </p>
          </div>
        </div>
        <Button disabled={isLoading} onClick={() => void refresh()} size="sm" variant="outline">
          <RefreshCw className={isLoading ? 'animate-spin' : undefined} /> Refresh
        </Button>
      </header>

      <section className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-4 p-4">
          <span
            className={
              connected
                ? 'grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground'
            }
          >
            {connected ? <Check className="size-5" /> : <KeyRound className="size-5" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">{connectionTitle(connection?.state)}</span>
            <span className="truncate text-sm text-muted-foreground">
              {connectionDescription(connection)}
            </span>
          </span>
          <span className="rounded-full border px-2.5 py-1 text-xs capitalize text-muted-foreground">
            {connection?.state ?? 'checking'}
          </span>
        </div>

        {confirmDisconnect ? (
          <div className="flex items-center gap-3 border-t bg-destructive/5 p-4">
            <span className="min-w-0 flex-1 text-sm">
              This also signs other local apps out of the shared Codex session.
            </span>
            <Button onClick={() => setConfirmDisconnect(false)} size="sm" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => void signOut()}
              size="sm"
              variant="destructive"
            >
              <LogOut /> Sign out
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2 border-t p-3">
            {connected && connection?.mode === 'chatgpt' ? (
              <Button onClick={() => setConfirmDisconnect(true)} size="sm" variant="ghost">
                <LogOut /> Disconnect
              </Button>
            ) : null}
            <Button disabled={isLoading} onClick={() => void startLogin()} size="sm">
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : connected ? (
                <UserPlus />
              ) : (
                <KeyRound />
              )}
              {deviceCode ? 'Generate new code' : connected ? 'Connect another' : 'Connect Codex'}
            </Button>
          </div>
        )}
      </section>

      {deviceCode ? (
        <form
          className="flex flex-col gap-5 rounded-xl border p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void activate(activationCode)
          }}
        >
          <div className="flex items-start justify-between gap-5">
            <span className="flex flex-col gap-1">
              <span className="text-sm font-medium">Approve this device</span>
              <span className="text-sm text-muted-foreground">
                Open the secure sign-in page and enter the device code.
              </span>
            </span>
            <Button
              render={<a href={deviceCode.verificationUrl} rel="noreferrer" target="_blank" />}
              size="sm"
              variant="outline"
            >
              Open sign in <ExternalLink />
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <code className="min-w-0 flex-1 text-lg font-semibold tracking-widest">
              {deviceCode.userCode}
            </code>
            <Button onClick={() => void copyCode()} size="sm" type="button" variant="secondary">
              {copied ? <Check /> : <Clipboard />} {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Confirm device code</span>
            <div className="flex gap-2">
              <Input
                autoComplete="one-time-code"
                onChange={(event) => setActivationCode(event.target.value)}
                placeholder="Paste code"
                required
                value={activationCode}
              />
              <Button disabled={isLoading || !activationCode.trim()} type="submit">
                {isLoading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                Activate
              </Button>
            </div>
          </label>
        </form>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <KeyRound className="size-4" /> Credentials remain in the local Codex service and are not
        stored in Zetro project data.
      </p>
    </TopologyRegion>
  )
}

function connectionTitle(state: string | undefined) {
  if (state === 'connected') return 'Connected and ready'
  if (state === 'pending') return 'Waiting for browser approval'
  if (state === 'error') return 'Connection needs attention'
  return state === 'disconnected' ? 'Not connected' : 'Checking connection'
}

function connectionDescription(connection: ReturnType<typeof useCodexConnection>['connection']) {
  if (!connection) return 'Reading the local Codex account…'
  if (connection.state !== 'connected') return connection.message ?? 'Connect with device sign in.'
  if (connection.mode === 'api_key') return 'Connected with the local API key override.'
  const identity = connection.email ?? 'Local ChatGPT account'
  return connection.planType ? `${identity} · ${connection.planType}` : identity
}
