import type { IncomingMessage, ServerResponse } from 'node:http'
import { getArchitectureManifest } from '../application/get-architecture-manifest'
import { writeJson } from '../../../shared/http/json-response'

export function handleManifestRequest(_request: IncomingMessage, response: ServerResponse) {
  writeJson(response, 200, getArchitectureManifest())
}
