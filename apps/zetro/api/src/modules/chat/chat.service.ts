import type { ChatProvider, ChatTurnRequest, ChatTurnResponse } from './chat.types.js'

export class ChatService {
  public constructor(private readonly provider: ChatProvider) {}

  public respond(request: ChatTurnRequest): Promise<ChatTurnResponse> {
    return this.provider.respond(request)
  }

  public stop(conversationId: string): Promise<boolean> {
    return this.provider.stop(conversationId)
  }
}
