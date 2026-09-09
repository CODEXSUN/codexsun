import type {
  ServiceAction,
  ServiceLogsResponse,
  ServiceSnapshot,
  RuntimeFailureOverview,
} from '@codexsun/orship-contracts'

export type OrchestrationTarget = {
  applicationId: string
  controllable: boolean
  healthPath: string
  id: string
  kind: 'api' | 'web' | 'worker'
  port: number
  protected: boolean
}

export interface OrchestrationTargetCatalog {
  list(): Promise<readonly OrchestrationTarget[]>
}

export interface OrchestrationProcessGateway {
  act(target: OrchestrationTarget, action: ServiceAction): Promise<void>
  inspect(targets: readonly OrchestrationTarget[]): Promise<ServiceSnapshot[]>
  readLogs(target: OrchestrationTarget, limit: number): Promise<ServiceLogsResponse>
  readFailures(limit: number): Promise<RuntimeFailureOverview>
}
