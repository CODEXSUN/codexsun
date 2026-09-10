import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  listRepositoryScripts,
  runRepositoryScript,
} from '../src/modules/developer-tools/developer-tools.tasks.js'

test('executes a real npm script and rejects failure and pre-cancellation', async () => {
  const repositoryPath = await mkdtemp(join(tmpdir(), 'zetro-script-execution-'))
  try {
    await writeFile(
      join(repositoryPath, 'package.json'),
      JSON.stringify({
        scripts: { 'check:pass': 'node pass.cjs', 'check:fail': 'node fail.cjs' },
      }),
    )
    await writeFile(join(repositoryPath, 'pass.cjs'), 'console.log("script-executed")')
    await writeFile(
      join(repositoryPath, 'fail.cjs'),
      'console.error("token=private failure"); process.exitCode=1',
    )
    const result = await runRepositoryScript(
      repositoryPath,
      'check:pass',
      new AbortController().signal,
    )
    assert.match(result.output, /script-executed/)
    await assert.rejects(
      runRepositoryScript(repositoryPath, 'check:fail', new AbortController().signal),
      (error) => {
        assert.match(error.message, /failure/)
        assert.doesNotMatch(error.message, /token=private/)
        return true
      },
    )
    await assert.rejects(runRepositoryScript(repositoryPath, 'check:pass', AbortSignal.abort()))
  } finally {
    await rm(repositoryPath, { force: true, recursive: true })
  }
})

test('lists deterministic maintenance scripts and excludes arbitrary commands', async () => {
  const repositoryPath = await mkdtemp(join(tmpdir(), 'zetro-scripts-'))
  try {
    await writeFile(
      join(repositoryPath, 'package.json'),
      JSON.stringify({
        scripts: {
          build: 'vite build',
          clean: 'node clean.mjs',
          deploy: 'node deploy.mjs',
          'release:github': 'node release.mjs',
          test: 'node --test',
        },
      }),
    )
    assert.deepEqual(await listRepositoryScripts(repositoryPath), [
      'build',
      'clean',
      'release:github',
      'test',
    ])
  } finally {
    await rm(repositoryPath, { force: true, recursive: true })
  }
})
