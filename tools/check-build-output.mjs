import { readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const maximumChunkSizeInBytes = 400_000
const applicationsDirectory = resolve('dist/apps')

async function listJavaScriptChunks(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const chunks = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name)

      if (entry.isDirectory()) {
        return listJavaScriptChunks(path)
      }

      if (entry.name.endsWith('.js')) {
        return [{ path, size: (await stat(path)).size }]
      }

      return []
    }),
  )

  return chunks.flat()
}

const chunks = await listJavaScriptChunks(applicationsDirectory)
const oversizedChunks = chunks.filter((chunk) => chunk.size > maximumChunkSizeInBytes)

if (oversizedChunks.length > 0) {
  const details = oversizedChunks.map((chunk) => `${chunk.path}: ${chunk.size} bytes`).join('\n')

  throw new Error(`Production JavaScript chunks must not exceed 400 KB.\n${details}`)
}

console.log(`Production JavaScript chunk budget passed for ${chunks.length} chunk(s).`)
