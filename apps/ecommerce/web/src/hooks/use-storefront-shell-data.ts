import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import type { StorefrontLandingResponse } from "@ecommerce/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"
import { useStorefrontShellStore } from "../state/storefront-shell-store"

import { storefrontApi } from "../api/storefront-api"

export function invalidateStorefrontShellData() {
  window.dispatchEvent(new CustomEvent("storefront-shell-invalidated"))
}

export function useStorefrontShellData() {
  const queryClient = useQueryClient()
  const cachedLanding = useStorefrontShellStore((state) => state.landing)
  const setLanding = useStorefrontShellStore((state) => state.setLanding)
  const query = useQuery({
    queryKey: queryKeys.storefrontLanding,
    queryFn: () => storefrontApi.getHome(),
    initialData: cachedLanding ?? undefined,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (query.data) {
      setLanding(query.data)
    }
  }, [query.data, setLanding])

  useQueryInvalidationBridge(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.storefrontLanding })
  })

  return {
    data: query.data ?? null,
    error: query.error instanceof Error ? query.error.message : null,
    isLoading: query.isLoading,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.storefrontLanding })
      const payload = await queryClient.fetchQuery({
        queryKey: queryKeys.storefrontLanding,
        queryFn: () => storefrontApi.getHome(),
      })

      return payload as StorefrontLandingResponse
    },
  }
}

function useQueryInvalidationBridge(onInvalidate: () => void) {
  useEffect(() => {
    const handleInvalidate = () => {
      onInvalidate()
    }

    window.addEventListener("storefront-shell-invalidated", handleInvalidate)

    return () => {
      window.removeEventListener("storefront-shell-invalidated", handleInvalidate)
    }
  }, [onInvalidate])
}
