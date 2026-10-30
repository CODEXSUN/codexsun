import { chatRequest } from "./chat.services";
import type {
  ChatTelegramAccount,
  ChatTelegramCredentials,
  ChatTelegramDialog,
  ChatTelegramConversation
} from "./chat.telegram.types";

export function getTelegramAccount() {
  return chatRequest<ChatTelegramAccount | null>("/chat/telegram/account");
}
export function requestTelegramCode(input: ChatTelegramCredentials) {
  return chatRequest<ChatTelegramAccount>("/chat/telegram/account/send-code", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
export function verifyTelegramCode(code: string) {
  return chatRequest<ChatTelegramAccount>("/chat/telegram/account/verify-code", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}
export function verifyTelegramPassword(password: string) {
  return chatRequest<ChatTelegramAccount>("/chat/telegram/account/verify-password", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}
export function disconnectTelegramAccount() {
  return chatRequest<ChatTelegramAccount>("/chat/telegram/account/disconnect", { method: "POST" });
}
export function refreshTelegramDialogs() {
  return chatRequest<ChatTelegramAccount>("/chat/telegram/dialogs/refresh", { method: "POST" });
}
export function listTelegramDialogs() {
  return chatRequest<ChatTelegramDialog[]>("/chat/telegram/dialogs");
}
export function listTelegramConversations() {
  return chatRequest<ChatTelegramConversation[]>("/chat/telegram/conversations");
}
export function linkTelegramDialog(dialogUuid: string, channelUuid: string | null) {
  return chatRequest<{ linked: boolean }>(
    `/chat/telegram/dialogs/${encodeURIComponent(dialogUuid)}/link`,
    { method: "PUT", body: JSON.stringify({ channelUuid }) }
  );
}
