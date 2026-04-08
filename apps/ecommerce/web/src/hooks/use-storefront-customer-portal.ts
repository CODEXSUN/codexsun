import { useEffect, useSyncExternalStore } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CustomerPortalPreferencesUpdatePayload,
  StorefrontSupportCaseCreatePayload,
} from "@ecommerce/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import {
  clearStorefrontWishlistProductIds,
  readStorefrontWishlistProductIds,
  subscribeStorefrontWishlist,
  toggleStorefrontWishlistProductId,
} from "../lib/storefront-wishlist-storage"

let isGuestWishlistSyncInFlight = false
const emptyWishlistProductIds: string[] = []

export function useStorefrontCustomerPortal() {
  const queryClient = useQueryClient()
  const customerAuth = useStorefrontCustomerAuth()
  const accessToken = customerAuth.accessToken
  const isPortalBootstrapReady = Boolean(
    accessToken &&
      customerAuth.isAuthenticated &&
      customerAuth.customer &&
      !customerAuth.isLoading
  )
  const guestWishlistProductIds = useSyncExternalStore(
    subscribeStorefrontWishlist,
    readStorefrontWishlistProductIds,
    () => emptyWishlistProductIds
  )

  const portalQuery = useQuery({
    queryKey: queryKeys.storefrontCustomerPortal,
    queryFn: () => storefrontApi.getCustomerPortal(accessToken!),
    enabled: isPortalBootstrapReady,
    staleTime: 30_000,
    refetchOnMount: "always",
    retry: false,
  })

  const ordersQuery = useQuery({
    queryKey: queryKeys.storefrontCustomerOrders,
    queryFn: () => storefrontApi.listCustomerOrders(accessToken!),
    enabled: isPortalBootstrapReady,
    staleTime: 30_000,
    refetchOnMount: "always",
    retry: false,
  })

  const supportCasesQuery = useQuery({
    queryKey: queryKeys.storefrontCustomerSupportCases,
    queryFn: () => storefrontApi.getCustomerSupportCases(accessToken!),
    enabled: isPortalBootstrapReady,
    staleTime: 30_000,
    refetchOnMount: "always",
    retry: false,
  })

  const toggleWishlistMutation = useMutation({
    mutationFn: (productId: string) => storefrontApi.toggleCustomerWishlist(accessToken!, productId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storefrontCustomerPortal, data)
    },
  })

  useEffect(() => {
    if (
      !customerAuth.isAuthenticated ||
      !accessToken ||
      !portalQuery.data ||
      guestWishlistProductIds.length === 0 ||
      isGuestWishlistSyncInFlight
    ) {
      return
    }

    const persistedProductIds = new Set(portalQuery.data.wishlist.map((item) => item.id))
    const missingProductIds = guestWishlistProductIds.filter((item) => !persistedProductIds.has(item))

    if (missingProductIds.length === 0) {
      clearStorefrontWishlistProductIds()
      return
    }

    let isCancelled = false

    async function syncGuestWishlist() {
      isGuestWishlistSyncInFlight = true

      try {
        for (const productId of missingProductIds) {
          if (isCancelled) {
            return
          }

          const data = await toggleWishlistMutation.mutateAsync(productId)

          if (!isCancelled) {
            queryClient.setQueryData(queryKeys.storefrontCustomerPortal, data)
          }
        }

        if (!isCancelled) {
          clearStorefrontWishlistProductIds()
        }
      } finally {
        isGuestWishlistSyncInFlight = false
      }
    }

    void syncGuestWishlist()

    return () => {
      isCancelled = true
    }
  }, [
    accessToken,
    customerAuth.isAuthenticated,
    guestWishlistProductIds,
    portalQuery.data,
    queryClient,
    toggleWishlistMutation,
  ])

  async function toggleWishlist(productId: string) {
    if (!customerAuth.isAuthenticated || !accessToken) {
      toggleStorefrontWishlistProductId(productId)
      return null
    }

    return toggleWishlistMutation.mutateAsync(productId)
  }

  const preferencesMutation = useMutation({
    mutationFn: (payload: CustomerPortalPreferencesUpdatePayload) =>
      storefrontApi.updateCustomerPortalPreferences(accessToken!, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storefrontCustomerPortal, data)
    },
  })

  const supportCaseMutation = useMutation({
    mutationFn: (payload: StorefrontSupportCaseCreatePayload) =>
      storefrontApi.createCustomerSupportCase(accessToken!, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storefrontCustomerSupportCases, (current) => {
        const currentItems =
          current && typeof current === "object" && "items" in current && Array.isArray(current.items)
            ? current.items
            : []

        return {
          items: [data.item, ...currentItems.filter((item) => item.id !== data.item.id)],
        }
      })
    },
  })

  return {
    portalQuery,
    ordersQuery,
    supportCasesQuery,
    toggleWishlist,
    createSupportCase: supportCaseMutation.mutateAsync,
    updatePreferences: preferencesMutation.mutateAsync,
    isMutatingWishlist: toggleWishlistMutation.isPending,
    isSavingPreferences: preferencesMutation.isPending,
    isSubmittingSupportCase: supportCaseMutation.isPending,
    wishlistCount:
      customerAuth.isAuthenticated && accessToken
        ? (portalQuery.data?.stats.wishlistCount ?? 0)
        : guestWishlistProductIds.length,
    isWishlisted: (productId: string) =>
      customerAuth.isAuthenticated && accessToken
        ? Boolean(portalQuery.data?.wishlist.some((item) => item.id === productId))
        : guestWishlistProductIds.includes(productId),
  }
}
