import { suiteApps } from '../../app-suite'
import { defineFrontendShell, type FrontendShellDefinition, type FrontendShellId } from '../shells/shell-definition'

const frontendApplicationIds = new Set<FrontendShellId>(['billing', 'ecommerce', 'mcp'])
const defaultFrontendApplicationId: FrontendShellId = 'ecommerce'

function normalizeFrontendApplicationId(value: unknown): FrontendShellId {
  const normalized = String(value ?? '').trim().toLowerCase()
  return frontendApplicationIds.has(normalized as FrontendShellId)
    ? normalized as FrontendShellId
    : defaultFrontendApplicationId
}

function resolveApplicationName(id: FrontendShellId) {
  return suiteApps.find((app) => app.id === id)?.name ?? id
}

const frontendApplications: Record<FrontendShellId, FrontendShellDefinition> = {
  billing: {
    ...defineFrontendShell(
      'billing',
      resolveApplicationName('billing'),
      () => import('@billing-web/shell/billing-shell'),
      'BillingShellRoot',
    ),
  },
  ecommerce: {
    ...defineFrontendShell(
      'ecommerce',
      resolveApplicationName('ecommerce'),
      () => import('@ecommerce-web/shell/ecommerce-shell'),
      'EcommerceShellRoot',
    ),
  },
  mcp: {
    ...defineFrontendShell(
      'mcp',
      resolveApplicationName('mcp'),
      () => import('@mcp-web/shell/mcp-shell'),
      'McpShellRoot',
    ),
  },
}

export function resolveFrontendApplication() {
  const target = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_APP_TARGET : 'ecommerce'
  const applicationId = normalizeFrontendApplicationId(target || 'ecommerce')
  return frontendApplications[applicationId]
}
