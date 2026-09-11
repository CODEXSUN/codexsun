import {
  cloudTargetSchema,
  cloudTargetUpdateSchema,
  deploymentEvidenceSchema,
  deploymentRecordSchema,
  dockerContainerActionRequestSchema,
  dockerContainerActionResponseSchema,
  dockerContainerListSchema,
  deploymentRecordCreateSchema,
  deploymentRecordListSchema,
  orchestrationOverviewSchema,
  prerequisiteOverviewSchema,
  prerequisiteSettingsSchema,
  prerequisiteSettingsUpdateSchema,
  prerequisiteSourceSchema,
  prerequisiteSourceUpdateSchema,
  prerequisiteBuildRequestSchema,
  prerequisiteBuildResponseSchema,
  appInstallationRequestSchema,
  appInstallationResultSchema,
  availableApplicationsSchema,
  serviceActionResponseSchema,
  serviceLogsResponseSchema,
  runtimeFailureOverviewSchema,
  type ServiceAction,
  type CloudTargetUpdate,
  type DeploymentRecordCreate,
  type DockerContainerAction,
  type PrerequisiteSettingsUpdate,
  type PrerequisiteSourceFile,
  type PrerequisiteBuildRequest,
  type AppInstallationRequest,
} from '@codexsun/orship-contracts'

const baseUrl = (
  import.meta.env.PROD ? '' : (import.meta.env.VITE_ORSHIP_API_URL ?? 'http://127.0.0.1:6090')
).replace(/\/$/u, '')

export async function fetchOrchestrationOverview() {
  const response = await fetch(`${baseUrl}/api/orship/v1/services`)
  return orchestrationOverviewSchema.parse(await readResponse(response, 'Could not load services'))
}

export async function fetchPrerequisites() {
  const response = await fetch(`${baseUrl}/api/orship/v1/prerequisites`)
  return prerequisiteOverviewSchema.parse(
    await readResponse(response, 'Could not load shared prerequisites'),
  )
}

export async function fetchPrerequisiteSettings() {
  const response = await fetch(`${baseUrl}/api/orship/v1/prerequisites/settings`)
  return prerequisiteSettingsSchema.parse(
    await readResponse(response, 'Could not load prerequisite settings'),
  )
}

