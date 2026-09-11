import { spawn, type ChildProcess } from 'node:child_process'
import { resolveCodexExecutable } from '../../chat/infrastructure/codex-process.js'
import type { RunbookExecutor } from '../application/runbook.ports.js'

const maximumReportLength = 24_000

export class CodexRunbookExecutor implements RunbookExecutor {
  private readonly active = new Map<string, ChildProcess>()

  execute(input: { prompt: string; runId: string; worktreePath: string }): Promise<{ report: string; success: boolean }> {
    return new Promise((resolve) => {
      const child = spawn(
        resolveCodexExecutable(),
        ['exec', '--sandbox', 'workspace-write', '--skip-git-repo-check', isolatedPrompt(input.prompt)],
        { cwd: input.worktreePath, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
      )
      this.active.set(input.runId, child)
      let report = ''
      const append = (chunk: Buffer) => { report = `${report}${chunk}`.slice(-maximumReportLength) }
      child.stdout.on('data', append)
      child.stderr.on('data', append)
      child.once('error', (error) => { this.active.delete(input.runId); resolve({ report: error.message, success: false }) })
      child.once('exit', (code) => { this.active.delete(input.runId); resolve({ report: report.trim() || `Codex exited with ${code ?? 'an unknown'} status.`, success: code === 0 }) })
    })
  }

  stop(runId: string) {
    const child = this.active.get(runId)
    if (!child) return false
    child.kill()
    return true
  }
}

function isolatedPrompt(prompt: string) {
  return [
    'You are executing a Zetro Runbook in an isolated Git worktree.',
    'Work only inside the approved module scope.',
    'Do not commit, push, merge, create a pull request, deploy, delete the worktree, or modify files outside it.',
    'At the end, report the files changed, checks run, results, and remaining risks.',
    '',
    prompt,
  ].join('\n')
}
