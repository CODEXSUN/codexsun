import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function verifyScriptTask(origin, directory, sessionToken) {
  const repositoryPath = join(directory, 'repository')
  await mkdir(repositoryPath)
  execFileSync('git', ['init', repositoryPath], { windowsHide: true, stdio: 'ignore' })
  await writeFile(
    join(repositoryPath, 'package.json'),
    JSON.stringify({
      scripts: { 'check:release:fixture': 'node verify.cjs' },
    }),
  )
  await writeFile(join(repositoryPath, 'verify.cjs'), 'console.log("release-gate-executed")')
  const headers = { 'Content-Type': 'application/json', 'x-zetro-session-token': sessionToken }
  const call = async (path, method = 'GET', body) => {
    const response = await fetch(`${origin}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    })
    assert.equal(response.ok, true, `${method} ${path}: ${response.status}`)
    return response.json()
  }
  const { project } = await call('/api/v1/projects', 'POST', {
    name: 'Release gate fixture',
    repositoryPath,
  })
  const prefix = `/api/v1/projects/${project.id}/developer-tools`
  const untrusted = await fetch(`${origin}${prefix}/script-tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ script: 'check:release:fixture' }),
  })
  assert.equal(untrusted.ok, false)
  const settings = await call(`${prefix}/settings`)
  await call(`${prefix}/settings`, 'PATCH', {
    ...settings.effective,
    inheritGlobal: false,
    trustedRepository: true,
  })
  const { scripts } = await call(`${prefix}/scripts`)
  assert.ok(scripts.includes('check:release:fixture'))
  const { task } = await call(`${prefix}/script-tasks`, 'POST', { script: 'check:release:fixture' })
  for (let attempt = 0; attempt < 100; attempt++) {
    const { task: current } = await call(`/api/v1/system-tasks/${task.id}`)
    if (['completed', 'failed', 'blocked', 'stopped'].includes(current.status)) {
      assert.equal(current.status, 'completed', current.error ?? 'Script task did not complete')
      assert.match(current.result.output, /release-gate-executed/)
      assert.equal(current.result.exitCode, 0)
      return
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error('Packaged script task timed out.')
}
