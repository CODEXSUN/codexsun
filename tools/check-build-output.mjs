import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

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

async function createChunkGraph() {
  const chunkPaths = new Set(chunks.map((chunk) => chunk.path))
  const graph = new Map()
  const staticImportPattern = /\b(?:import|export)\s*(?:[^"'()]*?\sfrom\s*)?["'](\.[^"']+)["']/g

  await Promise.all(
    chunks.map(async (chunk) => {
      const source = await readFile(chunk.path, 'utf8')
      const dependencies = new Set()

      for (const match of source.matchAll(staticImportPattern)) {
        const dependency = resolve(dirname(chunk.path), match[1])

        if (chunkPaths.has(dependency)) {
          dependencies.add(dependency)
        }
      }

      graph.set(chunk.path, dependencies)
    }),
  )

  return graph
}

function findChunkCycle(graph) {
  const visited = new Set()
  const active = new Set()
  const path = []

  function visit(chunk) {
    if (active.has(chunk)) {
      return [...path.slice(path.indexOf(chunk)), chunk]
    }

    if (visited.has(chunk)) {
      return null
    }

    visited.add(chunk)
    active.add(chunk)
    path.push(chunk)

    for (const dependency of graph.get(chunk) ?? []) {
      const cycle = visit(dependency)

      if (cycle) {
        return cycle
      }
    }

    path.pop()
    active.delete(chunk)
    return null
  }

  for (const chunk of graph.keys()) {
    const cycle = visit(chunk)

    if (cycle) {
      return cycle
    }
  }

  return null
}

const chunkCycle = findChunkCycle(await createChunkGraph())

if (chunkCycle) {
  const details = chunkCycle.map((chunk) => relative(applicationsDirectory, chunk)).join(' -> ')

  throw new Error(`Production JavaScript chunks must not contain static import cycles.\n${details}`)
}

console.log(
  `Production JavaScript chunk budget and dependency graph passed for ${chunks.length} chunk(s).`,
)
