import type { IncomingMessage, ServerResponse } from 'node:http'
import { getHealthStatus } from '../application/get-health-status'
import { writeJson } from '../../../shared/http/json-response'

export function handleHealthRequest(_request: IncomingMessage, response: ServerResponse) {
  writeJson(response, 200, getHealthStatus())
}
