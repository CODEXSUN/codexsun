import type { ChatAttachment } from './agent-chat.types'

export const maxChatAttachments = 4
export const maxChatAttachmentBytes = 4_000_000
export const longPasteCharacterLimit = 4_000

export function shouldAttachPastedText(text: string): boolean {
  return text.length >= longPasteCharacterLimit
}

export function createPastedTextAttachment(text: string, createdAt = new Date()): ChatAttachment {
  const size = new TextEncoder().encode(text).byteLength
  if (size > maxChatAttachmentBytes) {
    throw new Error('The pasted text is larger than 4 MB.')
  }

  return {
    dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`,
    id: crypto.randomUUID(),
    mimeType: 'text/plain',
    name: `pasted-text-${fileTimestamp(createdAt)}.txt`,
  }
}

export async function readChatAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > maxChatAttachmentBytes) {
    throw new Error(`${file.name || 'This file'} is larger than 4 MB.`)
  }

  return {
    dataUrl: await readDataUrl(file),
    id: crypto.randomUUID(),
    mimeType: file.type || 'application/octet-stream',
    name: file.name || 'clipboard-file',
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name || 'the file'}.`))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

function fileTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
}
