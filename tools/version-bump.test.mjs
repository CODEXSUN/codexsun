import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkVersions } from './check-versions.mjs'
import { bumpNextVersion } from './version-bump.mjs'

test('version bump preserves the independent Zetro frontend version', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codexsun-version-'))
  const zetroRoot = join(root, 'apps', 'zetro', 'web')
  const platformRoot = join(root, 'apps', 'platform', 'web')
  const assistRoot = join(root, 'assist', 'documentation')
  try {
    await mkdir(zetroRoot, { recursive: true })
    await mkdir(platformRoot, { recursive: true })
    await mkdir(assistRoot, { recursive: true })
    await writeFile(
      join(root, 'package.json'),
      `${JSON.stringify(
        { name: 'fixture', version: '1.2.3', workspaces: ['apps/*/*'] },
        null,
        2,
      )}\n`,
    )
    await writeFile(
      join(zetroRoot, 'package.json'),
      `${JSON.stringify({ name: '@codexsun/zetro-web', version: '2.0.0' }, null, 2)}\n`,
    )
    await writeFile(
      join(platformRoot, 'package.json'),
      `${JSON.stringify({ name: '@codexsun/platform-web', version: '1.2.3' }, null, 2)}\n`,
    )
    await writeFile(
      join(assistRoot, 'CHANGELOG.md'),
      '# Changelog\n\nCurrent version: 1.2.3\nRelease tag: v-1.2.3\n\n## v-1.2.3\n',
    )

    const result = bumpNextVersion(root, 'Independent frontend version test', {
      databaseUpdate: false,
    })

    assert.equal(result.nextVersion, '1.2.4')
    assert.equal(
      JSON.parse(await readFile(join(zetroRoot, 'package.json'), 'utf8')).version,
      '2.0.0',
    )
    assert.equal(
      JSON.parse(await readFile(join(platformRoot, 'package.json'), 'utf8')).version,
      '1.2.4',
    )
    assert.match(
      await readFile(join(assistRoot, 'CHANGELOG.md'), 'utf8'),
      /Changelog label: v 1\.2\.4/u,
    )
    assert.deepEqual(checkVersions(root).failures, [])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
