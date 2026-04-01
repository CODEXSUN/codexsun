import { useEffect, useState } from 'react'
import type { ApiHealthPayload } from '@/lib/api-client'
import { fetchApiHealth } from '@/lib/api-client'

interface ApiHealthState {
  status: 'idle' | 'ready' | 'error'
  data: ApiHealthPayload | null
  error: string | null
}

export function useApiHealth() {
  const [state, setState] = useState<ApiHealthState>({
    status: 'idle',
    data: null,
    error: null,
  })

  useEffect(() => {
    let isActive = true

    void fetchApiHealth()
      .then((data) => {
        if (!isActive) {
          return
        }

        setState({
          status: 'ready',
          data,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Unable to reach the custom API.',
        })
      })

    return () => {
      isActive = false
    }
  }, [])

  return state
}
