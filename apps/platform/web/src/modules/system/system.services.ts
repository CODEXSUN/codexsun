import {
  successEnvelopeSchema,
  systemRuntimeDataSchema,
  type SystemRuntimeData,
} from '@codexsun/platform-contracts'
import { runtimeConfig } from '../../runtime-config'

const systemRuntimeResponseSchema = successEnvelopeSchema(systemRuntimeDataSchema)

export async function getSystemRuntime(signal?: AbortSignal): Promise<SystemRuntimeData> {
  const response = await fetch(`${runtimeConfig.VITE_PLATFORM_API_URL}/api/system/runtime`, {
    headers: { accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`The Platform API returned HTTP ${response.status}.`)
  return systemRuntimeResponseSchema.parse(await response.json()).data
}
