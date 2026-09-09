import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { GitDeliveryFlowInput } from './git-delivery.types.js'

const executeFile = promisify(execFile)
const commandOptions = { maxBuffer: 4_000_000, windowsHide: true } as const

export class GitDeliveryCommandError extends Error {}

export interface RepositoryReleaseProfile {
  canBumpVersion: boolean
  canWriteChangelog: boolean
  currentVersion: string | null
  nextVersion: string | null
}

export async function readReleaseProfile(
  repositoryPath: string,
): Promise<RepositoryReleaseProfile> {
  try {
    const pkg = JSON.parse(await readFile(join(repositoryPath, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>
      version?: string
    }
    const currentVersion = isVersion(pkg.version) ? pkg.version : null
    return {
      canBumpVersion: Boolean(pkg.scripts?.['version:bump'] && currentVersion),
      canWriteChangelog: Boolean(pkg.scripts?.['changelog:append'] && currentVersion),
      currentVersion,
      nextVersion: currentVersion ? bumpPatch(currentVersion) : null,
    }
  } catch {
    return {
      canBumpVersion: false,
      canWriteChangelog: false,
      currentVersion: null,
      nextVersion: null,
    }
  }
}

export async function bumpRepositoryVersion(
  repositoryPath: string,
  input: GitDeliveryFlowInput,
): Promise<string> {
  const databaseFlag =
    input.databaseUpdate === 'yes'
      ? '--database-update'
      : input.databaseUpdate === 'no'
        ? '--no-database-update'
        : undefined
  return npm(repositoryPath, [
    'run',
    'version:bump',
    '--',
    '--title',
    input.title,
    ...(databaseFlag ? [databaseFlag] : []),
  ])
}

export function appendRepositoryChangelog(
  repositoryPath: string,
  input: GitDeliveryFlowInput,
): Promise<string> {
  const databaseUpdate = input.databaseUpdate === 'yes' ? 'Yes' : 'No'
  return npm(repositoryPath, [
    'run',
    'changelog:append',
    '--',
    '--title',
    input.title,
    '--note',
    input.note,
    '--database-update',
    databaseUpdate,
  ])
}

function npm(repositoryPath: string, args: string[]): Promise<string> {
  return command(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, repositoryPath)
}

async function command(executable: string, args: string[], cwd: string): Promise<string> {
  try {
    const result = await executeFile(executable, args, { ...commandOptions, cwd })
    return result.stdout.trim()
  } catch (error) {
    throw new GitDeliveryCommandError(readCommandError(error))
  }
}

function bumpPatch(version: string): string {
  const [major, minor, patch] = version.split('.').map(Number)
  return `${major}.${minor}.${patch + 1}`
}

function isVersion(value: unknown): value is string {
  return typeof value === 'string' && /^\d+\.\d+\.\d+$/u.test(value)
}

function readCommandError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'stderr' in error) {
    const stderr = String(error.stderr).trim()
    if (stderr) return stderr
  }
  return error instanceof Error ? error.message : 'Release command failed.'
}
