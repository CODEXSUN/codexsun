export const workspaceTargets = ['site', 'ecommerce', 'billing'] as const

export type WorkspaceTarget = (typeof workspaceTargets)[number]

function normalizeWorkspaceTarget(value: string | undefined): WorkspaceTarget {
  if (value === 'app') {
    return 'billing'
  }

  if (value === 'site' || value === 'ecommerce' || value === 'billing') {
    return value
  }

  return 'site'
}

function parseWorkspaceTarget(value: string | undefined): WorkspaceTarget | null {
  if (value === 'app') {
    return 'billing'
  }

  if (value === 'site' || value === 'ecommerce' || value === 'billing') {
    return value
  }

  return null
}

const workspaceTargetOverride = parseWorkspaceTarget(import.meta.env.VITE_APP_TARGET)

export const isWorkspaceTargetLocked = Boolean(workspaceTargetOverride)
export const defaultWorkspaceTarget = normalizeWorkspaceTarget(
  workspaceTargetOverride || import.meta.env.VITE_APP_DEFAULT_WORKSPACE,
)

export const defaultWorkspacePath: Record<WorkspaceTarget, string> = {
  site: '/admin/dashboard/site',
  ecommerce: '/admin/dashboard/ecommerce',
  billing: '/admin/dashboard/billing',
}
