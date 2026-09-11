#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { findWorkspacePackageFiles } from './version-bump.mjs'

const ROOT = resolve(import.meta.dirname, '..')

export function checkVersions(rootDir) {
  const rootVersion = String(readJson(join(rootDir, 'package.json')).version)
  const zetroVersion = readWorkspaceVersion(rootDir, 'apps/zetro/web/package.json', rootVersion)
  const failures = []

  for (const file of findWorkspacePackageFiles(rootDir)) {
    const version = String(readJson(file).version)
    const expected = isZetroWorkspace(rootDir, file) ? zetroVersion : rootVersion
    if (version !== expected) {
      failures.push(`${relative(rootDir, file)} version is ${version}; expected ${expected}.`)
    }
  }

  checkLockfile(rootDir, rootVersion, failures)
  checkEnvironmentExample(rootDir, rootVersion, failures)
  checkChangelog(rootDir, rootVersion, failures)
  return { failures, rootVersion }
}

function readWorkspaceVersion(rootDir, path, fallback) {
  const file = join(rootDir, path)
  return existsSync(file) ? String(readJson(file).version) : fallback
}

function isZetroWorkspace(rootDir, file) {
  return relative(rootDir, file).replaceAll('\\', '/').startsWith('apps/zetro/')
}

function checkEnvironmentExample(rootDir, rootVersion, failures) {
  const file = join(rootDir, '.env.example')
  if (!existsSync(file)) return
  const content = readFileSync(file, 'utf8')
  if (!content.includes(`CODEXSUN_VERSION=${rootVersion}`)) {
    failures.push(`.env.example CODEXSUN_VERSION must be ${rootVersion}.`)
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function checkLockfile(rootDir, rootVersion, failures) {
  const lockFile = join(rootDir, 'package-lock.json')
  if (!existsSync(lockFile)) return

  const lock = readJson(lockFile)
  if (String(lock.version) !== rootVersion) {
    failures.push(`package-lock.json version is ${lock.version}; expected ${rootVersion}.`)
  }
  if (lock.packages?.['']?.version && String(lock.packages[''].version) !== rootVersion) {
    failures.push(
      `package-lock root package version is ${lock.packages[''].version}; expected ${rootVersion}.`,
    )
  }
}

function checkChangelog(rootDir, rootVersion, failures) {
  const changelog = readFileSync(join(rootDir, 'assist', 'documentation', 'CHANGELOG.md'), 'utf8')
  const tag = `v-${rootVersion}`
  const label = `v ${rootVersion}`

  for (const [description, expected] of [
    ['current version', `Current version: ${rootVersion}`],
    ['release tag', `Release tag: ${tag}`],
    ['changelog label', `Changelog label: ${label}`],
    ['version section', `## ${tag}`],
  ]) {
    if (!changelog.includes(expected)) {
      failures.push(`Changelog ${description} must be ${expected}.`)
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { failures, rootVersion } = checkVersions(ROOT)
  if (failures.length > 0) {
    console.error(`Version check failed for ${rootVersion}:`)
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }
  console.log(`Version check passed for ${rootVersion}.`)
}
