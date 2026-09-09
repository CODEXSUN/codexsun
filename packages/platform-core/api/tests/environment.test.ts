import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { PlatformEnvironmentLoader } from '../src/index.js'

test('environment loader publishes the root file with stable precedence and fallbacks', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'codexsun-environment-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const path = join(directory, '.env')
  await writeFile(path, 'FILE_ONLY=from-file\nPORT_ALIAS=6010\nEXTERNAL=from-file\n')
  const source: NodeJS.ProcessEnv = { EXTERNAL: 'from-process' }

  const values = PlatformEnvironmentLoader.load({
    aliases: { API_PORT: ['PORT_ALIAS'] },
    defaults: { DEFAULT_ONLY: 'fallback' },
    path,
    source,
  })

  assert.equal(values.EXTERNAL, 'from-process')
  assert.equal(values.FILE_ONLY, 'from-file')
  assert.equal(values.API_PORT, '6010')
  assert.equal(values.DEFAULT_ONLY, 'fallback')
  assert.equal(source.FILE_ONLY, 'from-file')
  assert.equal(source.API_PORT, '6010')
  assert(Object.isFrozen(values))
})

test('environment loader uses defaults when the root file is absent', () => {
  const source: NodeJS.ProcessEnv = {}
  const values = PlatformEnvironmentLoader.load({
    defaults: { APP_ENV: 'development' },
    path: join(tmpdir(), `missing-codexsun-${process.pid}`, '.env'),
    source,
  })

  assert.equal(values.APP_ENV, 'development')
  assert.equal(source.APP_ENV, 'development')
})