export async function savePrerequisiteSettings(settings: PrerequisiteSettingsUpdate) {
  const response = await fetch(`${baseUrl}/api/orship/v1/prerequisites/settings`, {
    body: JSON.stringify(prerequisiteSettingsUpdateSchema.parse(settings)),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
  return prerequisiteSettingsSchema.parse(
    await readResponse(response, 'Could not save prerequisite settings'),
  )
}

export async function fetchPrerequisiteSource(file: PrerequisiteSourceFile) {
  const response = await fetch(`${baseUrl}/api/orship/v1/prerequisites/source/${file}`)
  return prerequisiteSourceSchema.parse(await readResponse(response, 'Could not load stack source'))
}

export async function savePrerequisiteSource(file: PrerequisiteSourceFile, content: string) {
  const response = await fetch(`${baseUrl}/api/orship/v1/prerequisites/source/${file}`, {
    body: JSON.stringify(prerequisiteSourceUpdateSchema.parse({ content })),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
  return prerequisiteSourceSchema.parse(await readResponse(response, 'Could not save stack source'))
}

export async function buildPrerequisites(input: PrerequisiteBuildRequest) {
  const response = await fetch(`${baseUrl}/api/orship/v1/prerequisites/build`, {
    body: JSON.stringify(prerequisiteBuildRequestSchema.parse(input)),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return prerequisiteBuildResponseSchema.parse(await readResponse(response, 'Could not build prerequisites'))
}

export async function fetchAvailableApplications() {
  const response = await fetch(`${baseUrl}/api/orship/v1/applications`)
  return availableApplicationsSchema.parse(await readResponse(response, 'Could not load available applications'))
}

export async function installApplication(input: AppInstallationRequest) {
  const response = await fetch(`${baseUrl}/api/orship/v1/applications/install`, {
    body: JSON.stringify(appInstallationRequestSchema.parse(input)),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return appInstallationResultSchema.parse(await readResponse(response, 'Could not install application'))
}

export async function deployApplication(profileId: string) {
  const response = await fetch(`${baseUrl}/api/orship/v1/applications/deploy`, {
    body: JSON.stringify({ profileId }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return appInstallationResultSchema.parse(await readResponse(response, 'Could not deploy application'))
}

export async function runServiceAction(serviceId: string, action: ServiceAction) {
  const response = await fetch(`${baseUrl}/api/orship/v1/services/${serviceId}/actions`, {
    body: JSON.stringify({ action }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return serviceActionResponseSchema.parse(
    await readResponse(response, `Could not ${action} ${serviceId}`),
  )
}

export async function fetchServiceLogs(serviceId: string) {
  const response = await fetch(`${baseUrl}/api/orship/v1/services/${serviceId}/logs?limit=180`)
  return serviceLogsResponseSchema.parse(await readResponse(response, 'Could not load logs'))
}

export async function fetchRuntimeFailures() {
  const response = await fetch(`${baseUrl}/api/orship/v1/failures?limit=500`)
  return runtimeFailureOverviewSchema.parse(
    await readResponse(response, 'Could not load runtime failures'),
  )
}

export async function fetchCloudTarget() {
  const response = await fetch(`${baseUrl}/api/orship/v1/cloud-target`)
  return cloudTargetSchema.parse(await readResponse(response, 'Could not load cloud settings'))
}

export async function saveCloudTarget(target: CloudTargetUpdate) {
  const response = await fetch(`${baseUrl}/api/orship/v1/cloud-target`, {
    body: JSON.stringify(cloudTargetUpdateSchema.parse(target)),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
  return cloudTargetSchema.parse(await readResponse(response, 'Could not save cloud settings'))
}

export async function fetchDeploymentEvidence() {
  const response = await fetch(`${baseUrl}/api/orship/v1/deployments/platform/evidence`)
  return deploymentEvidenceSchema.parse(
    await readResponse(response, 'Could not inspect deployment'),
  )
}

export async function fetchDeploymentRecords() {
  const response = await fetch(`${baseUrl}/api/orship/v1/deployments/platform/records`)
  return deploymentRecordListSchema.parse(
    await readResponse(response, 'Could not load deployment history'),
  )
}

export async function createDeploymentRecord(record: DeploymentRecordCreate) {
  const response = await fetch(`${baseUrl}/api/orship/v1/deployments/platform/records`, {
    body: JSON.stringify(deploymentRecordCreateSchema.parse(record)),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return deploymentRecordSchema.parse(
    await readResponse(response, 'Could not save deployment evidence'),
  )
}

export async function fetchDockerContainers() {
  const response = await fetch(`${baseUrl}/api/orship/v1/docker/containers`)
  return dockerContainerListSchema.parse(
    await readResponse(response, 'Could not load managed Docker workloads'),
  )
}

export async function runDockerContainerAction(containerId: string, action: DockerContainerAction) {
  const response = await fetch(
    `${baseUrl}/api/orship/v1/docker/containers/${containerId}/actions`,
    {
      body: JSON.stringify(dockerContainerActionRequestSchema.parse({ action })),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  )
  return dockerContainerActionResponseSchema.parse(
    await readResponse(response, `Could not ${action} Docker workload`),
  )
}

async function readResponse(response: Response, action: string): Promise<unknown> {
  const body = await response.json().catch(() => undefined)
  if (!response.ok) {
    const message = readErrorMessage(body)
    throw new Error(message ? `${action}: ${message}` : `${action} (${response.status}).`)
  }
  return body
}

function readErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('error' in body)) return undefined
  const error = body.error
  return error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : undefined
}
