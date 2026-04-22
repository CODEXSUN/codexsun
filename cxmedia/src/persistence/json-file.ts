import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8")
    return JSON.parse(content) as T
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code === "ENOENT") {
      return fallback
    }

    throw error
  }
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.tmp`
  const payload = `${JSON.stringify(value, null, 2)}\n`

  await writeFile(temporaryPath, payload, "utf8")
  await rename(temporaryPath, filePath)
}
