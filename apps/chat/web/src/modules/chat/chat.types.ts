export type ChatChannelKind = "channel" | "dm" | "group" | "broadcast";
export type ChatStatus = "active" | "inactive";
export type ChatMemberRole = "admin" | "member";

export type ChatUserOption = {
  email: string;
  name: string;
};

export type ChatChannel = {
  createdAt: string;
  id: number;
  kind: ChatChannelKind;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  name: string;
  status: ChatStatus;
  unreadCount: number;
  updatedAt: string;
  uuid: string;
};

export type ChatChannelDetail = {
  channel: ChatChannel;
  members: ChatMember[];
  messages: ChatMessage[];
};

export type ChatChannelSavePayload = {
  kind: ChatChannelKind;
  members?: string[];
  name: string;
};

export type ChatMember = {
  createdAt: string;
  id: number;
  role: ChatMemberRole;
  status: ChatStatus;
  userEmail: string;
  uuid: string;
};

export type ChatMemberSavePayload = {
  role?: ChatMemberRole;
  userEmail: string;
};

export type ChatAttachment = {
  contentBase64: string;
  fileName: string;
  id: number;
  mimeType: string;
  sizeBytes: number;
  uuid: string;
};

export type ChatAttachmentPayload = {
  base64: string;
  fileName: string;
  mimeType: string;
};

export type ChatMessageReply = {
  body: string;
  senderEmail: string;
  uuid: string;
};

export type ChatMessageReaction = {
  count: number;
  emoji: string;
  own: boolean;
};

export type ChatMessage = {
  attachments: ChatAttachment[];
  body: string;
  channelUuid: string;
  createdAt: string;
  editedAt: string | null;
  id: number;
  reactions: ChatMessageReaction[];
  reply: ChatMessageReply | null;
  senderEmail: string;
  status: ChatStatus;
  updatedAt: string;
  uuid: string;
};

export type ChatMessageSavePayload = {
  attachments?: ChatAttachmentPayload[];
  body: string;
  channelUuid: string;
  replyToUuid?: string;
};
