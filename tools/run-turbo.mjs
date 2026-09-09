import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const turboBinary = resolve(projectRoot, 'node_modules', 'turbo', 'bin', 'turbo')
const argumentsToPass = process.argv.slice(2)

if (argumentsToPass.length === 0) {
  process.stderr.write('Usage: node tools/run-turbo.mjs <turbo arguments>\n')
  process.exitCode = 1
} else {
  const command = existsSync(turboBinary) ? process.execPath : 'turbo'
  const commandArguments = existsSync(turboBinary)
    ? [turboBinary, ...argumentsToPass]
    : argumentsToPass
  const result = spawnSync(command, commandArguments, {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: true,
  })

  cleanWorkspaceReplayLogs()
  if (result.error) throw result.error
  if (result.signal) process.kill(process.pid, result.signal)
  process.exitCode = result.status ?? 1
}

function cleanWorkspaceReplayLogs() {
  for (const sourceRoot of ['apps', 'packages']) {
    removeReplayLogs(join(projectRoot, sourceRoot))
  }
}

function removeReplayLogs(directory) {
  if (!existsSync(directory)) return
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const target = join(directory, entry.name)
    if (entry.name === '.turbo') {
      assertInsideSourceRoots(target)
      rmSync(target, { force: true, recursive: true })
      continue
    }
    removeReplayLogs(target)
  }
}

function assertInsideSourceRoots(target) {
  const location = relative(projectRoot, resolve(target))
  if (!/^(apps|packages)[\\/]/u.test(location)) {
    throw new Error(`Refusing to remove a Turbo replay log outside a source root: ${target}`)
  }
}
