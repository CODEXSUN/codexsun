import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { listRepositoryScripts } from '../src/modules/developer-tools/developer-tools.tasks.js'

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
