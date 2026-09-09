import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'
import { hiddenWindowsProcessOptions, preparePort } from './service-lifecycle.mjs'

const projectRoot = resolve(import.meta.dirname, '..')

test('Windows helper processes stay hidden', () => {
  assert.equal(hiddenWindowsProcessOptions.windowsHide, true)
})

test('Windows preflight replaces an owned listener without an interactive prompt', async (context) => {
  if (process.platform !== 'win32') {
    context.skip('Windows process lifecycle test')
    return
  }

  const child = spawn(
    process.execPath,
    [
      '-e',
      "const net=require('node:net');const server=net.createServer();server.listen(0,'127.0.0.1',()=>process.send({port:server.address().port}));",
      projectRoot,
    ],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      windowsHide: true,
    },
  )
  context.after(() => {
    if (child.exitCode === null) child.kill()
  })

  const port = await new Promise((resolvePort, rejectPort) => {
    child.once('error', rejectPort)
    child.once('message', ({ port: selectedPort }) => resolvePort(selectedPort))
  })

  await preparePort({ host: '127.0.0.1', label: 'test', port, workspacePath: projectRoot })
  if (child.exitCode === null) await new Promise((resolveExit) => child.once('exit', resolveExit))

  assert.notEqual(child.exitCode, null)
})

test('Windows preflight stops a marker-owned watcher tree', async (context) => {
  if (process.platform !== 'win32') {
    context.skip('Windows process lifecycle test')
    return
  }

  const watcher = spawn(
    process.execPath,
    [
      '-e',
      [
        "const {spawn}=require('node:child_process')",
        "const listener=spawn(process.execPath,['-e',\"const net=require('node:net');const server=net.createServer();server.listen(0,'127.0.0.1',()=>process.send({port:server.address().port}))\"],{stdio:['ignore','ignore','ignore','ipc'],windowsHide:true})",
        "listener.once('message',(message)=>process.send(message))",
      ].join(';'),
      projectRoot,
    ],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      windowsHide: true,
    },
  )
  context.after(() => {
    if (watcher.exitCode === null) watcher.kill()
  })

  const port = await new Promise((resolvePort, rejectPort) => {
    watcher.once('error', rejectPort)
    watcher.once('message', ({ port: selectedPort }) => resolvePort(selectedPort))
  })

  await preparePort({
    host: '127.0.0.1',
    label: 'watcher test',
    ownedProcessId: watcher.pid,
    port,
    workspacePath: projectRoot,
  })
  if (watcher.exitCode === null) {
    await new Promise((resolveExit) => watcher.once('exit', resolveExit))
  }

  assert.notEqual(watcher.exitCode, null)
})
