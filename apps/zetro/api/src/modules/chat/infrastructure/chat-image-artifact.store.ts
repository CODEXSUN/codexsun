import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ChatImageArtifact } from '@codexsun/zetro-contracts'

type StoredImage = ChatImageArtifact & { conversationId: string; path: string }

const supportedMimeTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export class ChatImageArtifactStore {
  constructor(private readonly root: string) {}

  save(conversationId: string, input: { dataUrl: string; name: string }): ChatImageArtifact {
    const { data, mimeType } = decodeImage(input.dataUrl)
    const extension = supportedMimeTypes.get(mimeType)
    if (!extension) throw new Error('Use a PNG, JPEG, or WebP image.')
    if (data.length > 2 * 1024 * 1024) throw new Error('Images must be 2 MB or smaller.')
    const id = randomUUID()
    const directory = join(this.root, conversationId)
    const image: ChatImageArtifact = { id, mimeType, name: input.name, sizeBytes: data.length }
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, `${id}.${extension}`), data)
    writeFileSync(join(directory, `${id}.json`), JSON.stringify({ ...image, conversationId }))
    return image
  }

  resolve(conversationId: string, ids: string[]): string[] {
    return ids.map((id) => this.read(conversationId, id).path)
  }

  private read(conversationId: string, id: string): StoredImage {
    const directory = join(this.root, conversationId)
    const metadata = JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8')) as StoredImage
    if (metadata.id !== id || metadata.conversationId !== conversationId) {
      throw new Error('The uploaded image is not available in this conversation.')
    }
    const extension = supportedMimeTypes.get(metadata.mimeType)
    if (!extension) throw new Error('The uploaded image format is unsupported.')
    return { ...metadata, path: join(directory, `${id}.${extension}`) }
  }
}

function decodeImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new Error('Use a PNG, JPEG, or WebP image.')
  return { data: Buffer.from(match[2], 'base64'), mimeType: match[1] as ChatImageArtifact['mimeType'] }
}
