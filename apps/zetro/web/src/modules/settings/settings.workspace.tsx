import { useEffect, useState } from 'react'
import {
  Check,
  Clipboard,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  LogOut,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { TopologyMarker, TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useCodexConnection } from './settings.hooks'
import '../../styles/settings.css'
import '../../styles/settings-actions.css'

export function SettingsWorkspace() {
  const topology = useMdiTopology()
  const { activate, connection, deviceCode, disconnect, error, generate, isLoading, refresh } =
    useCodexConnection()
  const [activationCode, setActivationCode] = useState('')
  const [copyState, setCopyState] = useState<'copied' | 'idle'>('idle')
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    if (copyState !== 'copied') return
    const timer = window.setTimeout(() => setCopyState('idle'), 1_800)
    return () => window.clearTimeout(timer)
  }, [copyState])

  async function copyCode(): Promise<void> {
    if (!deviceCode) return
    try {
      await navigator.clipboard.writeText(deviceCode.userCode)
      setCopyState('copied')
    } catch {
      setActivationCode(deviceCode.userCode)
    }
  }

  async function startNewDeviceLogin(): Promise<void> {
    setActivationCode('')
    setCopyState('idle')
    setIsDisconnecting(false)
    await generate()
  }

  async function disconnectAccount(): Promise<void> {
    if (await disconnect()) setIsDisconnecting(false)
  }

  return (
    <section
      aria-labelledby="settings-title"
      className={`settings-workspace ${topology.highlightClassName('13')}`}
      {...topology.regionProps('13')}
    >
      <TopologyMarker id="13" topology={topology} />
      <TopologyRegion className="settings-heading" id="13.1" topology={topology}>
        <div>
          <p className="eyebrow">Connections</p>
          <h1 id="settings-title">Settings</h1>
          <p>Connect Zetro to the Codex account already managed on this device.</p>
        </div>
        <button
          className={`quiet-button ${topology.highlightClassName('13.1.1')}`}
          disabled={isLoading}
          onClick={() => void refresh()}
          type="button"
          {...topology.regionProps('13.1.1')}
        >
          <RefreshCw /> Refresh
        </button>
      </TopologyRegion>

      <TopologyRegion as="article" className="connection-card" id="13.2" topology={topology}>
        <div className="connection-summary">
          <span className={`connection-icon state-${connection?.state ?? 'loading'}`}>
            {connection?.state === 'connected' ? <Check /> : <KeyRound />}
          </span>
          <div>
            <span className="connection-label">Codex</span>
            <h2>{connectionTitle(connection?.state)}</h2>
            <p>{connectionDescription(connection)}</p>
          </div>
          <div className="connection-actions">
            <span className={`status-pill state-${connection?.state ?? 'loading'}`}>
              {connection?.state ?? 'checking'}
            </span>
            {connection?.state === 'connected' && connection.mode === 'chatgpt' && (
              <button
                className="disconnect-button"
                disabled={isLoading}
                onClick={() => setIsDisconnecting(true)}
                type="button"
              >
                <LogOut /> Disconnect
              </button>
            )}
          </div>
        </div>

        {isDisconnecting && (
          <div className="disconnect-confirmation" role="alert">
            <div>
              <strong>Sign out of Codex on this device?</strong>
              <p>Other local apps using the same Codex credentials may need to reconnect.</p>
            </div>
            <button disabled={isLoading} onClick={() => setIsDisconnecting(false)} type="button">
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={isLoading}
              onClick={() => void disconnectAccount()}
              type="button"
            >
              {isLoading ? <LoaderCircle className="spin" /> : <LogOut />}
              Sign out
            </button>
          </div>
        )}

        <TopologyRegion className="device-flow" id="13.3" topology={topology}>
          <div className="flow-intro">
            <span>01</span>
            <div>
              <h3>
                {connection?.state === 'connected'
                  ? 'Connect another account'
                  : 'Generate a device code'}
              </h3>
              <p>
                {connection?.state === 'connected'
                  ? 'Start a fresh device-code flow without interrupting this account first.'
                  : 'Zetro asks the local Codex service for a short-lived sign-in code.'}
              </p>
            </div>
            <button
              className={`primary-button ${topology.highlightClassName('13.3.1')}`}
              disabled={isLoading}
              onClick={() => void startNewDeviceLogin()}
              type="button"
              {...topology.regionProps('13.3.1')}
            >
              {isLoading ? (
                <LoaderCircle className="spin" />
              ) : connection?.state === 'connected' ? (
                <UserPlus />
              ) : (
                <KeyRound />
              )}
              {deviceCode
                ? 'Generate new code'
                : connection?.state === 'connected'
                  ? 'Connect another account'
                  : 'Generate device code'}
            </button>
          </div>

          {deviceCode && (
            <>
              <div className="flow-step">
                <span>02</span>
                <div>
                  <h3>Open Codex sign in</h3>
                  <p>Open the secure browser page, then enter this code.</p>
                  <a
                    className={topology.highlightClassName('13.3.2')}
                    href={deviceCode.verificationUrl}
                    rel="noreferrer"
                    target="_blank"
                    {...topology.regionProps('13.3.2')}
                  >
                    Open browser link <ExternalLink />
                  </a>
                </div>
                <div className="device-code-block">
                  <code>{deviceCode.userCode}</code>
                  <button
                    className={topology.highlightClassName('13.3.3')}
                    onClick={() => void copyCode()}
                    type="button"
                    {...topology.regionProps('13.3.3')}
                  >
                    {copyState === 'copied' ? <Check /> : <Clipboard />}
                    {copyState === 'copied' ? 'Copied' : 'Copy code'}
                  </button>
                </div>
              </div>

              <form
                className={`flow-step activation-step ${topology.highlightClassName('13.3.4')}`}
                onSubmit={(event) => {
                  event.preventDefault()
                  void activate(activationCode)
                }}
                {...topology.regionProps('13.3.4')}
              >
                <span>03</span>
                <div>
                  <h3>Update activation</h3>
                  <p>After browser approval, paste the same code to confirm this session.</p>
                </div>
                <label>
                  <span>Device code</span>
                  <input
                    autoComplete="one-time-code"
                    onChange={(event) => setActivationCode(event.target.value)}
                    placeholder="Paste code"
                    required
                    value={activationCode}
                  />
                </label>
                <button
                  className="primary-button"
                  disabled={isLoading || !activationCode.trim()}
                  type="submit"
                >
                  {isLoading ? <LoaderCircle className="spin" /> : <RefreshCw />}
                  Update activation
                </button>
              </form>
            </>
          )}
        </TopologyRegion>

        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
      </TopologyRegion>

      <TopologyRegion as="aside" className="privacy-note" id="13.4" topology={topology}>
        <KeyRound />
        <div>
          <strong>Credentials stay local</strong>
          <p>Zetro never stores your account token in browser storage or its task data.</p>
        </div>
      </TopologyRegion>
    </section>
  )
}

function connectionTitle(state: string | undefined): string {
  if (state === 'connected') return 'Connected and ready'
  if (state === 'pending') return 'Waiting for browser approval'
  if (state === 'error') return 'Connection needs attention'
  return state === 'disconnected' ? 'Not connected' : 'Checking connection'
}

function connectionDescription(
  connection: ReturnType<typeof useCodexConnection>['connection'],
): string {
  if (!connection) return 'Reading the local Codex account…'
  if (connection.state !== 'connected')
    return connection.message ?? 'Use device sign in to connect.'
  if (connection.mode === 'api_key') return 'Connected with the local ZETRO_CODEX_API_KEY override.'
  const identity = connection.email ?? 'Local ChatGPT account'
  return connection.planType ? `${identity} · ${connection.planType}` : identity
}
