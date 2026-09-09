#!/usr/bin/env node

import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'

const root = resolve(import.meta.dirname, '..')
const desktop = resolve(root, 'apps/zetro/desktop')
const runtime = resolve(root, 'dist/apps/zetro/desktop/runtime')
const target = resolve(root, 'dist/apps/zetro/desktop/target')
const action = process.argv[2]

const actions = {
  build: () => runTauri(['build', '--no-bundle']),
  'bundle-msi': () => runTauri(['build', '--bundles', 'msi']),
  check: check,
  dev: () => runTauri(['dev']),
  lint: () => runCargo(['clippy', '--all-targets', '--', '-D', 'warnings'], true),
  prepare: prepare,
  test: () => runCargo(['test'], true),
}

if (!(action in actions)) throw new Error(`Unknown Zetro desktop action: ${action ?? ''}`)
await actions[action]()

async function prepare() {
  const npmCli = process.env.npm_execpath
  if (!npmCli) throw new Error('The npm CLI path is unavailable.')
  run(process.execPath, [npmCli, 'run', 'build', '--workspace', '@codexsun/platform-core-api'])
  run(process.execPath, [npmCli, 'run', 'build', '--workspace', '@codexsun/zetro-web'], {
    VITE_ZETRO_API_URL: 'http://127.0.0.1:6050',
  })
  await mkdir(runtime, { recursive: true })
  await build({
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module';const require=__createRequire(import.meta.url);",
    },
    bundle: true,
    entryPoints: [resolve(root, 'apps/zetro/api/src/server.ts')],
    format: 'esm',
    outfile: resolve(runtime, 'zetro-api.mjs'),
    platform: 'node',
    target: 'node20',
  })
  await copyFile(process.execPath, resolve(runtime, 'node.exe'))
}

async function check() {
  await prepare()
  const npmCli = process.env.npm_execpath
  if (!npmCli) throw new Error('The npm CLI path is unavailable.')
  run(process.execPath, [npmCli, 'exec', '--', 'tsc', '--project', 'tsconfig.json'])
  await runCargo(['check'])
}

async function runTauri(arguments_, prepareFirst = false) {
  if (prepareFirst) await prepare()
  const npmCli = process.env.npm_execpath
  if (!npmCli) throw new Error('The npm CLI path is unavailable.')
  run(process.execPath, [npmCli, 'exec', '--', 'tauri', ...arguments_])
}

async function runCargo(arguments_, prepareFirst = false) {
  if (prepareFirst) await prepare()
  run('cargo', arguments_, {}, resolve(desktop, 'src-tauri'))
}

function run(command, arguments_, environment = {}, cwd = desktop) {
  const result = spawnSync(command, arguments_, {
    cwd,
    env: { ...process.env, ...environment, CARGO_TARGET_DIR: target },
    stdio: 'inherit',
    windowsHide: true,
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
