import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CustomerPortalPreferencesUpdatePayload } from "@ecommerce/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"

export function useStorefrontCustomerPortal() {
  const queryClient = useQueryClient()
  const customerAuth = useStorefrontCustomerAuth()
  const accessToken = customerAuth.accessToken

  const portalQuery = useQuery({
    queryKey: queryKeys.storefrontCustomerPortal,
    queryFn: () => storefrontApi.getCustomerPortal(accessToken!),
    enabled: Boolean(accessToken && customerAuth.isAuthenticated),
    staleTime: 30_000,
  })

  const ordersQuery = useQuery({
    queryKey: queryKeys.storefrontCustomerOrders,
    queryFn: () => storefrontApi.listCustomerOrders(accessToken!),
    enabled: Boolean(accessToken && customerAuth.isAuthenticated),
    staleTime: 30_000,
  })

  const toggleWishlistMutation = useMutation({
    mutationFn: (productId: string) => storefrontApi.toggleCustomerWishlist(accessToken!, productId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storefrontCustomerPortal, data)
    },
  })

  const preferencesMutation = useMutation({
    mutationFn: (payload: CustomerPortalPreferencesUpdatePayload) =>
      storefrontApi.updateCustomerPortalPreferences(accessToken!, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.storefrontCustomerPortal, data)
    },
  })

  return {
    portalQuery,
    ordersQuery,
    toggleWishlist: toggleWishlistMutation.mutateAsync,
    updatePreferences: preferencesMutation.mutateAsync,
    isMutatingWishlist: toggleWishlistMutation.isPending,
    isSavingPreferences: preferencesMutation.isPending,
    isWishlisted: (productId: string) =>
      Boolean(portalQuery.data?.wishlist.some((item) => item.id === productId)),
  }
}
