import {
  confirmationResponseSchema,
  registryNodeResponseSchema,
  registryResponseSchema,
  type RegistryNode,
  type RegistryProfileSection,
  type RegistryResponse,
} from '@codexsun/devkit-contracts'

const baseUrl = (import.meta.env.VITE_DEVKIT_API_URL ?? 'http://127.0.0.1:6070').replace(/\/$/, '')

export async function fetchRegistry(): Promise<RegistryResponse> {
  const response = await fetch(`${baseUrl}/api/devkit/v1/project-registry`)
  return registryResponseSchema.parse(
    await readResponse(response, 'Could not load project registry'),
  )
}

export async function createNode(
  input: Pick<RegistryNode, 'kind' | 'summary' | 'title'> & { parentId: string },
) {
  const response = await fetch(
    `${baseUrl}/api/devkit/v1/project-registry/nodes`,
    request('POST', input),
  )
  return registryNodeResponseSchema.parse(
    await readResponse(response, 'Could not create registry node'),
  )
}

export async function updateNode(
  id: string,
  input: Pick<RegistryNode, 'enabled' | 'key' | 'status' | 'summary' | 'title'>,
) {
  const response = await fetch(
    `${baseUrl}/api/devkit/v1/project-registry/nodes/${id}`,
    request('PUT', input),
  )
  return registryNodeResponseSchema.parse(
    await readResponse(response, 'Could not update registry node'),
  )
}

export async function confirmNode(id: string, confirmation: 'approved' | 'needs-revision') {
  const response = await fetch(
    `${baseUrl}/api/devkit/v1/project-registry/${id}/confirm`,
    request('POST', { confirmation }),
  )
  return confirmationResponseSchema.parse(
    await readResponse(response, 'Could not save confirmation'),
  )
}

export async function upsertProfileEntry(
  nodeId: string,
  section: RegistryProfileSection,
  input: { id?: string; key: string; value: string },
) {
  const response = await fetch(
    `${baseUrl}/api/devkit/v1/project-registry/nodes/${nodeId}/profile/${section}`,
    request('POST', input),
  )
  return registryNodeResponseSchema.parse(
    await readResponse(response, 'Could not save profile entry'),
  )
}

function request(method: 'POST' | 'PUT', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

async function readResponse(response: Response, action: string): Promise<unknown> {
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(`${action} (${response.status}).`)
  return body
}
