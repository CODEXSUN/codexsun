import { chatSessionHeaderName, chatPromptRequestSchema } from '@codexsun/zetro-contracts'

export { chatPromptRequestSchema }

export function readChatSession(headers: Record<string, string | string[] | undefined>) {
  const value = headers[chatSessionHeaderName]
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{1,128}$/.test(value)) {
    throw new Error('A valid Zetro chat session is required.')
  }
  return value
}
