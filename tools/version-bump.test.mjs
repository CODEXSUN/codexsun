import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkVersions } from './check-versions.mjs'
import { bumpNextVersion } from './version-bump.mjs'

test('version bump aligns npm, Tauri, and Rust package versions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codexsun-version-'))
  const desktopRoot = join(root, 'apps', 'zetro', 'desktop', 'src-tauri')
  const assistRoot = join(root, 'assist', 'documentation')
  try {
    await mkdir(desktopRoot, { recursive: true })
    await mkdir(assistRoot, { recursive: true })
    await writeFile(
      join(root, 'package.json'),
      `${JSON.stringify({ name: 'fixture', version: '1.2.3', workspaces: [] }, null, 2)}\n`,
    )
    await writeFile(
      join(desktopRoot, 'tauri.conf.json'),
      `${JSON.stringify({ version: '1.2.3' }, null, 2)}\n`,
    )
    await writeFile(
      join(desktopRoot, 'Cargo.toml'),
      '[package]\nname = "zetro-desktop"\nversion = "1.2.3"\n',
    )
    await writeFile(
      join(desktopRoot, 'Cargo.lock'),
      'version = 4\n\n[[package]]\nname = "zetro-desktop"\nversion = "1.2.3"\n',
    )
    await writeFile(
      join(assistRoot, 'CHANGELOG.md'),
      '# Changelog\n\nCurrent version: 1.2.3\nRelease tag: v-1.2.3\nChangelog label: v 1.2.3\n\n## v-1.2.3\n',
    )

    const result = bumpNextVersion(root, 'Desktop version test', { databaseUpdate: false })

    assert.equal(result.nextVersion, '1.2.4')
    assert.equal(
      JSON.parse(await readFile(join(desktopRoot, 'tauri.conf.json'), 'utf8')).version,
      '1.2.4',
    )
    assert.match(await readFile(join(desktopRoot, 'Cargo.toml'), 'utf8'), /version = "1\.2\.4"/u)
    assert.match(await readFile(join(desktopRoot, 'Cargo.lock'), 'utf8'), /version = "1\.2\.4"/u)
    assert.deepEqual(checkVersions(root).failures, [])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
