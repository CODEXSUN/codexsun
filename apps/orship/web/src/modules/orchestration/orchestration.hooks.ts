import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ServiceAction } from './orchestration.types'
import {
  fetchCloudTarget,
  createDeploymentRecord,
  fetchDeploymentEvidence,
  fetchDeploymentRecords,
  fetchOrchestrationOverview,
  fetchRuntimeFailures,
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

export function useCloudTarget() {
  return useQuery({
    queryFn: fetchCloudTarget,
    queryKey: ['orship', 'cloud-target'],
  })
}

export function useDeploymentEvidence() {
  return useQuery({
    queryFn: fetchDeploymentEvidence,
    queryKey: ['orship', 'deployment-evidence', 'platform'],
    refetchInterval: 5_000,
  })
}

export function useDeploymentRecords() {
  return useQuery({
    queryFn: fetchDeploymentRecords,
    queryKey: ['orship', 'deployment-records', 'platform'],
  })
}

export function useDeploymentRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDeploymentRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['orship', 'deployment-records', 'platform'],
      })
    },
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

export function useRuntimeFailures() {
  return useQuery({
    queryFn: fetchRuntimeFailures,
    queryKey: ['orship', 'failures'],
    refetchInterval: 5_000,
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
