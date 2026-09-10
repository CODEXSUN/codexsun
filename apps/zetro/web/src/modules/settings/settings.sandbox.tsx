import { useState } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Button } from '@codexsun/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { ExecutionChecks } from '@codexsun/ui/blocks/execution-status'
import { readStartupPolicy, startupPolicyKey, hasCurrentEvidence } from './settings.startup-policy'
import { readSandbox, updateSandbox } from './settings.sandbox.services'

export function SettingsSandbox() {
  const [client] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      <SandboxControls />
    </QueryClientProvider>
  )
}

function SandboxControls() {
  const client = useQueryClient()
  const [confirmation, setConfirmation] = useState<'setup' | 'verify' | null>(null)
  const [automatic, setAutomatic] = useState(() => {
    try {
      return readStartupPolicy(window.localStorage) !== null
    } catch {
      return false
    }
  })
  const query = useQuery({
    queryKey: ['zetro', 'sandbox'],
    queryFn: readSandbox,
    refetchInterval: (state) =>
      ['setting-up', 'verifying'].includes(state.state.data?.state ?? '') ? 2000 : 15000,
  })
  const action = useMutation({
    mutationFn: updateSandbox,
    onSuccess: (sandbox) => {
      client.setQueryData(['zetro', 'sandbox'], sandbox)
      setConfirmation(null)
    },
  })
  const sandbox = query.data
  const busy = action.isPending || ['setting-up', 'verifying'].includes(sandbox?.state ?? '')
  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution security · {sandbox?.state ?? 'checking'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p role="status">{sandbox?.message ?? 'Reading sandbox status…'}</p>
        <p className="text-sm text-muted-foreground">
          Setup is not proof. Verification tests disposable writes and network enforcement through
          both execution paths. It uses one provider turn. Results expire after 15 minutes or a
          provider restart.
        </p>
        <p className="text-sm">
          Network policy:{' '}
          {sandbox?.allowLocalNetwork
            ? 'Localhost permitted; public-network denial required.'
            : 'Network isolation required; localhost denial is sampled.'}
        </p>
        <ExecutionChecks
          checks={sandbox?.checks.map((check) => ({
            label: check.name,
            state: !check.passed
              ? 'failed'
              : sandbox.state === 'verified' && !hasCurrentEvidence(sandbox)
                ? 'expired'
                : 'passed',
          }))}
        />
        <p className="text-sm">
          Startup verification:{' '}
          {automatic
            ? 'Enabled with your saved network policy.'
            : 'Not enabled. Choose a policy on the startup screen.'}{' '}
          Windows setup is not repeated automatically.
        </p>
        {automatic && (
          <Button
            variant="outline"
            onClick={() => {
              try {
                window.localStorage.removeItem(startupPolicyKey)
                setAutomatic(false)
              } catch {
                /* Storage may be unavailable. Keep the displayed preference unchanged. */
              }
            }}
          >
            Turn off automatic startup verification
          </Button>
        )}
        {sandbox?.checkedAt ? (
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date(sandbox.checkedAt).toLocaleString()}
          </p>
        ) : null}
        {confirmation ? (
          <div className="flex flex-col gap-3">
            <p>
              {confirmation === 'setup'
                ? 'Windows may request administrator approval and configure sandbox users, filesystem permissions, and firewall rules.'
                : 'Run disposable enforcement checks and one paid or account-metered provider turn? Existing project files will not be used as test targets.'}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={busy}
                onClick={() => action.mutate({ action: confirmation, allowLocalNetwork: false })}
              >
                Confirm {confirmation}
              </Button>
              {confirmation === 'verify' ? (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => action.mutate({ action: 'verify', allowLocalNetwork: true })}
                >
                  Permit localhost and verify public-network blocking
                </Button>
              ) : null}
              <Button disabled={busy} variant="outline" onClick={() => setConfirmation(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} variant="outline" onClick={() => setConfirmation('setup')}>
              Set up Windows sandbox
            </Button>
            <Button disabled={busy} onClick={() => setConfirmation('verify')}>
              Verify enforcement
            </Button>
          </div>
        )}
        {query.error || action.error ? (
          <p role="alert" className="text-sm text-destructive">
            {(query.error ?? action.error)?.message}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          No full-access fallback. Builds and publication remain separately approved trusted
          operations. Passing these sampled checks is not a guarantee against every escape.
        </p>
      </CardContent>
    </Card>
  )
}
