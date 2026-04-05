import { useEffect, useState } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"

import { storefrontApi } from "../api/storefront-api"

let cachedLanding: StorefrontLandingResponse | null = null
let inflightLanding: Promise<StorefrontLandingResponse> | null = null

async function loadStorefrontLanding() {
  if (cachedLanding) {
    return cachedLanding
  }

  if (!inflightLanding) {
    inflightLanding = storefrontApi
      .getHome()
      .then((payload) => {
        cachedLanding = payload
        inflightLanding = null
        return payload
      })
      .catch((error) => {
        inflightLanding = null
        throw error
      })
  }

  return inflightLanding
}

export function invalidateStorefrontShellData() {
  cachedLanding = null
  inflightLanding = null
}

export function useStorefrontShellData() {
  const [data, setData] = useState<StorefrontLandingResponse | null>(cachedLanding)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!cachedLanding)

  useEffect(() => {
    let cancelled = false

    if (cachedLanding) {
      setData(cachedLanding)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    void loadStorefrontLanding()
      .then((payload) => {
        if (!cancelled) {
          setData(payload)
          setError(null)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load storefront."
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    refresh: async () => {
      invalidateStorefrontShellData()
      setIsLoading(true)
      const payload = await loadStorefrontLanding()
      setData(payload)
      setError(null)
      setIsLoading(false)
      return payload
    },
  }
}
