#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatRuntimeLogLine } from './runtime-log-capture.mjs'

const projectRoot = resolve(import.meta.dirname, '..')

export async function readRuntimeFailures({ limit = 50, root = projectRoot } = {}) {
  const failureRoot = resolve(root, 'storage/app/private/runtime/failures')
  const files = await readFailureFiles(failureRoot)
  const records = await Promise.all(
    files.map(async (file) => parseRecords(await readFile(resolve(failureRoot, file), 'utf8'))),
  )
  return records
    .flat()
    .sort((left, right) => String(left.time).localeCompare(String(right.time)))
    .slice(-limit)
}

async function main() {
  const limit = readLimit(process.argv.slice(2))
  const records = await readRuntimeFailures({ limit })
  if (records.length === 0) {
    process.stdout.write('No captured runtime failures.\n')
    return
  }

  process.stdout.write(`Recent runtime failures (${records.length}):\n`)
  for (const record of records) {
    const component = String(record.component ?? 'runtime')
    const formatted = formatRuntimeLogLine(component, JSON.stringify(record))
    if (formatted) process.stdout.write(`${formatted.clean}\n`)
  }
}

function parseRecords(content) {
  return content
    .split(/\r?\n/u)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
}

async function readFailureFiles(root) {
  try {
    return (await readdir(root)).filter((file) => file.endsWith('.jsonl'))
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

function readLimit(argumentsList) {
  const value = argumentsList.find((argument) => argument.startsWith('--limit='))?.slice(8)
  const parsed = Number(value ?? 50)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1_000) {
    throw new Error('--limit must be an integer from 1 through 1000.')
  }
  return parsed
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
