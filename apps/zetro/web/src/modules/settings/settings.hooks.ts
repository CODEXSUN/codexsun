import { useCallback, useEffect, useState } from 'react'
import {
  activateDeviceCode,
  disconnectCodex,
  generateDeviceCode,
  getCodexConnection,
} from './settings.services'
import type { CodexConnection, CodexDeviceCode } from './settings.types'

export function useCodexConnection() {
  const [connection, setConnection] = useState<CodexConnection | null>(null)
  const [deviceCode, setDeviceCode] = useState<CodexDeviceCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setConnection(await getCodexConnection())
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const generate = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await generateDeviceCode()
      setDeviceCode(result)
      setConnection({ mode: 'none', state: 'pending' })
      return result
    } catch (reason) {
      setError(toMessage(reason))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const activate = useCallback(
    async (userCode: string) => {
      if (!deviceCode) return
      setIsLoading(true)
      setError(null)
      try {
        const result = await activateDeviceCode(deviceCode.loginId, userCode)
        setConnection(result)
        if (result.state === 'error') setError(result.message ?? 'Device activation failed.')
      } catch (reason) {
        setError(toMessage(reason))
      } finally {
        setIsLoading(false)
      }
    },
    [deviceCode],
  )

  const disconnect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await disconnectCodex()
      setConnection(result)
      setDeviceCode(null)
      if (result.state === 'connected') {
        setError(result.message ?? 'This connection is still active.')
        return false
      }
      return true
    } catch (reason) {
      setError(toMessage(reason))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { activate, connection, deviceCode, disconnect, error, generate, isLoading, refresh }
}

function toMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Zetro could not connect to Codex.'
}
