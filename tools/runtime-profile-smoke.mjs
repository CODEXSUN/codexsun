#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { DeploymentPlanner } from '../dist/packages/runtime/index.js'

const projectRoot = resolve(import.meta.dirname, '..')
const profileId = process.argv[2] ?? 'platform-only'
const timeoutMs = 90_000

const plan = await loadPlan(profileId)
await assertPortsFree(plan.components)

const runtime = spawn(process.execPath, ['tools/runtime-holder.mjs', 'start', profileId], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  windowsHide: true,
})
runtime.stdout.pipe(process.stdout)
runtime.stderr.pipe(process.stderr)

try {
  await waitForReady(runtime, profileId)
  await verifyComponents(plan.components)
  process.stdout.write(`[smoke] profile ${profileId} passed startup and health checks.\n`)
} finally {
  await stopRuntime(runtime)
}

await assertPortsFree(plan.components)
process.stdout.write(`[smoke] profile ${profileId} stopped and released every port.\n`)

async function loadPlan(id) {
  const [catalog, profile] = await Promise.all([
    readJson(resolve(projectRoot, '.container/catalog.json')),
    readJson(resolve(projectRoot, '.container/profiles', `${id}.json`)),
  ])
  return new DeploymentPlanner(catalog).createPlan(profile)
}

async function verifyComponents(components) {
  for (const component of components) {
    const response = await fetch(`http://127.0.0.1:${component.port}${component.healthPath}`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!response.ok) {
      throw new Error(`${component.id} health returned HTTP ${response.status}.`)
    }
    await readFile(
      resolve(projectRoot, 'storage/app/private/runtime/processes', `${component.id}.json`),
      'utf8',
    )
  }
}

function waitForReady(child, id) {
  return new Promise((resolveReady, rejectReady) => {
    const timer = setTimeout(
      () => rejectReady(new Error(`Profile ${id} did not become ready in time.`)),
      timeoutMs,
    )
    const onData = (chunk) => {
      if (!String(chunk).includes(`[runtime] profile ${id} is ready.`)) return
      clearTimeout(timer)
      child.off('exit', onExit)
      resolveReady()
    }
    const onExit = (code) => {
      clearTimeout(timer)
      rejectReady(new Error(`Profile ${id} exited during startup with code ${code ?? 1}.`))
    }
    child.stdout.on('data', onData)
    child.once('exit', onExit)
  })
}

async function stopRuntime(child) {
  if (child.exitCode !== null) return
  const exited = new Promise((resolveExit) => child.once('exit', resolveExit))
  child.send({ type: 'codexsun:shutdown' })
  await Promise.race([
    exited,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('The runtime profile did not stop in time.')), 30_000),
    ),
  ])
}

async function assertPortsFree(components) {
  const occupied = []
  for (const component of components) {
    if (!(await isPortFree(component.port))) occupied.push(`${component.id}:${component.port}`)
  }
  if (occupied.length > 0) {
    throw new Error(
      `Stop active services before the destructive smoke cycle: ${occupied.join(', ')}.`,
    )
  }
}

function isPortFree(port) {
  return new Promise((resolveCheck) => {
    const server = createServer()
    server.once('error', () => resolveCheck(false))
    server.listen(port, '127.0.0.1', () => server.close(() => resolveCheck(true)))
  })
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}
