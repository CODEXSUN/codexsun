import type { BillingWorkspaceSnapshot } from '@billing-core/index'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { useEffect, useState } from 'react'
import { BillingHttpError, getBillingWorkspace } from './billing-api-client'

type BillingWorkspaceLoadState = {
  workspace: BillingWorkspaceSnapshot | null
  loading: boolean
  error: string | null
}

export function useBillingWorkspace() {
  const { session } = useAuth()
  const [state, setState] = useState<BillingWorkspaceLoadState>({
    workspace: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const accessToken = session?.accessToken ?? null
    if (!accessToken) {
      setState({
        workspace: null,
        loading: false,
        error: 'Billing workspace requires an authenticated backoffice session.',
      })
      return
    }

    let cancelled = false

    setState((current) => ({
      workspace: current.workspace,
      loading: true,
      error: null,
    }))

    void (async () => {
      try {
        const workspace = await getBillingWorkspace(accessToken)
        if (!cancelled) {
          setState({
            workspace,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof BillingHttpError || error instanceof Error
            ? error.message
            : 'Failed to load billing workspace.'

          setState({
            workspace: null,
            loading: false,
            error: message,
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session?.accessToken])

  return state
}
