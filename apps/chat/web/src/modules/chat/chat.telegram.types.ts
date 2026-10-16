export type ChatTelegramAccount = {
  uuid: string;
  apiId: number;
  phoneLabel: string;
  accountLabel: string;
  authState: string;
  lastError: string | null;
  lastSyncedAt: string | null;
};
export type ChatTelegramCredentials = { apiId: number; apiHash: string; phone: string };
export type ChatTelegramDialog = { uuid: string; title: string; channelUuid: string | null };
export type ChatTelegramConversation = { channelUuid: string; channelName: string };
