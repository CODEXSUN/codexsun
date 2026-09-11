import { execFileSync } from 'node:child_process'
import type { CodingWorkerCheckResult } from '@codexsun/zetro-contracts'

export function verifyWorkerChecks(
  worktreePath: string,
  checks: string[],
): CodingWorkerCheckResult[] {
  return checks.map((command) => runCheck(worktreePath, command))
}

function runCheck(worktreePath: string, command: string): CodingWorkerCheckResult {
  const startedAt = Date.now()
  const parsed = parseAllowedCheck(command)
  try {
    const output = execFileSync(parsed.file, parsed.arguments, {
      cwd: worktreePath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    return result(command, 0, Date.now() - startedAt, output, true)
  } catch (error) {
    const details = error instanceof Error ? (error as CommandFailure) : undefined
    const exitCode = typeof details?.status === 'number' ? details.status : 1
    const output = [details?.stdout, details?.stderr, details?.message]
      .filter((value) => typeof value === 'string' && value.trim())
      .join('\n')
    return result(command, exitCode, Date.now() - startedAt, output, false)
  }
}

type CommandFailure = Error & { status?: number; stderr?: string; stdout?: string }

function parseAllowedCheck(command: string) {
  if (command === 'git diff --check') return { arguments: ['diff', '--check'], file: 'git' }
  const npmScript = /^npm(?:\.cmd)? run ([a-z0-9:_-]+)$/i.exec(command)
  if (npmScript) return { arguments: ['run', npmScript[1]], file: 'npm.cmd' }
  throw new Error(`The check is not allowlisted: ${command}`)
}

function result(
  command: string,
  exitCode: number,
  durationMs: number,
  output: string | undefined,
  passed: boolean,
): CodingWorkerCheckResult {
  return {
    command,
    durationMs,
    exitCode,
    outputSummary: (output?.trim() || (passed ? 'Completed successfully.' : 'Check failed.')).slice(
      0,
      2000,
    ),
    passed,
  }
}
