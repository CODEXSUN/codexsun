import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ServiceAction } from './orchestration.types'
import {
  fetchOrchestrationOverview,
  fetchServiceLogs,
  runServiceAction,
} from './orchestration.services'

const overviewKey = ['orship', 'services'] as const

export function useOrchestrationOverview() {
  return useQuery({
    queryFn: fetchOrchestrationOverview,
    queryKey: overviewKey,
    refetchInterval: 4_000,
  })
}

export function useServiceLogs(serviceId: string | undefined) {
  return useQuery({
    enabled: Boolean(serviceId),
    queryFn: () => fetchServiceLogs(serviceId!),
    queryKey: ['orship', 'logs', serviceId],
    refetchInterval: 2_500,
  })
}

export function useServiceAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, serviceId }: { action: ServiceAction; serviceId: string }) =>
      runServiceAction(serviceId, action),
    onSuccess: async (_, { serviceId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: overviewKey }),
        queryClient.invalidateQueries({ queryKey: ['orship', 'logs', serviceId] }),
      ])
    },
  })
}
