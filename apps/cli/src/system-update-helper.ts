export const defaultRuntimeGitRepositoryUrl = "https://github.com/CODEXSUN/codexsun.git"
export const defaultRuntimeGitBranch = "main"
export const defaultRuntimeGitRemoteName = "origin"

export type RuntimeGitSyncTarget = {
  repositoryUrl: string
  branch: string
  remoteName: string
  remoteRef: string
}

export type RuntimeGitCommandPlan = {
  fetchArgs: string[]
  checkoutArgs: string[]
  pullArgs: string[]
  resetToHeadArgs: string[]
  resetToRemoteArgs: string[]
  cleanArgs: string[]
}

function normalizeRequiredValue(value: string | null | undefined, fallback: string, label: string) {
  const normalized = (value ?? fallback).trim()

  if (!normalized) {
    throw new Error(`${label} is required for runtime git sync.`)
  }

  return normalized
}

export function resolveRuntimeGitSyncTarget(
  repositoryUrl: string | null | undefined,
  branch: string | null | undefined,
  remoteName = defaultRuntimeGitRemoteName
): RuntimeGitSyncTarget {
  const normalizedRemoteName = normalizeRequiredValue(
    remoteName,
    defaultRuntimeGitRemoteName,
    "Git remote name"
  )
  const normalizedRepositoryUrl = normalizeRequiredValue(
    repositoryUrl,
    defaultRuntimeGitRepositoryUrl,
    "Git repository URL"
  )
  const normalizedBranch = normalizeRequiredValue(branch, defaultRuntimeGitBranch, "Git branch")

  return {
    repositoryUrl: normalizedRepositoryUrl,
    branch: normalizedBranch,
    remoteName: normalizedRemoteName,
    remoteRef: `${normalizedRemoteName}/${normalizedBranch}`,
  }
}

export function buildRuntimeGitCommandPlan(target: RuntimeGitSyncTarget): RuntimeGitCommandPlan {
  return {
    fetchArgs: ["fetch", "--prune", target.remoteName],
    checkoutArgs: ["checkout", "-B", target.branch, target.remoteRef],
    pullArgs: ["pull", "--ff-only", target.remoteName, target.branch],
    resetToHeadArgs: ["reset", "--hard", "HEAD"],
    resetToRemoteArgs: ["reset", "--hard", target.remoteRef],
    cleanArgs: ["clean", "-fd"],
  }
}

export function parseRemoteHeadCommit(raw: string): string | null {
  const firstLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) {
    return null
  }

  const [commit] = firstLine.split(/\s+/)

  return commit && /^[0-9a-f]{6,40}$/i.test(commit) ? commit : null
}
