import type { DatabaseSetupPayload, SetupStatus } from '@shared/index'
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  startTransition,
  useContext,
  useEffect,
  useState,
} from 'react'
import { fetchSetupStatus, saveDatabaseSetup } from '@/shared/api/client'
import { appSkipSetupCheck } from '@/config/frontend'

interface SetupContextValue {
  isLoading: boolean
  isSubmitting: boolean
  status: SetupStatus | null
  refresh: () => Promise<SetupStatus>
  saveDatabaseConfig: (payload: DatabaseSetupPayload) => Promise<SetupStatus>
}

const SetupContext = createContext<SetupContextValue | null>(null)

export function SetupProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SetupStatus | null>(() =>
    appSkipSetupCheck
      ? {
          status: 'ready',
          checkedAt: new Date().toISOString(),
          detail: 'Application setup checks are bypassed by APP_SKIP_SETUP_CHECK.',
          database: {
            configured: false,
            source: 'none',
            host: null,
            port: null,
            user: null,
            name: null,
          },
        }
      : null,
  )
  const [isLoading, setIsLoading] = useState(!appSkipSetupCheck)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function createUnreachableStatus(detail: string): SetupStatus {
    return {
      status: 'error',
      checkedAt: new Date().toISOString(),
      detail,
      database: {
        configured: false,
        source: 'none',
        host: null,
        port: null,
        user: null,
        name: null,
      },
    }
  }

  const refresh = useCallback(async () => {
    setIsLoading(true)

    try {
      const nextStatus = await fetchSetupStatus()
      startTransition(() => {
        setStatus(nextStatus)
      })
      return nextStatus
    } catch (error) {
      const nextStatus = createUnreachableStatus(
        error instanceof Error ? error.message : 'Unable to reach the codexsun API.',
      )
      startTransition(() => {
        setStatus(nextStatus)
      })
      return nextStatus
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveDatabaseConfig = useCallback(async (payload: DatabaseSetupPayload) => {
    setIsSubmitting(true)

    try {
      const nextStatus = await saveDatabaseSetup(payload)
      startTransition(() => {
        setStatus(nextStatus)
      })
      return nextStatus
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  useEffect(() => {
    if (appSkipSetupCheck) {
      return
    }

    void (async () => {
      await refresh()
    })()
  }, [refresh])

  return (
    <SetupContext.Provider
      value={{
        isLoading,
        isSubmitting,
        status,
        refresh,
        saveDatabaseConfig,
      }}
    >
      {children}
    </SetupContext.Provider>
  )
}

export function useSetup() {
  const context = useContext(SetupContext)

  if (!context) {
    throw new Error('useSetup must be used within SetupProvider')
  }

  return context
}
