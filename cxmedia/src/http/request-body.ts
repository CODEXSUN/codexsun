import type { IncomingMessage } from "node:http"

export async function readRequestBody(
  request: IncomingMessage,
  maxBytes: number
) {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length

    if (size > maxBytes) {
      throw new Error(`Request body exceeds ${maxBytes} bytes.`)
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

export function readJsonBody<T>(buffer: Buffer) {
  if (buffer.length === 0) {
    throw new Error("JSON request body is required.")
  }

  return JSON.parse(buffer.toString("utf8")) as T
}
