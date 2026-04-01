import type { HealthStatus } from '../model/health-status'

export function getHealthStatus(): HealthStatus {
  return {
    app: 'custom-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
}
