import { useEffect, useState, type ReactNode } from 'react'
import { ExecutionStatus, type ExecutionStatusProps } from '@codexsun/ui/blocks/execution-status'
import { Button } from '@codexsun/ui/components/button'
import { getCodexConnection } from './settings.services'
import { readSandbox, updateSandbox } from './settings.sandbox.services'
import { hasCurrentEvidence, readStartupPolicy, saveStartupPolicy } from './settings.startup-policy'

type Sandbox = Awaited<ReturnType<typeof readSandbox>>
type Phase = 'connecting' | 'approval' | 'verifying' | 'ready' | 'blocked'

/** Startup orchestration only. The API remains the authority for execution permission. */
export function SettingsStartup({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('connecting')
  const [message, setMessage] = useState('Connecting to the local Zetro service and Codex account.')
  const [sandbox, setSandbox] = useState<Sandbox | null>(null)
  const [connected, setConnected] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (dismissed) return
    let stopped = false
    const started = Date.now()
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      1000,
    )
    let poll: ReturnType<typeof setTimeout> | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    const fail = (error: unknown) => {
      if (stopped) return
      setPhase('blocked')
      setMessage(
        error instanceof Error ? error.message : 'Startup checks failed. Open Settings or retry.',
      )
      clearTimeout(poll)
      clearInterval(timer)
      clearTimeout(timeout)
      stopped = true
    }
    const observe = async () => {
      try {
        const status = await readSandbox()
        if (stopped) return
        setSandbox(status)
        setMessage(status.message)
        if (hasCurrentEvidence(status)) {
          setPhase('ready')
          clearTimeout(timeout)
          clearInterval(timer)
          timeout = setTimeout(
            () =>
              fail(new Error('Verification expired. Retry checks before starting project work.')),
            Math.max(0, Date.parse(status.expiresAt!) - Date.now()),
          )
          poll = setTimeout(() => void observe(), 15_000)
        } else if (['verifying', 'setting-up'].includes(status.state)) {
          setPhase('verifying')
          poll = setTimeout(() => void observe(), 2000)
        } else {
          fail(new Error(status.message))
        }
      } catch (error) {
        fail(error)
      }
    }
    const start = async () => {
      setPhase('connecting')
      setConnected(false)
      setSandbox(null)
      setElapsed(0)
      try {
        const connection = await getCodexConnection()
        if (stopped) return
        if (connection.state !== 'connected')
          throw new Error('Connect your Codex account in Settings, then retry startup checks.')
        setConnected(true)
        const status = await readSandbox()
        if (stopped) return
        setSandbox(status)
        if (hasCurrentEvidence(status) || ['verifying', 'setting-up'].includes(status.state)) {
          await observe()
          return
        }
        const policy = readStartupPolicy(window.localStorage)
        if (!policy) {
          setPhase('approval')
          setMessage(
            'Choose and remember a startup verification policy. Each verification uses disposable files and one account-metered provider turn. Windows setup is never automatic.',
          )
          clearTimeout(timeout)
          clearInterval(timer)
          return
        }
        setPhase('verifying')
        setMessage('Starting approved filesystem and network checks. Waiting for observed results…')
        await updateSandbox({ action: 'verify', allowLocalNetwork: policy.allowLocalNetwork })
        if (!stopped) await observe()
      } catch (error) {
        fail(error)
      }
    }
    timeout = setTimeout(
      () =>
        fail(
          new Error(
            'Startup verification timed out. No readiness was granted. Check Settings before retrying.',
          ),
        ),
      180_000,
    )
    void start()
    return () => {
      stopped = true
      clearInterval(timer)
      clearTimeout(timeout)
      clearTimeout(poll)
    }
  }, [attempt, dismissed])

  function approve(allowLocalNetwork: boolean) {
    try {
      saveStartupPolicy(window.localStorage, allowLocalNetwork)
      setAttempt((value) => value + 1)
    } catch {
      setPhase('blocked')
      setMessage(
        'The startup preference could not be saved. Enable local storage or use manual verification in Settings.',
      )
    }
  }

  if (dismissed) return children
  const checks: NonNullable<ExecutionStatusProps['checks']> = [
    {
      label: 'Local service and Codex account',
      state: connected ? 'passed' : phase === 'blocked' ? 'failed' : 'checking',
    },
    ...['command', 'agent'].flatMap((path) =>
      [
        'approved folder writes',
        'approved documentation writes',
        'sibling write denied',
        `${sandbox?.allowLocalNetwork ? 'public-network' : 'network'} denied`,
      ].map((name) => {
        const label = `${path}: ${name}`
        const result = sandbox?.checks.find((check) => check.name === label)
        return {
          label,
          state: result
            ? result.passed
              ? phase === 'blocked'
                ? ('expired' as const)
                : ('passed' as const)
              : ('failed' as const)
            : phase === 'verifying'
              ? ('checking' as const)
              : ('pending' as const),
        }
      }),
    ),
  ]
  return (
    <ExecutionStatus
      splash
      state={
        phase === 'ready'
          ? 'complete'
          : phase === 'blocked' || phase === 'approval'
            ? 'attention'
            : 'active'
      }
      title={
        phase === 'ready'
          ? 'Zetro is ready'
          : phase === 'blocked'
            ? 'Zetro needs attention'
            : 'Preparing Zetro'
      }
      description={message}
      elapsed={`${elapsed}s`}
      metrics={[
        {
          label: 'Checks passed',
          value: `${checks.filter((check) => check.state === 'passed').length} / ${checks.length}`,
        },
      ]}
      checks={checks}
      actions={
        <>
          {phase === 'approval' && (
            <>
              <Button onClick={() => approve(true)}>Allow localhost and verify at startup</Button>
              <Button variant="outline" onClick={() => approve(false)}>
                Require network isolation
              </Button>
            </>
          )}
          {phase === 'blocked' && (
            <Button onClick={() => setAttempt((value) => value + 1)}>Retry checks</Button>
          )}
          <Button
            variant={phase === 'ready' ? 'default' : 'outline'}
            onClick={() => setDismissed(true)}
          >
            {phase === 'ready' ? 'Start working' : 'Open desk / Settings'}
          </Button>
        </>
      }
    />
  )
}
