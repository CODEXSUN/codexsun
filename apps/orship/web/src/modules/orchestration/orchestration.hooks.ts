import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DockerContainerAction, PrerequisiteSourceFile, ServiceAction } from './orchestration.types'
import {
  fetchCloudTarget,
  createDeploymentRecord,
  fetchDockerContainers,
  fetchDeploymentEvidence,
  fetchDeploymentRecords,
  fetchOrchestrationOverview,
  fetchPrerequisites,
  fetchPrerequisiteSettings,
  fetchPrerequisiteSource,
  fetchRuntimeFailures,
  fetchServiceLogs,
  fetchAvailableApplications,
  runServiceAction,
  runDockerContainerAction,
  savePrerequisiteSettings,
  savePrerequisiteSource,
  buildPrerequisites,
  installApplication,
  deployApplication,
} from './orchestration.services'

const overviewKey = ['orship', 'services'] as const

export function useOrchestrationOverview() {
  return useQuery({
    queryFn: fetchOrchestrationOverview,
    queryKey: overviewKey,
    refetchInterval: 4_000,
  })
}

export function usePrerequisites() {
  return useQuery({
    queryFn: fetchPrerequisites,
    queryKey: ['orship', 'prerequisites'],
    refetchInterval: 5_000,
  })
}

export function usePrerequisiteSettings() {
  return useQuery({
    queryFn: fetchPrerequisiteSettings,
    queryKey: ['orship', 'prerequisite-settings'],
  })
}

export function useSavePrerequisiteSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: savePrerequisiteSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orship', 'prerequisite-settings'] })
    },
  })
}

export function usePrerequisiteSource(file: PrerequisiteSourceFile) {
  return useQuery({
    queryFn: () => fetchPrerequisiteSource(file),
    queryKey: ['orship', 'prerequisite-source', file],
  })
}

export function useSavePrerequisiteSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ content, file }: { content: string; file: PrerequisiteSourceFile }) =>
      savePrerequisiteSource(file, content),
    onSuccess: async (_, { file }) => {
      await queryClient.invalidateQueries({ queryKey: ['orship', 'prerequisite-source', file] })
    },
  })
}

export function useBuildPrerequisites() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (forceRebuild: boolean) => buildPrerequisites({ forceRebuild }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orship', 'prerequisites'] })
      await queryClient.invalidateQueries({ queryKey: ['orship', 'prerequisite-settings'] })
    },
  })
}

export function useAvailableApplications() {
  return useQuery({
    queryFn: fetchAvailableApplications,
    queryKey: ['orship', 'available-applications'],
  })
}

export function useInstallApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: installApplication,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orship', 'deployments'] })
    },
  })
}

export function useDeployApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deployApplication,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orship', 'deployments'] })
      await queryClient.invalidateQueries({ queryKey: ['orship', 'services'] })
    },
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

export function useDockerContainers() {
  return useQuery({
    queryFn: fetchDockerContainers,
    queryKey: ['orship', 'docker-containers'],
    refetchInterval: 5_000,
  })
}

export function useDockerContainerAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, containerId }: { action: DockerContainerAction; containerId: string }) =>
      runDockerContainerAction(containerId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orship', 'docker-containers'] }),
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
