import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import type { Environment } from './config.js'

export interface StorageDirectories {
  check(): Promise<void>
  privateDirectory: string
  publicDirectory: string
}

export async function createStorage(
  environment: Environment,
  projectRoot: string,
): Promise<StorageDirectories> {
  const root = resolve(projectRoot, environment.STORAGE_ROOT)
  const privateDirectory = resolve(root, 'private')
  const publicDirectory = resolve(root, 'public')

  await Promise.all([
    mkdir(privateDirectory, { recursive: true }),
    mkdir(publicDirectory, { recursive: true }),
  ])

  return {
    check: () => checkStorage(privateDirectory, publicDirectory),
    privateDirectory,
    publicDirectory,
  }
}

async function checkStorage(privateDirectory: string, publicDirectory: string): Promise<void> {
  await access(publicDirectory, constants.R_OK | constants.W_OK)
  const probePath = resolve(privateDirectory, `.health-${randomUUID()}`)
  const probeValue = randomUUID()

  try {
    await writeFile(probePath, probeValue, { encoding: 'utf8', flag: 'wx' })
    const storedValue = await readFile(probePath, 'utf8')
    if (storedValue !== probeValue) throw new Error('The private storage probe returned bad data.')
  } finally {
    await unlink(probePath).catch((error: unknown) => {
      if (!isMissingFileError(error)) throw error
    })
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
