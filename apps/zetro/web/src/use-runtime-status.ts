import { useEffect, useState } from 'react'
import { z } from 'zod'

const healthSchema = z.strictObject({
  codex: z.enum(['configured', 'configuration-required']),
  service: z.literal('zetro-api'),
  status: z.literal('ok'),
  storage: z.literal('ready'),
})

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export function useRuntimeStatus() {
  const [status, setStatus] = useState<
    'checking' | 'configured' | 'configuration-required' | 'offline'
  >('checking')

  useEffect(() => {
    let isActive = true

    fetch(`${apiBaseUrl}/health`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Zetro API is unavailable.')
        return healthSchema.parse((await response.json()) as unknown)
      })
      .then((health) => {
        if (isActive) setStatus(health.codex)
      })
      .catch(() => {
        if (isActive) setStatus('offline')
      })

    return () => {
      isActive = false
    }
  }, [])

  return status
}
